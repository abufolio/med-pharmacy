import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '@server/database';
import { AuditHelper } from '../audit/audit.helper';

// ── Test Data ──
const mockUsers = {
  base: {
    id: 'user-1',
    firstName: 'Ali',
    lastName: 'Valiyev',
    phone: '+998901234567',
    telegramId: null,
    language: 'uz',
    status: 'ACTIVE',
    createdAt: new Date('2026-01-01T10:00:00Z'),
    updatedAt: new Date('2026-01-01T10:00:00Z'),
  },
  withTelegram: {
    id: 'user-2',
    firstName: 'Bobur',
    lastName: 'Karimov',
    phone: '+998902345678',
    telegramId: BigInt('123456789'),
    language: 'en',
    status: 'ACTIVE',
    createdAt: new Date('2026-02-01T10:00:00Z'),
    updatedAt: new Date('2026-02-01T10:00:00Z'),
  },
  blocked: {
    id: 'user-3',
    firstName: 'Karim',
    lastName: 'Bekov',
    phone: '+998903456789',
    telegramId: null,
    language: 'uz',
    status: 'BLOCKED',
    createdAt: new Date('2026-03-01T10:00:00Z'),
    updatedAt: new Date('2026-03-01T10:00:00Z'),
  },
};

const mockWallet = {
  id: 'wallet-1',
  userId: 'user-1',
  balance: 15000,
};

const mockTransactions = [
  { id: 'tx-1', amount: 50000, status: 'COMPLETED', createdAt: new Date('2026-06-01T12:00:00Z') },
  { id: 'tx-2', amount: 25000, status: 'COMPLETED', createdAt: new Date('2026-06-10T12:00:00Z') },
];

const createSelect = {
  id: true, firstName: true, lastName: true, phone: true,
  telegramId: true, language: true, status: true, createdAt: true,
};

const updateSelect = {
  id: true, firstName: true, lastName: true, phone: true,
  telegramId: true, language: true, status: true, updatedAt: true,
};

const findByIdSelect = {
  id: true, firstName: true, lastName: true, phone: true,
  telegramId: true, language: true, status: true, createdAt: true, updatedAt: true,
  wallet: { select: { balance: true } },
  transactions: {
    take: 10,
    orderBy: { createdAt: 'desc' },
    select: { id: true, amount: true, status: true, createdAt: true },
  },
};

const findByPhoneSelect = {
  id: true, firstName: true, lastName: true, phone: true,
  status: true, createdAt: true,
};

