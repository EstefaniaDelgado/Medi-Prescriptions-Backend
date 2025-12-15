import { BadRequestException } from '@nestjs/common';
import { PaginatedResponse } from '../interfaces/paginated-response.interface';

export function validatePagination(
  page: number,
  limit: number,
  total: number,
): void {
  const totalPages = Math.ceil(total / limit);

  // Si hay registros y la página solicitada es mayor al total de páginas
  if (total > 0 && page > totalPages) {
    throw new BadRequestException(
      `Page ${page} is out of range. Total pages available: ${totalPages}`,
    );
  }

  // Si no hay registros y se solicita una página mayor a 1
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
