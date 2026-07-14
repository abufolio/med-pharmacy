export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}
export interface JwtPayload {
    sub: string;
    role: string;
    scope: 'PHARMACY' | 'SYSTEM';
    pharmacyId?: string;
    type: 'access' | 'refresh';
}
export interface LoginResponse {
    tokens: AuthTokens;
    user: {
        id: string;
        login: string;
        role: string;
        fullName?: string;
        pharmacyId?: string;
        pharmacyName?: string;
    };
}
