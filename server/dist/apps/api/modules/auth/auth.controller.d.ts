import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterEmployeeDto } from './dto/register.dto';
import { RefreshDto } from './dto/refresh.dto';
import { Request } from 'express';
export declare class AuthController {
    private readonly auth;
    constructor(auth: AuthService);
    login(dto: LoginDto): Promise<import("./entities/auth-tokens.entity").LoginResponse>;
    refresh(dto: RefreshDto): Promise<import("./entities/auth-tokens.entity").AuthTokens>;
    logout(req: Request): Promise<{
        message: string;
    }>;
    registerEmployee(dto: RegisterEmployeeDto, req: any): Promise<import("./entities/auth-tokens.entity").LoginResponse>;
}