describe('UsersService', () => {
  let service: UsersService;
  let prisma: any;
  let audit: any;

  beforeEach(async () => {
    const prismaMock = {
      client: {
        user: {
          findUnique: jest.fn(),
          findMany: jest.fn(),
          create: jest.fn(),
          update: jest.fn(),
          count: jest.fn(),
        },
      },
    };

    const auditMock = {
      log: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: AuditHelper, useValue: auditMock },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get(PrismaService);
    audit = module.get(AuditHelper);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ══════════════════════════════════════════════
  //  CREATE
  // ══════════════════════════════════════════════

  describe('create', () => {
    it('should create a user with minimal required fields', async () => {
      const dto = {
        firstName: 'Ali',
        lastName: 'Valiyev',
        phone: '+998901234567',
      };

      prisma.client.user.findUnique.mockResolvedValue(null);
      prisma.client.user.create.mockResolvedValue(mockUsers.base);

      const result = await service.create(dto);

      expect(result).toEqual(mockUsers.base);
      expect(prisma.client.user.findUnique).toHaveBeenCalledWith({
        where: { phone: dto.phone },
      });
      expect(prisma.client.user.create).toHaveBeenCalledWith({
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
          language: 'uz',
        },
        select: createSelect,
      });
      expect(audit.log).toHaveBeenCalledWith(
        'USER_CREATED', 'user', mockUsers.base.id, undefined, { phone: dto.phone },
      );
    });

    it('should create a user with telegramId as BigInt', async () => {
      const dto = {
        firstName: 'Bobur',
        lastName: 'Karimov',
        phone: '+998902345678',
        telegramId: 123456789,
        language: 'en',
      };

      prisma.client.user.findUnique.mockResolvedValue(null);
      prisma.client.user.create.mockResolvedValue(mockUsers.withTelegram);

      const result = await service.create(dto);

      expect(result).toEqual(mockUsers.withTelegram);
      expect(prisma.client.user.create).toHaveBeenCalledWith({
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
          language: dto.language,
          telegramId: BigInt(dto.telegramId),
        },
        select: createSelect,
      });
    });

    it('should default language to "uz" when not provided', async () => {
      const dto = {
        firstName: 'Ali',
        lastName: 'Valiyev',
        phone: '+998901234567',
      };

      prisma.client.user.findUnique.mockResolvedValue(null);
      prisma.client.user.create.mockResolvedValue(mockUsers.base);

      await service.create(dto);

      expect(prisma.client.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ language: 'uz' }),
        }),
      );
    });

    it('should throw ConflictException if phone already exists', async () => {
      const dto = {
        firstName: 'Ali',
        lastName: 'Valiyev',
        phone: '+998901234567',
      };

      prisma.client.user.findUnique.mockResolvedValue(mockUsers.base);

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
      await expect(service.create(dto)).rejects.toThrow(
        'User with this phone already exists',
      );
      expect(prisma.client.user.create).not.toHaveBeenCalled();
    });
  });

  // ══════════════════════════════════════════════
  //  FIND ALL (paginated)
  // ══════════════════════════════════════════════

  describe('findAll', () => {
    it('should return paginated users without search filter', async () => {
      const users = [mockUsers.base, mockUsers.withTelegram];
      prisma.client.user.findMany.mockResolvedValue(users);
      prisma.client.user.count.mockResolvedValue(2);

      const result = await service.findAll(undefined, 1, 20);

      expect(result.data).toEqual(users);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(prisma.client.user.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 20,
        select: createSelect,
        orderBy: { createdAt: 'desc' },
      });
      expect(prisma.client.user.count).toHaveBeenCalledWith({ where: {} });
    });

    it('should apply default pagination when page and limit are omitted', async () => {
      prisma.client.user.findMany.mockResolvedValue([]);
      prisma.client.user.count.mockResolvedValue(0);

      await service.findAll();

      expect(prisma.client.user.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 50,
        select: createSelect,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should search by firstName, lastName, or phone with insensitive contains', async () => {
      const search = 'ali';
      prisma.client.user.findMany.mockResolvedValue([mockUsers.base]);
      prisma.client.user.count.mockResolvedValue(1);

      const result = await service.findAll(search, 1, 10);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('user-1');
      expect(prisma.client.user.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search } },
          ],
        },
        skip: 0,
        take: 10,
        select: createSelect,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return empty data when no users match search', async () => {
      prisma.client.user.findMany.mockResolvedValue([]);
      prisma.client.user.count.mockResolvedValue(0);

      const result = await service.findAll('nonexistent', 1, 10);

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should correctly calculate skip for pagination', async () => {
      prisma.client.user.findMany.mockResolvedValue([]);
      prisma.client.user.count.mockResolvedValue(0);

      await service.findAll(undefined, 3, 25);

      expect(prisma.client.user.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 50,
        take: 25,
        select: createSelect,
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  // ══════════════════════════════════════════════
  //  FIND BY ID
  // ══════════════════════════════════════════════

  describe('findById', () => {
    it('should return user with wallet balance and recent transactions', async () => {
      const userWithRelations = {
        ...mockUsers.base,
        wallet: mockWallet,
        transactions: mockTransactions,
      };

      prisma.client.user.findUnique.mockResolvedValue(userWithRelations);

      const result = await service.findById('user-1');

      expect(result.id).toBe('user-1');
      expect(result.wallet).toEqual(mockWallet);
      expect(result.transactions).toHaveLength(2);
      expect(result.transactions).toEqual(mockTransactions);
      expect(prisma.client.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: findByIdSelect,
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      prisma.client.user.findUnique.mockResolvedValue(null);

      await expect(service.findById('invalid-id')).rejects.toThrow(NotFoundException);
      await expect(service.findById('invalid-id')).rejects.toThrow('User not found');
    });

    it('should return user with empty collections when no wallet or transactions exist', async () => {
      const userNoRelations = {
        ...mockUsers.base,
        wallet: null,
        transactions: [],
      };

      prisma.client.user.findUnique.mockResolvedValue(userNoRelations);

      const result = await service.findById('user-1');

      expect(result.wallet).toBeNull();
      expect(result.transactions).toEqual([]);
    });
  });

  // ══════════════════════════════════════════════
  //  FIND BY PHONE
  // ══════════════════════════════════════════════

  describe('findByPhone', () => {
    it('should return user when phone exists', async () => {
      prisma.client.user.findUnique.mockResolvedValue(mockUsers.base);

      const result = await service.findByPhone('+998901234567');

      expect(result.id).toBe('user-1');
      expect(result.phone).toBe('+998901234567');
      expect(prisma.client.user.findUnique).toHaveBeenCalledWith({
        where: { phone: '+998901234567' },
        select: findByPhoneSelect,
      });
    });

    it('should throw NotFoundException if phone not found', async () => {
      prisma.client.user.findUnique.mockResolvedValue(null);

      await expect(service.findByPhone('+998999999999')).rejects.toThrow(NotFoundException);
      await expect(service.findByPhone('+998999999999')).rejects.toThrow('User not found');
    });
  });

  // ══════════════════════════════════════════════
  //  UPDATE
  // ══════════════════════════════════════════════

  describe('update', () => {
    it('should update user fields partially', async () => {
      const dto = { firstName: 'Aliy', lastName: 'Valiyevich' };
      const updatedUser = {
        ...mockUsers.base,
        firstName: 'Aliy',
        lastName: 'Valiyevich',
        updatedAt: new Date('2026-07-01T10:00:00Z'),
      };

      prisma.client.user.findUnique.mockResolvedValueOnce(mockUsers.base);
      prisma.client.user.update.mockResolvedValue(updatedUser);

      const result = await service.update('user-1', dto);

      expect(result.firstName).toBe('Aliy');
      expect(result.lastName).toBe('Valiyevich');
      expect(prisma.client.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { firstName: 'Aliy', lastName: 'Valiyevich' },
        select: updateSelect,
      });
      expect(audit.log).toHaveBeenCalledWith(
        'USER_UPDATED', 'user', 'user-1',
        expect.objectContaining({ id: 'user-1', phone: '+998901234567' }),
        expect.objectContaining(dto),
      );
    });

    it('should update phone and check uniqueness for other users', async () => {
      const dto = { phone: '+998999999999' };
      const updatedUser = {
        ...mockUsers.base,
        phone: '+998999999999',
        updatedAt: new Date('2026-07-01T10:00:00Z'),
      };

      prisma.client.user.findUnique
        .mockResolvedValueOnce(mockUsers.base)   // fetch existing user
        .mockResolvedValueOnce(null);            // phone not taken
      prisma.client.user.update.mockResolvedValue(updatedUser);

      const result = await service.update('user-1', dto);

      expect(result.phone).toBe('+998999999999');
      expect(prisma.client.user.findUnique).toHaveBeenNthCalledWith(2, {
        where: { phone: dto.phone },
      });
    });

    it('should throw ConflictException when updating to an existing phone owned by another user', async () => {
      const dto = { phone: '+998902345678' }; // owned by user-2

      prisma.client.user.findUnique
        .mockResolvedValueOnce(mockUsers.base)                    // fetch user-1
        .mockResolvedValueOnce(mockUsers.withTelegram);           // phone belongs to user-2

      await expect(service.update('user-1', dto)).rejects.toThrow('Phone already in use');
      expect(prisma.client.user.update).not.toHaveBeenCalled();
    });

    it('should allow keeping the same phone (self-reference)', async () => {
      const dto = { phone: '+998901234567' }; // same as current

      prisma.client.user.findUnique
        .mockResolvedValueOnce(mockUsers.base)   // fetch user-1
        .mockResolvedValueOnce(mockUsers.base);  // phone lookup returns same user (same id)
      prisma.client.user.update.mockResolvedValue(mockUsers.base);

      await service.update('user-1', dto);

      expect(prisma.client.user.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      prisma.client.user.findUnique.mockResolvedValue(null);

      await expect(service.update('invalid-id', { firstName: 'New' })).rejects.toThrow(NotFoundException);
    });

    it('should skip phone uniqueness check when phone is not in dto', async () => {
      const dto = { language: 'en' };
      const updatedUser = { ...mockUsers.base, language: 'en', updatedAt: new Date() };

      prisma.client.user.findUnique.mockResolvedValueOnce(mockUsers.base);
      prisma.client.user.update.mockResolvedValue(updatedUser);

      await service.update('user-1', dto);

      // findUnique should only be called once (fetching the user), not for phone check
      expect(prisma.client.user.findUnique).toHaveBeenCalledTimes(1);
    });

    it('should audit with old user data and new dto', async () => {
      const dto = { firstName: 'Aliy', phone: '+998999999999' };
      const updatedUser = {
        ...mockUsers.base,
        firstName: 'Aliy',
        phone: '+998999999999',
        updatedAt: new Date(),
      };

      prisma.client.user.findUnique
        .mockResolvedValueOnce(mockUsers.base)   // fetch existing
        .mockResolvedValueOnce(null);            // phone not taken
      prisma.client.user.update.mockResolvedValue(updatedUser);

      await service.update('user-1', dto);

      expect(audit.log).toHaveBeenCalledWith(
        'USER_UPDATED', 'user', 'user-1',
        expect.objectContaining({ id: 'user-1', phone: '+998901234567' }),
        expect.objectContaining({ firstName: 'Aliy', phone: '+998999999999' }),
      );
    });
  });

  // ══════════════════════════════════════════════
  //  BLOCK
  // ══════════════════════════════════════════════

  describe('block', () => {
    it('should block an active user', async () => {
      const blockedUser = {
        id: 'user-1',
        firstName: 'Ali',
        lastName: 'Valiyev',
        phone: '+998901234567',
        status: 'BLOCKED',
      };

      prisma.client.user.findUnique.mockResolvedValue(mockUsers.base);
      prisma.client.user.update.mockResolvedValue(blockedUser);

      const result = await service.block('user-1');

      expect(result.status).toBe('BLOCKED');
      expect(prisma.client.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { status: 'BLOCKED' },
        select: {
          id: true, firstName: true, lastName: true, phone: true, status: true,
        },
      });
      expect(audit.log).toHaveBeenCalledWith('USER_BLOCKED', 'user', 'user-1');
    });

    it('should throw ConflictException if user is already blocked', async () => {
      prisma.client.user.findUnique.mockResolvedValue(mockUsers.blocked);

      await expect(service.block('user-3')).rejects.toThrow(ConflictException);
      await expect(service.block('user-3')).rejects.toThrow('User already blocked');
      expect(prisma.client.user.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      prisma.client.user.findUnique.mockResolvedValue(null);

      await expect(service.block('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  // ══════════════════════════════════════════════
  //  UNBLOCK
  // ══════════════════════════════════════════════

  describe('unblock', () => {
    it('should unblock a blocked user', async () => {
      const activeUser = {
        ...mockUsers.blocked,
        status: 'ACTIVE',
      };

      prisma.client.user.findUnique.mockResolvedValue(mockUsers.blocked);
      prisma.client.user.update.mockResolvedValue(activeUser);

      const result = await service.unblock('user-3');

      expect(result.status).toBe('ACTIVE');
      expect(prisma.client.user.update).toHaveBeenCalledWith({
        where: { id: 'user-3' },
        data: { status: 'ACTIVE' },
      });
      expect(audit.log).toHaveBeenCalledWith('USER_UNBLOCKED', 'user', 'user-3');
    });

    it('should throw ConflictException if user is not blocked', async () => {
      prisma.client.user.findUnique.mockResolvedValue(mockUsers.base);

      await expect(service.unblock('user-1')).rejects.toThrow(ConflictException);
      await expect(service.unblock('user-1')).rejects.toThrow('User is not blocked');
      expect(prisma.client.user.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      prisma.client.user.findUnique.mockResolvedValue(null);

      await expect(service.unblock('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });
});
