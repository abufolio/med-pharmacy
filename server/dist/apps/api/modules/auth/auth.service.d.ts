import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@server/database';
import { LoginDto } from './dto/login.dto';
import { RegisterEmployeeDto } from './dto/register.dto';
import { RefreshDto } from './dto/refresh.dto';
import { AuthTokens, LoginResponse } from './entities/auth-tokens.entity';
import { AuditHelper } from '../audit/audit.helper';
export declare class AuthService {
    private readonly prisma;
    private readonly jwt;
    private readonly audit;
    private readonly logger;
    private readonly ACCESS_EXPIRES;
    private readonly REFRESH_EXPIRES;
    private readonly REFRESH_EXPIRES_MS;
    constructor(prisma: PrismaService, jwt: JwtService, audit: AuditHelper);
    login(dto: LoginDto): Promise<LoginResponse>;
    refresh(dto: RefreshDto): Promise<AuthTokens>;
    logout(refreshToken: string): Promise<void>;
    registerEmployee(dto: RegisterEmployeeDto, pharmacyId: string): Promise<LoginResponse>;
    private handlePharmacyLogin;
    private handleEmployeeLogin;
    private generateTokens;
    private hashToken;
}
