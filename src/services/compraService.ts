import { ApiService } from "./api.service";
import { Compra, CreateCompra } from "@/types";

const apiService = new ApiService();
const VENTA_ENDPOINT = "compras";

export const getCompras = async (): Promise<Compra[]> => {
  try {
    const response = await apiService.get<Compra[]>(`${VENTA_ENDPOINT}/all`);
    return response;
  } catch (error: any) {
    console.error("Error fetching ventas:", error);
    throw error;
  }
};

export const getCompraById = async (id: number): Promise<Compra> => {
  return await apiService.get<Compra>(`${VENTA_ENDPOINT}/getById/${id}`);
};

export const createCompra = async (compra: CreateCompra): Promise<Compra> => {
  return await apiService.post<Compra>(`${VENTA_ENDPOINT}/create`, compra);
};

export const updateCompra = async (
  id: number,
  compra: Partial<Compra>
): Promise<Compra> => {
  return await apiService.patch<Compra>(
    `${VENTA_ENDPOINT}/update/${id}`,
    compra
  );
};

export const deleteCompra = async (id: number): Promise<void> => {
  return await apiService.delete(`${VENTA_ENDPOINT}/delete/${id}`);
};

// export const getComprasByProductoId = async (productoId: number): Promise<Compra[]> => {
//   try {
//     const response = await apiService.get<Compra[]>(`${VENTA_ENDPOINT}/all-relations?productoId=${productoId}`);
//     return response;
//   } catch (error: any) {
//     console.error(`Error fetching ventas for producto ID ${productoId}:`, error);
//     throw error;
//   }
// };

// export const getCompraByCodigo = async (codigo: string): Promise<Compra> => {
//   try {
//     const response = await apiService.get<Compra>(`${VENTA_ENDPOINT}/by-codigo/${codigo}`);
//     return response;
//   } catch (error: any) {
//     console.error(`Error fetching venta with codigo ${codigo}:`, error);
//     throw error;
//   }
// };
