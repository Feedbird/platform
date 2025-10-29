export class ApiHandlerError extends Error {
  status: number;
  cause: any;
  constructor(message: string, status?: number, cause?: any) {
    super(message);
    this.cause =
      typeof cause === 'object' ? JSON.stringify(cause, null, 2) : cause;
    this.status = status || 500;
  }
}
