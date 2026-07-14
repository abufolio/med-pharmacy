/**
 * Test helpers — shared mocks and utilities for unit tests.
 */

/**
 * Creates a mock PrismaService client with all common models stubbed.
 * Individual tests should override specific methods via jest.fn().
 */
export function createMockPrismaClient(): any {
  return {
    client: {
      // Auth
      pharmacy: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      employee: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      // Session / Tokens
      session: {
        findUnique: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
      },
      // Users
      user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      // Roles
      role: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
      // Transactions
      transaction: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      // Cashbacks
      cashback: {
        create: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
      cashbackRule: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
      // Wallet
      wallet: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
        update: jest.fn(),
      },
      walletTransaction: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
      // Cards
      card: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      // Notifications
      notification: {
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      // Audit
      auditLog: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
      // $transaction
      $transaction: jest.fn(),
    },
  };
}

/**
 * Inline $transaction callback helper.
 * The passed txMock becomes the `tx` argument inside the callback.
 */
export function mockTransaction(
  prismaMock: any,
  txMock: any,
): void {
  prismaMock.client.$transaction.mockImplementation(
    async (cb: (tx: any) => Promise<any>) => cb(txMock),
  );
}

/**
 * Creates a mock AuditHelper
 */
export function createMockAudit(): { log: jest.Mock } {
  return { log: jest.fn() };
}

/**
 * Creates a mock JwtService
 */
export function createMockJwt(): {
  sign: jest.Mock;
  verify: jest.Mock;
} {
  return {
    sign: jest.fn().mockReturnValue('mock-token'),
    verify: jest.fn(),
  };
}
