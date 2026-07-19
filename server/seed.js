/**
 * Pharmacy Cashback — Test Data Seeder
 *
 * Barcha modellardan 2 tadan test ma'lumot qo'shadi.
 * Ishga tushirish:  cd server && node seed.js
 *
 * Default loginlar:
 *   Pharmacy admin:  admin     / admin123
 *   Cashier:         cashier1  / admin123
 *   Cashier:         cashier2  / admin123
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Maʼlumotlar bazasiga test data qoʻshilmoqda...\n');

  // ── 1. Regions (2 ta) ──
  console.log('1. Regions...');
  const region1 = await prisma.region.upsert({
    where: { code: 'TASH' },
    update: {},
    create: { name: 'Toshkent shahri', code: 'TASH' },
  });
  const region2 = await prisma.region.upsert({
    where: { code: 'SAMD' },
    update: {},
    create: { name: 'Samarqand viloyati', code: 'SAMD' },
  });

  // ── 2. Districts (2 ta, 1 per region) ──
  console.log('2. Districts...');
  const district1 = await prisma.district.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      regionId: region1.id,
      name: 'Chilonzor tumani',
    },
  });
  const district2 = await prisma.district.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      regionId: region2.id,
      name: 'Temiryoʻl tumani',
    },
  });

  // ── 3. Pharmacies (2 ta) ──
  console.log('3. Pharmacies...');
  const pharmacyPassword = await bcrypt.hash('admin123', 12);
  const pharmacy1 = await prisma.pharmacy.upsert({
    where: { login: 'admin' },
    update: {},
    create: {
      name: 'Dorixona №1 — Chilonzor',
      districtId: district1.id,
      address: 'Chilonzor, 12-kvartal',
      phone: '+998901234501',
      login: 'admin',
      passwordHash: pharmacyPassword,
      status: 'ACTIVE',
    },
  });
  const pharmacy2 = await prisma.pharmacy.upsert({
    where: { login: 'pharmacy2' },
    update: {},
    create: {
      name: 'Dorixona №2 — Samarqand',
      districtId: district2.id,
      address: 'Samarqand, Amir Temur koʻch.',
      phone: '+998901234502',
      login: 'pharmacy2',
      passwordHash: pharmacyPassword,
      status: 'ACTIVE',
    },
  });

  // ── 4. Roles (2 ta) ──
  console.log('4. Roles...');
  const rolePharmacyAdmin = await prisma.role.upsert({
    where: { name: 'PHARMACY_ADMIN' },
    update: {},
    create: { name: 'PHARMACY_ADMIN', scope: 'PHARMACY' },
  });
  const roleEmployee = await prisma.role.upsert({
    where: { name: 'EMPLOYEE' },
    update: {},
    create: { name: 'EMPLOYEE', scope: 'PHARMACY' },
  });

  // ── 5. Permissions (2 ta) ──
  console.log('5. Permissions...');
  const perm1 = await prisma.permission.upsert({
    where: { code: 'transaction:create' },
    update: {},
    create: { code: 'transaction:create', description: 'Tranzaksiya yaratish' },
  });
  const perm2 = await prisma.permission.upsert({
    where: { code: 'transaction:read' },
    update: {},
    create: { code: 'transaction:read', description: 'Tranzaksiyalarni koʻrish' },
  });

  // Role-Permission bog'lash
  await prisma.rolePermission.upsert({
    where: { roleId_permissionId: { roleId: roleEmployee.id, permissionId: perm1.id } },
    update: {},
    create: { roleId: roleEmployee.id, permissionId: perm1.id },
  });
  await prisma.rolePermission.upsert({
    where: { roleId_permissionId: { roleId: roleEmployee.id, permissionId: perm2.id } },
    update: {},
    create: { roleId: roleEmployee.id, permissionId: perm2.id },
  });
  await prisma.rolePermission.upsert({
    where: { roleId_permissionId: { roleId: rolePharmacyAdmin.id, permissionId: perm1.id } },
    update: {},
    create: { roleId: rolePharmacyAdmin.id, permissionId: perm1.id },
  });
  await prisma.rolePermission.upsert({
    where: { roleId_permissionId: { roleId: rolePharmacyAdmin.id, permissionId: perm2.id } },
    update: {},
    create: { roleId: rolePharmacyAdmin.id, permissionId: perm2.id },
  });

  // ── 6. Employees / Cashiers (2 ta) ──
  console.log('6. Employees...');
  const employeePassword = await bcrypt.hash('admin123', 12);
  const emp1 = await prisma.employee.upsert({
    where: { login: 'cashier1' },
    update: {},
    create: {
      pharmacyId: pharmacy1.id,
      roleId: roleEmployee.id,
      fullName: 'Ali Valiyev',
      login: 'cashier1',
      passwordHash: employeePassword,
      status: 'ACTIVE',
    },
  });
  const emp2 = await prisma.employee.upsert({
    where: { login: 'cashier2' },
    update: {},
    create: {
      pharmacyId: pharmacy1.id,
      roleId: roleEmployee.id,
      fullName: 'Bekzod Karimov',
      login: 'cashier2',
      passwordHash: employeePassword,
      status: 'ACTIVE',
    },
  });

  // ── 7. Users / Customers (2 ta) ──
  console.log('7. Users (customers)...');
  const user1 = await prisma.user.upsert({
    where: { phone: '+998901112233' },
    update: {},
    create: {
      firstName: 'Shavkat',
      lastName: 'Rahimov',
      phone: '+998901112233',
      language: 'uz',
      status: 'ACTIVE',
    },
  });
  const user2 = await prisma.user.upsert({
    where: { phone: '+998904445566' },
    update: {},
    create: {
      firstName: 'Dilnoza',
      lastName: 'Azimova',
      phone: '+998904445566',
      language: 'uz',
      status: 'ACTIVE',
    },
  });

  // ── 8. Wallets (2 ta) ──
  console.log('8. Wallets...');
  const wallet1 = await prisma.wallet.upsert({
    where: { userId: user1.id },
    update: {},
    create: { userId: user1.id, balance: 150000 },
  });
  const wallet2 = await prisma.wallet.upsert({
    where: { userId: user2.id },
    update: {},
    create: { userId: user2.id, balance: 85000 },
  });

  // ── 9. Cards (2 ta NFC) ──
  console.log('9. Cards...');
  const card1 = await prisma.card.upsert({
    where: { uid: 'A1B2C3D4E5' },
    update: {},
    create: { uid: 'A1B2C3D4E5', status: 'ACTIVE' },
  });
  const card2 = await prisma.card.upsert({
    where: { uid: 'F6G7H8I9J0' },
    update: {},
    create: { uid: 'F6G7H8I9J0', status: 'ACTIVE' },
  });

  // ── 10. Card Assignments ──
  console.log('10. Card Assignments...');
  await prisma.cardAssignment.upsert({
    where: { id: '10000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '10000000-0000-0000-0000-000000000001',
      cardId: card1.id,
      userId: user1.id,
      status: 'ACTIVE',
    },
  });
  await prisma.cardAssignment.upsert({
    where: { id: '10000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '10000000-0000-0000-0000-000000000002',
      cardId: card2.id,
      userId: user2.id,
      status: 'ACTIVE',
    },
  });

  // ── 11. Cashback Rules (2 ta) ──
  console.log('11. Cashback Rules...');
  await prisma.cashbackRule.upsert({
    where: { id: '20000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '20000000-0000-0000-0000-000000000001',
      pharmacyId: pharmacy1.id,
      type: 'PERCENT',
      value: 1,
      minPurchase: 10000,
      maxCashback: 50000,
      isActive: true,
    },
  });
  await prisma.cashbackRule.upsert({
    where: { id: '20000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '20000000-0000-0000-0000-000000000002',
      pharmacyId: pharmacy1.id,
      type: 'PERCENT',
      value: 2,
      minPurchase: 50000,
      maxCashback: 100000,
      isActive: true,
    },
  });

  // ── 12. Readers (2 ta NFC reader) ──
  console.log('12. Readers...');
  await prisma.reader.upsert({
    where: { serialNumber: 'READER-001-A' },
    update: {},
    create: {
      pharmacyId: pharmacy1.id,
      serialNumber: 'READER-001-A',
      model: 'ACR122U',
      status: 'ONLINE',
    },
  });
  await prisma.reader.upsert({
    where: { serialNumber: 'READER-002-B' },
    update: {},
    create: {
      pharmacyId: pharmacy1.id,
      serialNumber: 'READER-002-B',
      model: 'ACR122U',
      status: 'ONLINE',
    },
  });

  // ── 13. Transactions (2 ta) ──
  console.log('13. Transactions...');
  const tx1 = await prisma.transaction.upsert({
    where: { id: '30000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '30000000-0000-0000-0000-000000000001',
      userId: user1.id,
      pharmacyId: pharmacy1.id,
      employeeId: emp1.id,
      cardId: card1.id,
      amount: 45000,
      status: 'COMPLETED',
    },
  });
  const tx2 = await prisma.transaction.upsert({
    where: { id: '30000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '30000000-0000-0000-0000-000000000002',
      userId: user2.id,
      pharmacyId: pharmacy1.id,
      employeeId: emp2.id,
      cardId: card2.id,
      amount: 120000,
      status: 'COMPLETED',
    },
  });

  // ── 14. Cashbacks (2 ta, 1% each) ──
  console.log('14. Cashbacks...');
  await prisma.cashback.upsert({
    where: { transactionId: tx1.id },
    update: {},
    create: {
      transactionId: tx1.id,
      userId: user1.id,
      amount: 450,
      status: 'ACTIVE',
    },
  });
  await prisma.cashback.upsert({
    where: { transactionId: tx2.id },
    update: {},
    create: {
      transactionId: tx2.id,
      userId: user2.id,
      amount: 1200,
      status: 'ACTIVE',
    },
  });

  // ── 15. Promo Codes (2 ta) ──
  console.log('15. Promo Codes...');
  await prisma.promoCode.upsert({
    where: { code: 'WELCOME10' },
    update: {},
    create: {
      code: 'WELCOME10',
      type: 'PERCENT',
      value: 10,
      usageLimit: 100,
      usedCount: 0,
      isActive: true,
    },
  });
  await prisma.promoCode.upsert({
    where: { code: 'BONUS50' },
    update: {},
    create: {
      code: 'BONUS50',
      type: 'FIXED',
      value: 50000,
      usageLimit: 50,
      usedCount: 0,
      isActive: true,
    },
  });

  // ── 16. System Setting ──
  console.log('16. Settings...');
  await prisma.setting.upsert({
    where: { key: 'default_cashback_percent' },
    update: {},
    create: {
      key: 'default_cashback_percent',
      value: { value: 1 },
      scope: 'system',
    },
  });

  // ── 17. Notifications (2 ta) ──
  console.log('17. Notifications...');
  await prisma.notification.upsert({
    where: { id: '40000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '40000000-0000-0000-0000-000000000001',
      userId: user1.id,
      type: 'WELCOME',
      message: 'Xush kelibsiz! Cashback tizimiga muvaffaqiyatli roʻyxatdan oʻtdingiz.',
      isRead: false,
    },
  });
  await prisma.notification.upsert({
    where: { id: '40000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '40000000-0000-0000-0000-000000000002',
      userId: user2.id,
      type: 'CASHBACK',
      message: 'Sizga 1200 soʻm cashback hisoblandi!',
      isRead: false,
    },
  });

  console.log('\n✅ Barcha test maʼlumotlar muvaffaqiyatli qoʻshildi!\n');
  console.log('📋 Login maʼlumotlari:');
  console.log('   Pharmacy admin:   admin / admin123');
  console.log('   Cashier 1:        cashier1 / admin123');
  console.log('   Cashier 2:        cashier2 / admin123');
  console.log('   Customer 1:       Shavkat Rahimov (+998901112233)');
  console.log('   Customer 2:       Dilnoza Azimova (+998904445566)');
  console.log('   Card 1 UID:       A1B2C3D4E5');
  console.log('   Card 2 UID:       F6G7H8I9J0');
}

main()
  .catch((e) => {
    console.error('\n❌ Xatolik:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
