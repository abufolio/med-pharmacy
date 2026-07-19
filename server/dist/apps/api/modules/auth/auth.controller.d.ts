import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterEmployeeDto } from './dto/register.dto';
import { RefreshDto } from './dto/refresh.dto';
import { Request } from 'express';
export declare class AuthController {
    private readonly auth;
    constructor(auth: AuthService);
    login(dto: LoginDto): Promise<{
        tokens: import("./entities/auth-tokens.entity").AuthTokens;
        user: {
            id: string;
            login: string;
            role: string;
            fullName?: string;
            pharmacyId?: string;
            pharmacyName?: string;
        };
        success: boolean;
    }>;
    refresh(dto: RefreshDto): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
        success: boolean;
    }>;
    logout(req: Request): Promise<{
        message: string;
    }>;
    registerEmployee(dto: RegisterEmployeeDto, req: any): Promise<{
        success: boolean;
        data: import("./entities/auth-tokens.entity").LoginResponse;
    }>;
}
