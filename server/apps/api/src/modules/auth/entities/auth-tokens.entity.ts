export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface JwtPayload {
  sub: string;       // user/employee ID
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
