import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '@server/database';
import { CreateNotificationDto } from './dto/create-notification.dto';

// ── Test Data ──
const mockNotification = {
  id: 'notif-1',
  userId: 'user-1',
  type: 'CASHBACK_RECEIVED',
  message: 'You received 5000 so’m cashback!',
  isRead: false,
  createdAt: new Date('2026-07-18T10:00:00Z'),
};

const mockCreateDto: CreateNotificationDto = {
  userId: 'user-1',
  type: 'CASHBACK_RECEIVED',
  message: 'You received 5000 so’m cashback!',
};

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: any;

  beforeEach(async () => {
    const prismaMock = {
      client: {
        notification: {
          create: jest.fn(),
          findUnique: jest.fn(),
          findMany: jest.fn(),
          update: jest.fn(),
          updateMany: jest.fn(),
          count: jest.fn(),
        },
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => jest.clearAllMocks());

  // ══════════════════════════════════════════════
  // CREATE
  // ══════════════════════════════════════════════
  describe('create', () => {
    it('should create a notification', async () => {
      prisma.client.notification.create.mockResolvedValue(mockNotification);

      const result = await service.create(mockCreateDto);

      expect(prisma.client.notification.create).toHaveBeenCalledWith({
        data: mockCreateDto,
      });
      expect(result).toEqual(mockNotification);
    });
  });

  // ══════════════════════════════════════════════
  // FIND BY USER
  // ══════════════════════════════════════════════
  describe('findByUser', () => {
    it('should return paginated notifications ordered by createdAt desc', async () => {
      const notifications = [
        { ...mockNotification, id: 'notif-2', createdAt: new Date('2026-07-18T12:00:00Z') },
        { ...mockNotification, id: 'notif-1', createdAt: new Date('2026-07-18T10:00:00Z') },
      ];
      prisma.client.notification.findMany.mockResolvedValue(notifications);
      prisma.client.notification.count.mockResolvedValue(2);

      const result = await service.findByUser('user-1', 1, 10);

      expect(prisma.client.notification.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
      expect(prisma.client.notification.count).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
      expect(result).toEqual({
        data: notifications,
        total: 2,
        page: 1,
        limit: 10,
      });
    });

    it('should use defaults when page and limit are omitted', async () => {
      prisma.client.notification.findMany.mockResolvedValue([mockNotification]);
      prisma.client.notification.count.mockResolvedValue(1);

      const result = await service.findByUser('user-1');

      expect(prisma.client.notification.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        skip: 0,
        take: 50,
        orderBy: { createdAt: 'desc' },
      });
      expect(result.page).toBe(1);
      expect(result.limit).toBe(50);
    });

    it('should return empty list when user has no notifications', async () => {
      prisma.client.notification.findMany.mockResolvedValue([]);
      prisma.client.notification.count.mockResolvedValue(0);

      const result = await service.findByUser('user-with-none', 1, 10);

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  // ══════════════════════════════════════════════
  // MARK READ
  // ══════════════════════════════════════════════
  describe('markRead', () => {
    it('should mark a notification as read', async () => {
      prisma.client.notification.findUnique.mockResolvedValue(mockNotification);
      prisma.client.notification.update.mockResolvedValue({
        ...mockNotification,
        isRead: true,
      });

      const result = await service.markRead('notif-1');

      expect(prisma.client.notification.findUnique).toHaveBeenCalledWith({
        where: { id: 'notif-1' },
      });
      expect(prisma.client.notification.update).toHaveBeenCalledWith({
        where: { id: 'notif-1' },
        data: { isRead: true },
      });
      expect(result).toEqual({ message: 'Marked as read' });
    });

    it('should throw NotFoundException if notification does not exist', async () => {
      prisma.client.notification.findUnique.mockResolvedValue(null);

      await expect(service.markRead('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.client.notification.update).not.toHaveBeenCalled();
    });
  });

  // ══════════════════════════════════════════════
  // MARK ALL READ
  // ══════════════════════════════════════════════
  describe('markAllRead', () => {
    it('should mark all unread notifications as read for the user', async () => {
      prisma.client.notification.updateMany.mockResolvedValue({ count: 3 });

      const result = await service.markAllRead('user-1');

      expect(prisma.client.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', isRead: false },
        data: { isRead: true },
      });
      expect(result).toEqual({ message: 'All notifications marked as read' });
    });

    it('should succeed when user has no unread notifications', async () => {
      prisma.client.notification.updateMany.mockResolvedValue({ count: 0 });

      const result = await service.markAllRead('user-with-none');

      expect(result).toEqual({ message: 'All notifications marked as read' });
    });
  });
});
