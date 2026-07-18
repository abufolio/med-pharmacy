import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PharmaciesService } from './pharmacies.service';
import { PrismaService } from '@server/database';
import { AuditHelper } from '../audit/audit.helper';

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn().mockResolvedValue(true),
}));

const mockRegion = { id: 'reg-1', name: 'Tashkent', code: 'TASH', deletedAt: null };
const mockDistrict = { id: 'dist-1', name: 'Chilonzor', regionId: 'reg-1', deletedAt: null, pharmacies: [] };
const mockPharmacy = {
  id: 'ph-1', name: 'Test Pharmacy', districtId: 'dist-1', address: '123 Street',
  phone: '+998901234567', login: 'pharmacy01', passwordHash: 'hashed', status: 'ACTIVE',
  createdAt: new Date(),
};

describe('PharmaciesService', () => {
  let service: PharmaciesService;
  let prisma: any;
  let audit: any;

  beforeEach(async () => {
    const prismaMock = {
      client: {
        region: {
          create: jest.fn(), findUnique: jest.fn(), findMany: jest.fn(),
          update: jest.fn(),
        },
        district: {
          create: jest.fn(), findUnique: jest.fn(), findMany: jest.fn(),
          update: jest.fn(),
        },
        pharmacy: {
          create: jest.fn(), findUnique: jest.fn(), findMany: jest.fn(),
          update: jest.fn(), count: jest.fn(),
        },
        cashbackRule: {
          create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(),
          update: jest.fn(),
        },
      },
    };

    const auditMock = { log: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PharmaciesService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: AuditHelper, useValue: auditMock },
      ],
    }).compile();

    service = module.get<PharmaciesService>(PharmaciesService);
    prisma = module.get(PrismaService);
    audit = module.get(AuditHelper);
  });

  afterEach(() => jest.clearAllMocks());

  // ══════════════════════════════════════════════
  // REGIONS
  // ══════════════════════════════════════════════
  describe('regions', () => {
    it('should create a region', async () => {
      prisma.client.region.create.mockResolvedValue(mockRegion);
      const result = await service.createRegion({ name: 'Tashkent', code: 'TASH' });
      expect(result.name).toBe('Tashkent');
    });

    it('should get regions with districts', async () => {
      prisma.client.region.findMany.mockResolvedValue([{ ...mockRegion, districts: [] }]);
      const result = await service.getRegions();
      expect(result).toHaveLength(1);
    });

    it('should throw on delete region with districts', async () => {
      prisma.client.region.findUnique.mockResolvedValue({ ...mockRegion, districts: [mockDistrict] });
      await expect(service.deleteRegion('reg-1')).rejects.toThrow(ConflictException);
    });

    it('should throw on update non-existent region', async () => {
      prisma.client.region.findUnique.mockResolvedValue(null);
      await expect(service.updateRegion('invalid', { name: 'X' })).rejects.toThrow(NotFoundException);
    });
  });

  // ══════════════════════════════════════════════
  // DISTRICTS
  // ══════════════════════════════════════════════
  describe('districts', () => {
    it('should create a district', async () => {
      prisma.client.region.findUnique.mockResolvedValue(mockRegion);
      prisma.client.district.create.mockResolvedValue(mockDistrict);
      const result = await service.createDistrict({ regionId: 'reg-1', name: 'Chilonzor' });
      expect(result.name).toBe('Chilonzor');
    });

    it('should throw if region not found on district creation', async () => {
      prisma.client.region.findUnique.mockResolvedValue(null);
      await expect(service.createDistrict({ regionId: 'invalid', name: 'X' })).rejects.toThrow(NotFoundException);
    });

    it('should throw on delete district with pharmacies', async () => {
      prisma.client.district.findUnique.mockResolvedValue({ ...mockDistrict, pharmacies: [mockPharmacy] });
      await expect(service.deleteDistrict('dist-1')).rejects.toThrow(ConflictException);
    });
  });

  // ══════════════════════════════════════════════
  // PHARMACIES CRUD
  // ══════════════════════════════════════════════
  describe('create', () => {
    it('should create a pharmacy', async () => {
      prisma.client.pharmacy.findUnique.mockResolvedValue(null);
      prisma.client.district.findUnique.mockResolvedValue(mockDistrict);
      prisma.client.pharmacy.create.mockResolvedValue(mockPharmacy);

      const result = await service.create({
        name: 'Test Pharmacy', districtId: 'dist-1', address: '123 Street',
        phone: '+998901234567', login: 'pharmacy01', password: 'securePass',
      });

      expect(result.login).toBe('pharmacy01');
      expect(audit.log).toHaveBeenCalledWith('PHARMACY_CREATED', 'pharmacy', 'ph-1');
    });

    it('should throw if login already taken', async () => {
      prisma.client.pharmacy.findUnique.mockResolvedValue(mockPharmacy);
      await expect(service.create({
        name: 'Test', districtId: 'dist-1', phone: '+998901234567',
        login: 'pharmacy01', password: 'pass',
      })).rejects.toThrow(ConflictException);
    });

    it('should throw if district not found', async () => {
      prisma.client.pharmacy.findUnique.mockResolvedValue(null);
      prisma.client.district.findUnique.mockResolvedValue(null);
      await expect(service.create({
        name: 'Test', districtId: 'invalid', phone: '+998901234567',
        login: 'pharmacy02', password: 'pass',
      })).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return paginated pharmacies', async () => {
      prisma.client.pharmacy.findMany.mockResolvedValue([{
        ...mockPharmacy,
        district: { id: 'dist-1', name: 'Chilonzor', region: { name: 'Tashkent' } },
        _count: { employees: 3, readers: 2, transactions: 100 },
      }]);
      prisma.client.pharmacy.count.mockResolvedValue(1);

      const result = await service.findAll('ACTIVE', 1, 20);
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('findById', () => {
    it('should return pharmacy with relations', async () => {
      prisma.client.pharmacy.findUnique.mockResolvedValue({
        ...mockPharmacy,
        district: { id: 'dist-1', name: 'Chilonzor', region: { id: 'reg-1', name: 'Tashkent' } },
        employees: [],
        cashbackRules: [],
        readers: [],
        _count: { transactions: 50 },
      });

      const result = await service.findById('ph-1');
      expect(result.name).toBe('Test Pharmacy');
      expect(result._count.transactions).toBe(50);
    });

    it('should throw if not found', async () => {
      prisma.client.pharmacy.findUnique.mockResolvedValue(null);
      await expect(service.findById('invalid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update pharmacy fields', async () => {
      prisma.client.pharmacy.findUnique.mockResolvedValue(mockPharmacy);
      prisma.client.pharmacy.update.mockResolvedValue({ ...mockPharmacy, name: 'Updated Pharmacy' });

      const result = await service.update('ph-1', { name: 'Updated Pharmacy' });
      expect(result.name).toBe('Updated Pharmacy');
      expect(audit.log).toHaveBeenCalledWith('PHARMACY_UPDATED', 'pharmacy', 'ph-1');
    });
  });

  describe('updateStatus', () => {
    it('should update pharmacy status', async () => {
      prisma.client.pharmacy.findUnique.mockResolvedValue(mockPharmacy);
      prisma.client.pharmacy.update.mockResolvedValue({ ...mockPharmacy, status: 'SUSPENDED' });

      const result = await service.updateStatus('ph-1', { status: 'SUSPENDED' });
      expect(result.status).toBe('SUSPENDED');
      expect(audit.log).toHaveBeenCalledWith('PHARMACY_STATUS_CHANGED', 'pharmacy', 'ph-1', expect.any(Object), expect.any(Object));
    });
  });

  describe('changePassword', () => {
    it('should change password', async () => {
      prisma.client.pharmacy.findUnique.mockResolvedValue(mockPharmacy);
      prisma.client.pharmacy.update.mockResolvedValue(mockPharmacy);

      const result = await service.changePassword('ph-1', { newPassword: 'newPass123' });
      expect(result.message).toBe('Password updated');
    });
  });

  // ══════════════════════════════════════════════
  // CASHBACK RULES (via pharmacies service)
  // ══════════════════════════════════════════════
  describe('cashback rules', () => {
    it('should create cashback rule for pharmacy', async () => {
      prisma.client.pharmacy.findUnique.mockResolvedValue(mockPharmacy);
      prisma.client.cashbackRule.create.mockResolvedValue({
        id: 'rule-1', pharmacyId: 'ph-1', type: 'PERCENT', value: 5,
      });

      const result = await service.createCashbackRule('ph-1', { type: 'PERCENT', value: 5 });
      expect(result.type).toBe('PERCENT');
      expect(audit.log).toHaveBeenCalledWith('CASHBACK_RULE_CREATED', 'cashback_rule', 'rule-1', undefined, expect.any(Object));
    });

    it('should return pharmacy rules', async () => {
      prisma.client.cashbackRule.findMany.mockResolvedValue([{
        id: 'rule-1', pharmacyId: 'ph-1', type: 'PERCENT', value: 5,
      }]);
      const result = await service.getCashbackRules('ph-1');
      expect(result).toHaveLength(1);
    });

    it('should enforce pharmacy-level access on update rule', async () => {
      prisma.client.cashbackRule.findUnique.mockResolvedValue({
        id: 'rule-1', pharmacyId: 'ph-other', type: 'PERCENT', value: 5,
      });

      await expect(
        service.updateCashbackRule('rule-1', { value: 10 }, 'ph-1', 'PHARMACY_ADMIN'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should enforce pharmacy-level access on delete rule', async () => {
      prisma.client.cashbackRule.findUnique.mockResolvedValue({
        id: 'rule-1', pharmacyId: 'ph-other', type: 'PERCENT', value: 5,
      });

      await expect(
        service.deleteCashbackRule('rule-1', 'ph-1', 'PHARMACY_ADMIN'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
