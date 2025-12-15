import { ApiResponse } from '../interfaces/response.interface';

export const apiResponse = <T>(
  data: T,
  message: string,
  code: number,
  details?: unknown,
): ApiResponse<T> => {
  return {
    code,
    message,
    details,
    data,
  };
};
