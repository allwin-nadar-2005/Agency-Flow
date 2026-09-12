export interface ApiResponse<T = any> {
  success: true;
  data: T;
  meta?: Record<string, any>;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

export function sendSuccess<T>(data: T, meta?: Record<string, any>): ApiResponse<T> {
  return {
    success: true,
    data,
    ...(meta ? { meta } : {}),
  };
}

export function sendError(message: string, code = 'INTERNAL_ERROR', details?: any): ApiErrorResponse {
  return {
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  };
}
