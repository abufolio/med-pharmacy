export interface AuthenticatedUser {
    id: string;
    login: string;
    role: string;
    scope: string;
    pharmacyId?: string;
}
export declare const CurrentUser: (...dataOrPipes: (import("@nestjs/common").PipeTransform<any, any> | import("@nestjs/common").Type<import("@nestjs/common").PipeTransform<any, any>> | keyof AuthenticatedUser | undefined)[]) => ParameterDecorator;
