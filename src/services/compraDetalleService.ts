import { ApiService } from "./api.service";
import { CompraDetalle, CreateCompraDetalle } from "@/types";

interface ApiError extends Error {
  response?: {
    status: number;
    data?: unknown;
  };
  status?: number;
  message: string;
}

const apiService = new ApiService();
const VENTA_DETALLE_ENDPOINT = "compra-detalles";

export const getCompraDetalles = async (): Promise<CompraDetalle[]> => {
  try {
    const response = await apiService.get<CompraDetalle[]>(
      `${VENTA_DETALLE_ENDPOINT}/all`
    );
    return response;
  } catch (error: unknown) {
    const err = error as ApiError;
    console.error("Error fetching venta detalles:", err);
    throw new Error(err.message || 'Error al obtener los detalles de la compra');
  }
};

export const getCompraDetalleById = async (
  id: number
): Promise<CompraDetalle> => {
  return await apiService.get<CompraDetalle>(
    `${VENTA_DETALLE_ENDPOINT}/getById/${id}`
  );
};

export const createCompraDetalle = async (
  compraDetalle: Omit<CreateCompraDetalle, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>
): Promise<CompraDetalle> => {
  try {
    const response = await apiService.post<CompraDetalle>(
      `${VENTA_DETALLE_ENDPOINT}/create`,
      compraDetalle as unknown as Record<string, unknown>
    );
    return response;
  } catch (error: unknown) {
    const err = error as ApiError;
    console.error('Error creating compra detalle:', err);
    throw new Error(err.message || 'Error al crear el detalle de la compra');
  }
};

export const updateCompraDetalle = async (
  id: number,
  compraDetalle: Partial<CompraDetalle>
): Promise<CompraDetalle> => {
  return await apiService.patch<CompraDetalle>(
    `${VENTA_DETALLE_ENDPOINT}/update/${id}`,
    compraDetalle
  );
};

export const deleteCompraDetalle = async (id: number): Promise<void> => {
  return await apiService.delete(`${VENTA_DETALLE_ENDPOINT}/delete/${id}`);
};

export const getCompraDetalleByCodigo = async (
  codigo: string
): Promise<CompraDetalle[]> => {
  try {
    const response = await apiService.get<CompraDetalle[]>(
      `${VENTA_DETALLE_ENDPOINT}/by-compra-codigo/${codigo}`
    );
    return response;
  } catch (error: unknown) {
    const err = error as ApiError;
    console.error(`Error fetching venta detalle with codigo ${codigo}:`, err);
    throw new Error(err.message || `Error al obtener el detalle de la compra con código ${codigo}`);
  }
};
