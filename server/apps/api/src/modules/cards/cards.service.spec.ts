import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { CardsService } from './cards.service';
import { PrismaService } from '@server/database';
import { AuditHelper } from '../audit/audit.helper';

// ── Test Data ──
const mockCard = { id: 'card-1', uid: '04A2B3C4D5', status: 'UNASSIGNED', issuedAt: new Date() };
const mockUser = { id: 'user-1', firstName: 'Ali', lastName: 'Valiyev', phone: '+998901234567', status: 'ACTIVE' };
const mockPendingUser = { ...mockUser, id: 'user-2', status: 'PENDING_CARD' };
const mockActiveAssignment = { id: 'assign-1', cardId: 'card-1', userId: 'user-1', status: 'ACTIVE', assignedAt: new Date(), user: mockUser };
const mockWallet = { id: 'wallet-1', userId: 'user-1', balance: 5000 };

describe('CardsService', () => {
  let service: CardsService;
  let prisma: any;
  let audit: any;

  function mockTransactionCallback(txMock: any) {
    prisma.client.$transaction.mockImplementation(
      async (cb: (tx: any) => Promise<any>) => cb(txMock),
    );
  }

  beforeEach(async () => {
    const prismaMock = {
      client: {
        card: {
          create: jest.fn(),
          findUnique: jest.fn(),
          findMany: jest.fn(),
          update: jest.fn(),
          count: jest.fn(),
        },
        cardAssignment: {
          create: jest.fn(),
          findFirst: jest.fn(),
          findMany: jest.fn(),
          update: jest.fn(),
          count: jest.fn(),
        },
        user: { findUnique: jest.fn(), update: jest.fn() },
        wallet: { findUnique: jest.fn() },
        idempotencyKey: { findUnique: jest.fn(), create: jest.fn() },
        $transaction: jest.fn(),
      },
    };

    const auditMock = { log: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CardsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: AuditHelper, useValue: auditMock },
      ],
    }).compile();

    service = module.get<CardsService>(CardsService);
    prisma = module.get(PrismaService);
    audit = module.get(AuditHelper);
  });

  afterEach(() => jest.clearAllMocks());

  // ══════════════════════════════════════════════
  // CREATE CARD
  // ══════════════════════════════════════════════
  describe('create', () => {
    it('should create a new card', async () => {
      prisma.client.card.findUnique.mockResolvedValue(null);
      prisma.client.card.create.mockResolvedValue(mockCard);

      const result = await service.create({ uid: '04A2B3C4D5' });

      expect(result.uid).toBe('04A2B3C4D5');
      expect(audit.log).toHaveBeenCalledWith('CARD_CREATED', 'card', 'card-1', undefined, { uid: '04A2B3C4D5' });
    });

    it('should throw ConflictException if UID exists', async () => {
      prisma.client.card.findUnique.mockResolvedValue(mockCard);

      await expect(service.create({ uid: '04A2B3C4D5' })).rejects.toThrow(ConflictException);
    });
  });

  // ══════════════════════════════════════════════
  // FIND ALL
  // ══════════════════════════════════════════════
  describe('findAll', () => {
    it('should return paginated cards', async () => {
      prisma.client.card.findMany.mockResolvedValue([{ ...mockCard, assignments: [] }]);
      prisma.client.card.count.mockResolvedValue(1);

      const result = await service.findAll(1, 20);
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  // ══════════════════════════════════════════════
  // FIND BY UID
  // ══════════════════════════════════════════════
  describe('findByUid', () => {
    it('should find card by UID', async () => {
      prisma.client.card.findUnique.mockResolvedValue({ ...mockCard, assignments: [mockActiveAssignment] });

      const result = await service.findByUid('04A2B3C4D5');
      expect(result.uid).toBe('04A2B3C4D5');
      expect(result.assignments).toHaveLength(1);
    });

    it('should throw NotFoundException if not found', async () => {
      prisma.client.card.findUnique.mockResolvedValue(null);
      await expect(service.findByUid('invalid')).rejects.toThrow(NotFoundException);
    });
  });

  // ══════════════════════════════════════════════
  // UPDATE STATUS
  // ══════════════════════════════════════════════
  describe('updateStatus', () => {
    it('should block a card', async () => {
      prisma.client.card.findUnique.mockResolvedValue(mockCard);
      prisma.client.card.update.mockResolvedValue({ ...mockCard, status: 'BLOCKED' });

      const result = await service.updateStatus('04A2B3C4D5', 'BLOCKED');
      expect(result.status).toBe('BLOCKED');
      expect(audit.log).toHaveBeenCalledWith('CARD_BLOCKED', 'card', 'card-1', expect.any(Object), expect.any(Object));
    });

    it('should throw if card not found', async () => {
      prisma.client.card.findUnique.mockResolvedValue(null);
      await expect(service.updateStatus('invalid', 'ACTIVE')).rejects.toThrow(NotFoundException);
    });
  });

  // ══════════════════════════════════════════════
  // ASSIGN CARD
  // ══════════════════════════════════════════════
  describe('assignCard', () => {
    it('should assign a card successfully', async () => {
      const txMock = {
        cardAssignment: { create: jest.fn().mockResolvedValue(mockActiveAssignment) },
        card: { update: jest.fn().mockResolvedValue({ ...mockCard, status: 'ACTIVE' }) },
        user: { update: jest.fn() },
      };

      prisma.client.card.findUnique.mockResolvedValue(mockCard);
      prisma.client.user.findUnique.mockResolvedValue(mockPendingUser);
      prisma.client.cardAssignment.findFirst.mockResolvedValue(null);
      mockTransactionCallback(txMock);

      const result = await service.assignCard({ userId: 'user-2', cardUid: '04A2B3C4D5' });

      expect(result.status).toBe('ACTIVE');
      expect(txMock.user.update).toHaveBeenCalled(); // PENDING_CARD → ACTIVE
      expect(audit.log).toHaveBeenCalledWith('CARD_ASSIGNED', 'card', 'card-1', undefined, expect.any(Object));
    });

    it('should assign card to already active user', async () => {
      const txMock = {
        cardAssignment: { create: jest.fn().mockResolvedValue(mockActiveAssignment) },
        card: { update: jest.fn() },
        user: { update: jest.fn() },
      };

      prisma.client.card.findUnique.mockResolvedValue(mockCard);
      prisma.client.user.findUnique.mockResolvedValue(mockUser);
      prisma.client.cardAssignment.findFirst.mockResolvedValue(null);
      mockTransactionCallback(txMock);

      await service.assignCard({ userId: 'user-1', cardUid: '04A2B3C4D5' });

      expect(txMock.user.update).not.toHaveBeenCalled(); // Already ACTIVE
    });

    it('should throw if card already has active assignment', async () => {
      prisma.client.card.findUnique.mockResolvedValue(mockCard);
      prisma.client.user.findUnique.mockResolvedValue(mockUser);
      prisma.client.cardAssignment.findFirst.mockResolvedValue(mockActiveAssignment);

      await expect(service.assignCard({ userId: 'user-1', cardUid: '04A2B3C4D5' })).rejects.toThrow(ConflictException);
    });

    it('should throw if card is blocked', async () => {
      prisma.client.card.findUnique.mockResolvedValue({ ...mockCard, status: 'BLOCKED' });

      await expect(service.assignCard({ userId: 'user-1', cardUid: '04A2B3C4D5' })).rejects.toThrow(BadRequestException);
    });

    it('should throw if card not found', async () => {
      prisma.client.card.findUnique.mockResolvedValue(null);
      await expect(service.assignCard({ userId: 'user-1', cardUid: 'invalid' })).rejects.toThrow(NotFoundException);
    });
  });

  // ══════════════════════════════════════════════
  // UNASSIGN CARD
  // ══════════════════════════════════════════════
  describe('unassignCard', () => {
    it('should unassign a card', async () => {
      const txMock = {
        cardAssignment: { update: jest.fn().mockResolvedValue({ ...mockActiveAssignment, status: 'UNASSIGNED' }) },
        card: { update: jest.fn().mockResolvedValue({ ...mockCard, status: 'UNASSIGNED' }) },
      };

      prisma.client.card.findUnique.mockResolvedValue(mockCard);
      prisma.client.cardAssignment.findFirst.mockResolvedValue(mockActiveAssignment);
      mockTransactionCallback(txMock);

      const result = await service.unassignCard({ cardUid: '04A2B3C4D5' });

      expect(result.message).toBe('Card unassigned successfully');
    });

    it('should throw if no active assignment', async () => {
      prisma.client.card.findUnique.mockResolvedValue(mockCard);
      prisma.client.cardAssignment.findFirst.mockResolvedValue(null);

      await expect(service.unassignCard({ cardUid: '04A2B3C4D5' })).rejects.toThrow(BadRequestException);
    });
  });

  // ══════════════════════════════════════════════
  // NFC SCAN
  // ══════════════════════════════════════════════
  describe('scan', () => {
    const activeCard = { ...mockCard, status: 'ACTIVE' };

    it('should return scan response for active card', async () => {
      prisma.client.card.findUnique.mockResolvedValue(activeCard);
      prisma.client.cardAssignment.findFirst.mockResolvedValue(mockActiveAssignment);
      prisma.client.wallet.findUnique.mockResolvedValue(mockWallet);

      const result = await service.scan({ cardUid: '04A2B3C4D5', pharmacyId: 'ph-1' });

      expect(result.success).toBe(true);
      expect(result.user!.firstName).toBe('Ali');
      expect(result.user!.balance).toBe(5000);
    });

    it('should return zero balance if no wallet', async () => {
      prisma.client.card.findUnique.mockResolvedValue(activeCard);
      prisma.client.cardAssignment.findFirst.mockResolvedValue(mockActiveAssignment);
      prisma.client.wallet.findUnique.mockResolvedValue(null);

      const result = await service.scan({ cardUid: '04A2B3C4D5', pharmacyId: 'ph-1' });

      expect(result.user!.balance).toBe(0);
    });

    it('should throw if card is not active', async () => {
      prisma.client.card.findUnique.mockResolvedValue({ ...mockCard, status: 'BLOCKED' });

      await expect(service.scan({ cardUid: '04A2B3C4D5', pharmacyId: 'ph-1' })).rejects.toThrow(BadRequestException);
    });

    it('should throw if card not found', async () => {
      prisma.client.card.findUnique.mockResolvedValue(null);

      await expect(service.scan({ cardUid: 'invalid', pharmacyId: 'ph-1' })).rejects.toThrow(NotFoundException);
    });

    it('should throw if card not assigned', async () => {
      prisma.client.card.findUnique.mockResolvedValue(mockCard);
      prisma.client.cardAssignment.findFirst.mockResolvedValue(null);

      await expect(service.scan({ cardUid: '04A2B3C4D5', pharmacyId: 'ph-1' })).rejects.toThrow(BadRequestException);
    });

    it('should use cached idempotent response', async () => {
      const cachedResponse = { success: true, user: { id: 'user-1', firstName: 'Ali', lastName: 'Valiyev', phone: '+998901234567', balance: 5000 }, card: { uid: '04A2B3C4D5', status: 'ACTIVE' } };
      prisma.client.idempotencyKey.findUnique.mockResolvedValue({
        key: 'idem-1',
        response: cachedResponse,
        expiresAt: new Date(Date.now() + 5000),
      });

      const result = await service.scan({ cardUid: '04A2B3C4D5', pharmacyId: 'ph-1', idempotencyKey: 'idem-1' });

      expect(result.user!.firstName).toBe('Ali');
      // Should NOT query card/assignment/wallet again
      expect(prisma.client.card.findUnique).not.toHaveBeenCalled();
    });
  });
});
