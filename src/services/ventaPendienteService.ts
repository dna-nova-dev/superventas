import { ApiService } from './api.service';
import type { VentaPendiente, CreateVentaPendiente, Venta } from '@/types';

const apiService = new ApiService();
const VENTA_PENDIENTE_ENDPOINT = 'ventas-pendientes';

/**
 * Obtiene todas las ventas pendientes
 */
export const getVentasPendientes = async (empresaId?: number): Promise<VentaPendiente[]> => {
  try {
    const queryString = empresaId ? `?empresaId=${empresaId}` : '';
    const url = `${VENTA_PENDIENTE_ENDPOINT}${queryString}`;
    const response = await apiService.get<VentaPendiente[]>(url);
    return response;
  } catch (error: unknown) {
    console.error("Error fetching ventas pendientes:", error);
    throw error;
  }
};

/**
 * Obtiene una venta pendiente por su ID
 */
export const getVentaPendienteById = async (id: number): Promise<VentaPendiente> => {
  return await apiService.get<VentaPendiente>(`${VENTA_PENDIENTE_ENDPOINT}/getById/${id}`);
};

/**
 * Obtiene una venta pendiente por su código
 */
export const getVentaPendienteByCodigo = async (codigo: string): Promise<VentaPendiente> => {
  try {
    const response = await apiService.get<VentaPendiente>(`${VENTA_PENDIENTE_ENDPOINT}/by-codigo/${codigo}`);
    return response;
  } catch (error: unknown) {
    console.error(`Error fetching venta pendiente with codigo ${codigo}:`, error);
    throw error;
  }
};

/**
 * Crea una nueva venta pendiente
 */
export const createVentaPendiente = async (ventaPendiente: CreateVentaPendiente): Promise<VentaPendiente> => {
  try {
    return await apiService.post<VentaPendiente>(
      `${VENTA_PENDIENTE_ENDPOINT}/create`, 
      ventaPendiente as unknown as Record<string, unknown>
    );
  } catch (error) {
    console.error("Error al crear venta pendiente:", error);
    throw new Error("No se pudo guardar la venta como pendiente. Por favor, intente nuevamente.");
  }
};

/**
 * Actualiza una venta pendiente existente
 */
export const updateVentaPendiente = async (id: number, ventaPendiente: Partial<VentaPendiente>): Promise<VentaPendiente> => {
  try {
    return await apiService.patch<VentaPendiente>(
      `${VENTA_PENDIENTE_ENDPOINT}/update/${id}`, 
      ventaPendiente
    );
  } catch (error) {
    console.error(`Error al actualizar venta pendiente ${id}:`, error);
    throw new Error("No se pudo actualizar la venta pendiente. Por favor, intente nuevamente.");
  }
};

/**
 * Elimina una venta pendiente
 */
export const deleteVentaPendiente = async (id: number): Promise<void> => {
  try {
    await apiService.delete(`${VENTA_PENDIENTE_ENDPOINT}/delete/${id}`);
  } catch (error) {
    console.error(`Error al eliminar venta pendiente ${id}:`, error);
    throw new Error("No se pudo eliminar la venta pendiente. Por favor, intente nuevamente.");
  }
};

/**
 * Completa una venta pendiente (la convierte en venta normal)
 */
export const completarVentaPendiente = async (id: number, pagoInfo: { 
  pagado: string; 
  cambio: string;
  cajaId: number;
  usuarioId: number;
  empresaId: number;
}): Promise<Venta> => {
  try {
    const response = await apiService.patch<Venta>(
      `${VENTA_PENDIENTE_ENDPOINT}/${id}/vender`, 
      pagoInfo
    );
    
    // La venta pendiente se elimina del backend, así que no necesitamos hacer nada más
    return response;
  } catch (error) {
    console.error(`Error al completar venta pendiente ${id}:`, error);
    const errorMessage = error.response?.data?.message || error.message;
    throw new Error(errorMessage || "No se pudo completar la venta pendiente. Por favor, verifique los datos e intente nuevamente.");
  }
};

/**
 * Convierte una venta normal en una venta pendiente
 * @param ventaId ID de la venta a convertir
 * @param empresaId ID de la empresa (opcional, para compatibilidad)
 */
export const convertirAVentaPendiente = async (ventaId: number, empresaId?: number): Promise<VentaPendiente> => {
  try {
    return await apiService.post<VentaPendiente>(
      `${VENTA_PENDIENTE_ENDPOINT}/from-venta/${ventaId}`,
      empresaId ? { empresaId } : {}
    );
  } catch (error) {
    console.error(`Error al convertir venta ${ventaId} a pendiente:`, error);
    throw new Error("No se pudo convertir la venta a pendiente. Por favor, intente nuevamente.");
  }
};
