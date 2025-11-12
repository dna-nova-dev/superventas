import { ApiService } from './api.service';
import { Venta, CreateVenta, EstadoVenta } from '@/types';

const apiService = new ApiService();
const VENTA_ENDPOINT = 'ventas';

export const getVentas = async (estado?: EstadoVenta): Promise<Venta[]> => {
  try {
    const params = new URLSearchParams();
    if (estado) {
      params.append('estado', estado);
    }
    const response = await apiService.get<Venta[]>(`${VENTA_ENDPOINT}/all-relations?${params.toString()}`);
    
    // Return the raw dates from the database without any transformation
    return response;
  } catch (error: unknown) {
    console.error("Error fetching ventas:", error);
    throw error;
  }
};

export const getVentaById = async (id: number): Promise<Venta> => {
  try {
    return await apiService.get<Venta>(`${VENTA_ENDPOINT}/getById/${id}`);
  } catch (error: unknown) {
    console.error(`Error fetching venta with ID ${id}:`, error);
    throw error;
  }
};

export const createVenta = async (venta: CreateVenta): Promise<Venta> => {
  return await apiService.post<Venta, CreateVenta>(`${VENTA_ENDPOINT}/create`, venta);
};

export const updateVenta = async (id: number, venta: Partial<Venta>): Promise<Venta> => {
  return await apiService.patch<Venta>(`${VENTA_ENDPOINT}/update/${id}`, venta);
};

export const deleteVenta = async (id: number): Promise<void> => {
  return await apiService.delete(`${VENTA_ENDPOINT}/delete/${id}`);
};

export const getVentasByProductoId = async (productoId: number): Promise<Venta[]> => {
  try {
    const response = await apiService.get<Venta[]>(`${VENTA_ENDPOINT}/all-relations?productoId=${productoId}`);
    return response;
  } catch (error: unknown) {
    console.error(`Error fetching ventas for producto ID ${productoId}:`, error);
    throw error;
  }
};

export const getVentaByCodigo = async (codigo: string): Promise<Venta> => {
  try {
    const response = await apiService.get<Venta>(`${VENTA_ENDPOINT}/by-codigo/${codigo}`);
    return response;
  } catch (error: unknown) {
    console.error(`Error fetching venta with codigo ${codigo}:`, error);
    throw error;
  }
};
