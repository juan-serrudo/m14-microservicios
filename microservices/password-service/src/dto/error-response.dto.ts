export class ErrorResponseDto {
  code: string;
  message: string;
  traceId: string;
  retryable?: boolean;
}

