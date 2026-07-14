import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * BusinessException — TechSpec standart xatolik formati.
 *
 * {
 *   "success": false,
 *   "error": {
 *     "code": "CARD_NOT_FOUND",
 *     "message": "Card not found"
 *   }
 * }
 */
export class BusinessException extends HttpException {
  constructor(
    code: string,
    message: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
    details?: unknown,
  ) {
    super(
      {
        success: false,
        error: {
          code,
          message,
          details: details || null,
        },
      },
      status,
    );
  }
}
