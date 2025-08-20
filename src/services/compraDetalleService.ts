import { ApiService } from "./api.service";
import { CompraDetalle, CreateCompraDetalle } from "@/types";

const apiService = new ApiService();
const VENTA_DETALLE_ENDPOINT = "compra-detalles";

export const getCompraDetalles = async (): Promise<CompraDetalle[]> => {
  try {
    const response = await apiService.get<CompraDetalle[]>(
      `${VENTA_DETALLE_ENDPOINT}/all`
    );
    return response;
  } catch (error: any) {
    console.error("Error fetching venta detalles:", error);
    throw error;
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
  compraDetalle: Omit<CreateCompraDetalle, "venta_detalle_id">
): Promise<CreateCompraDetalle> => {
  return await apiService.post<CompraDetalle>(
    `${VENTA_DETALLE_ENDPOINT}/create`,
    compraDetalle
  );
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
      `${VENTA_DETALLE_ENDPOINT}/by-codigo/${codigo}`
    );
    return response;
  } catch (error: any) {
    console.error(`Error fetching venta detalle with codigo ${codigo}:`, error);
    throw error;
  }
};
