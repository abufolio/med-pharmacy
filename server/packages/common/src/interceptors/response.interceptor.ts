import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((data) => {
        // If already formatted as error response, pass through
        if (data && typeof data === 'object' && data.success === false) {
          return data;
        }

        // If response is already wrapped
        if (data && typeof data === 'object' && data.success === true) {
          return data;
        }

        // Wrap successful response
        return {
          success: true,
          data: data ?? null,
        };
      }),
    );
  }
}
