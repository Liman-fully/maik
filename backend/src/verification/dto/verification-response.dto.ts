export class VerificationResponseDto {
  success: boolean;
  message: string;
  data?: {
    retryAfter?: number;
    expiresIn?: number;
    verified?: boolean;
    token?: string;
    operationId?: string;
  };
  error?: {
    code: string;
    details?: any;
  };

  static success(message: string, data?: any): VerificationResponseDto {
    return {
      success: true,
      message,
      data,
    };
  }

  static error(message: string, errorCode: string, details?: any): VerificationResponseDto {
    return {
      success: false,
      message,
      error: {
        code: errorCode,
        details,
      },
    };
  }
}