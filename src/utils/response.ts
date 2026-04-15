export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data: T;
  meta?: PaginationMeta;
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export const successResponse = <T>(data: T): ApiResponse<T> => ({ data });

export const paginatedResponse = <T>(
  data: T,
  page: number,
  limit: number,
  total: number
): ApiResponse<T> => ({
  data,
  meta: {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  },
});
