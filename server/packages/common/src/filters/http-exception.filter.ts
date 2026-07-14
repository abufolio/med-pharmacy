import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import * as Sentry from '@sentry/nestjs';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorResponse: Record<string, unknown>;

    // Send to Sentry for non-HTTP exceptions (real errors)
    if (!(exception instanceof HttpException)) {
      Sentry.captureException(exception);
    }

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const raw = exception.getResponse();

      // If already formatted as our BusinessException, pass through
      if (typeof raw === 'object' && (raw as any).success === false) {
        errorResponse = raw as Record<string, unknown>;
      } else {
        // Standard NestJS error → Business format
        errorResponse = {
          success: false,
          error: {
            code: exception.name,
            message: exception.message,
            details: null,
          },
        };
      }
    } else {
      // Unknown / 500
      this.logger.error(
        `Unhandled error: ${exception instanceof Error ? exception.message : exception}`,
        exception instanceof Error ? exception.stack : '',
      );

      errorResponse = {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
          details: null,
        },
      };
    }

    response.status(status).json(errorResponse);
  }
}
