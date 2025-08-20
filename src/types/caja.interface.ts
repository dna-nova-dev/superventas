export interface Caja {
    id: number
    numero: number
    nombre: string
    efectivo: string
    empresaId: number
    createdAt?: Date
    updatedAt?: Date
    deletedAt?: Date
  }
  
export interface CreateCajaDto {
    numero: number;
    nombre: string;
    efectivo: string;
    empresaId: number;
}

export interface UpdateCajaDto {
    numero?: number;
    nombre?: string;
    efectivo?: string;
    empresaId?: number;
}
  
export interface ApiResponse<T> {
    data: T;
    message: string;
    statusCode: number;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
