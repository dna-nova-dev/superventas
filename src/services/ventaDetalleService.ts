import { ApiService } from './api.service';
import { VentaDetalle,CreateVentaDetalle } from '@/types';

const apiService = new ApiService();
const VENTA_DETALLE_ENDPOINT = 'venta-detalles';

export const getVentaDetalles = async (empresaId?: number): Promise<VentaDetalle[]> => {
  try {
    const url = empresaId 
      ? `${VENTA_DETALLE_ENDPOINT}/all?empresaId=${empresaId}`
      : `${VENTA_DETALLE_ENDPOINT}/all`;
      
    const response = await apiService.get<VentaDetalle[]>(url);
    return response;
  } catch (error: unknown) {
    console.error("Error fetching venta detalles:", error);
    if (error instanceof Error) {
      throw new Error(`Error al obtener los detalles de venta: ${error.message}`);
    }
    throw new Error('Ocurrió un error desconocido al obtener los detalles de venta');
  }
};

export const getVentaDetalleById = async (id: number): Promise<VentaDetalle> => {
  try {
    return await apiService.get<VentaDetalle>(`${VENTA_DETALLE_ENDPOINT}/getById/${id}`);
  } catch (error: unknown) {
    console.error(`Error fetching venta detalle with id ${id}:`, error);
    if (error instanceof Error) {
      throw new Error(`Error al obtener el detalle de venta: ${error.message}`);
    }
    throw new Error('Ocurrió un error desconocido al obtener el detalle de venta');
  }
};

export const createVentaDetalle = async (ventaDetalle: Omit<CreateVentaDetalle, 'venta_detalle_id'> & Record<string, unknown>): Promise<VentaDetalle> => {
  try {
    return await apiService.post<VentaDetalle>(`${VENTA_DETALLE_ENDPOINT}/create`, ventaDetalle);
  } catch (error: unknown) {
    console.error("Error creating venta detalle:", error);
    if (error instanceof Error) {
      throw new Error(`Error al crear el detalle de venta: ${error.message}`);
    }
    throw new Error('Ocurrió un error desconocido al crear el detalle de venta');
  }
};

export const updateVentaDetalle = async (id: number, ventaDetalle: Partial<VentaDetalle>): Promise<VentaDetalle> => {
  try {
    return await apiService.patch<VentaDetalle>(`${VENTA_DETALLE_ENDPOINT}/update/${id}`, ventaDetalle);
  } catch (error: unknown) {
    console.error(`Error updating venta detalle with id ${id}:`, error);
    if (error instanceof Error) {
      throw new Error(`Error al actualizar el detalle de venta: ${error.message}`);
    }
    throw new Error('Ocurrió un error desconocido al actualizar el detalle de venta');
  }
};

export const deleteVentaDetalle = async (id: number): Promise<void> => {
  try {
    await apiService.delete(`${VENTA_DETALLE_ENDPOINT}/delete/${id}`);
  } catch (error: unknown) {
    console.error(`Error deleting venta detalle with id ${id}:`, error);
    if (error instanceof Error) {
      throw new Error(`Error al eliminar el detalle de venta: ${error.message}`);
    }
    throw new Error('Ocurrió un error desconocido al eliminar el detalle de venta');
  }
};

export const getDetallesByVentaId = async (ventaId: number): Promise<VentaDetalle[]> => {
  try {
    const response = await apiService.get<VentaDetalle[]>(`${VENTA_DETALLE_ENDPOINT}/all-relations?ventaId=${ventaId}`);
    return response;
  } catch (error: unknown) {
    console.error(`Error fetching venta detalles for venta ID ${ventaId}:`, error);
    if (error instanceof Error) {
      throw new Error(`Error al obtener los detalles de la venta: ${error.message}`);
    }
    throw new Error('Ocurrió un error desconocido al obtener los detalles de la venta');
  }
};

export const getVentaDetalleByCodigo = async (codigo: string): Promise<VentaDetalle[]> => {
  try {
    const response = await apiService.get<VentaDetalle[]>(`${VENTA_DETALLE_ENDPOINT}/by-codigo/${codigo}`);
    return response;
  } catch (error: unknown) {
    console.error(`Error fetching venta detalle with codigo ${codigo}:`, error);
    if (error instanceof Error) {
      throw new Error(`Error al obtener el detalle de venta: ${error.message}`);
    }
    throw new Error('Ocurrió un error desconocido al obtener el detalle de venta');
  }
};
