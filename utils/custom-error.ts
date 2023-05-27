class AppError extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean;
  message: string;
  
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;
    this.message = message;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
