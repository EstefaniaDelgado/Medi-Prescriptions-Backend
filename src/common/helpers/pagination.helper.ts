import { BadRequestException } from '@nestjs/common';
import { PaginatedResponse } from '../interfaces/paginated-response.interface';

export function validatePagination(
  page: number,
  limit: number,
  total: number,
): void {
  const totalPages = Math.ceil(total / limit);


  if (total > 0 && page > totalPages) {
    throw new BadRequestException(
      `Page ${page} is out of range. Total pages available: ${totalPages}`,
    );
  }

  if (total === 0 && page > 1) {
    throw new BadRequestException(
      'No records found. Only page 1 is available.',
    );
  }
}

export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}
