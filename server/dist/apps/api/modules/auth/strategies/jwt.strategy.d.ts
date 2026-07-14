import { Strategy } from 'passport-jwt';
import { PrismaService } from '@server/database';
import { JwtPayload } from '../entities/auth-tokens.entity';
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly prisma;
    constructor(prisma: PrismaService);
    validate(payload: JwtPayload): Promise<{
        id: string;
        login: string;
        role: string;
        scope: "SYSTEM" | "PHARMACY";
        pharmacyId: string | undefined;
    }>;
}
export {};
