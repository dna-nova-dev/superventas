import { ApiService } from './api.service';
import { VentaDetalle,CreateVentaDetalle } from '@/types';

const apiService = new ApiService();
const VENTA_DETALLE_ENDPOINT = 'venta-detalles';

export const getVentaDetalles = async (): Promise<VentaDetalle[]> => {
  try {
    const response = await apiService.get<VentaDetalle[]>(`${VENTA_DETALLE_ENDPOINT}/all`);
    return response;
  } catch (error: any) {
    console.error("Error fetching venta detalles:", error);
    throw error;
  }
};

export const getVentaDetalleById = async (id: number): Promise<VentaDetalle> => {
  return await apiService.get<VentaDetalle>(`${VENTA_DETALLE_ENDPOINT}/getById/${id}`);
};

export const createVentaDetalle = async (ventaDetalle: Omit<CreateVentaDetalle, 'venta_detalle_id'>): Promise<CreateVentaDetalle> => {
  return await apiService.post<VentaDetalle>(`${VENTA_DETALLE_ENDPOINT}/create`, ventaDetalle);
};

export const updateVentaDetalle = async (id: number, ventaDetalle: Partial<VentaDetalle>): Promise<VentaDetalle> => {
  return await apiService.patch<VentaDetalle>(`${VENTA_DETALLE_ENDPOINT}/update/${id}`, ventaDetalle);
};

export const deleteVentaDetalle = async (id: number): Promise<void> => {
  return await apiService.delete(`${VENTA_DETALLE_ENDPOINT}/delete/${id}`);
};

export const getDetallesByVentaId = async (ventaId: number): Promise<VentaDetalle[]> => {
  try {
    const response = await apiService.get<VentaDetalle[]>(`${VENTA_DETALLE_ENDPOINT}/all-relations?ventaId=${ventaId}`);
    return response;
  } catch (error: any) {
    console.error(`Error fetching venta detalles for venta ID ${ventaId}:`, error);
    throw error;
  }
};

export const getVentaDetalleByCodigo = async (codigo: string): Promise<VentaDetalle[]> => {
  try {
    const response = await apiService.get<VentaDetalle[]>(`${VENTA_DETALLE_ENDPOINT}/by-codigo/${codigo}`);
    return response;
  } catch (error: any) {
    console.error(`Error fetching venta detalle with codigo ${codigo}:`, error);
    throw error;
  }
};
