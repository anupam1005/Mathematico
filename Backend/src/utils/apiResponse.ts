import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';

type ApiResponseData = 
  | Record<string, any> 
  | Array<any> 
  | string 
  | number 
  | boolean 
  | null;

export class ApiResponse<T = ApiResponseData> {
  constructor(
    public readonly success: boolean,
    public readonly statusCode: number,
    public readonly data: T | null = null,
    public readonly message: string = '',
    public readonly code?: string,
    public readonly meta?: {
      total?: number;
      page?: number;
      limit?: number;
      totalPages?: number;
    }
  ) {}

  public static success<T = ApiResponseData>(
    data: T,
    message: string = 'Operation successful',
    meta?: {
      total?: number;
      page?: number;
      limit?: number;
      totalPages?: number;
    }
  ): ApiResponse<T> {
    return new ApiResponse<T>(true, StatusCodes.OK, data, message, 'SUCCESS', meta);
  }

  public static created<T = ApiResponseData>(
    data: T,
    message: string = 'Resource created successfully',
    meta?: {
      total?: number;
      page?: number;
      limit?: number;
      totalPages?: number;
    }
  ): ApiResponse<T> {
    return new ApiResponse<T>(true, StatusCodes.CREATED, data, message, 'CREATED', meta);
  }

  public static noContent(message: string = 'No content'): ApiResponse<null> {
    return new ApiResponse<null>(true, StatusCodes.NO_CONTENT, null, message, 'NO_CONTENT');
  }

  public static error(
    statusCode: number,
    message: string,
    code?: string,
    data: any = null
  ): ApiResponse<null> {
    return new ApiResponse<null>(false, statusCode, data, message, code);
  }

  public send(res: Response): Response {
    const response = {
      success: this.success,
      status: this.statusCode,
      message: this.message,
      code: this.code || 'UNKNOWN_ERROR',
      ...(this.data !== null && { data: this.data }),
      ...(this.meta && { meta: this.meta }),
    };

    return res.status(this.statusCode).json(response);
  }
}

export const sendResponse = <T = ApiResponseData>(
  res: Response,
  statusCode: number,
  data: T | null = null,
  message: string = '',
  code?: string,
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  }
): Response => {
  const response = new ApiResponse<T>(
    statusCode >= 200 && statusCode < 300,
    statusCode,
    data,
    message,
    code,
    meta
  );
  return response.send(res);
};
