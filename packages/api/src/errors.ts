export class SenkuError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: Record<string, unknown>;

  constructor(status: number, code: string, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'SenkuError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  get isNotFound() {
    return this.status === 404;
  }

  get isRateLimited() {
    return this.status === 429;
  }

  get isRetryable() {
    return this.status === 0 || this.status === 429 || this.status >= 500;
  }
}
