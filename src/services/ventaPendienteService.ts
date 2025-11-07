import { ApiService } from './api.service';
import type { VentaPendiente, CreateVentaPendiente, Venta } from '@/types';

const apiService = new ApiService();
const VENTA_ENDPOINT = 'ventas';

/**
 * Obtiene todas las ventas con estado 'pendiente'
 * @param empresaId ID de la empresa (opcional)
 */
export const getVentasPendientes = async (empresaId?: number): Promise<VentaPendiente[]> => {
  try {
    // Usamos el endpoint principal de ventas con filtro de empresa
    const params = new URLSearchParams({
      ...(empresaId && { empresaId: empresaId.toString() })
    });

    // Usamos el endpoint principal de ventas
    const url = `ventas/all-relations?${params.toString()}`;
    console.log('🔄 Obteniendo ventas pendientes de:', url);

    const response = await apiService.get<VentaPendiente[]>(url);
    
    if (!Array.isArray(response)) {
      console.error('❌ La respuesta de la API no es un array:', response);
      return [];
    }

    console.log('📦 Total de ventas recibidas de la API:', response.length);
    
    // Filtramos las ventas pendientes
    console.log('🔍 Estado de todas las ventas recibidas:');
    response.forEach(venta => {
      console.log(`  ID: ${venta.id}, Estado: '${venta.estado}', Fecha: ${venta.fecha}, Total: ${venta.total}`);
    });
    
    // Filtramos las ventas pendientes
    const ventasPendientes = response.filter(venta => {
      const estado = String(venta.estado || '').trim().toLowerCase();
      const esPendiente = estado === 'pendiente';
      
      if (!esPendiente) {
        console.log(`ℹ️  Filtrada venta ID ${venta.id} - Estado: '${venta.estado || 'undefined'}'`);
        return false;
      }
      return true;
    });

    console.log(`✅ ${ventasPendientes.length} ventas pendientes encontradas`);

    return ventasPendientes;
  } catch (error: unknown) {
    console.error("Error fetching ventas pendientes:", error);
    throw error;
  }
};

/**
 * Obtiene una venta pendiente por su ID
 */
export const getVentaPendienteById = async (id: number): Promise<VentaPendiente> => {
  const venta = await apiService.get<VentaPendiente>(`${VENTA_ENDPOINT}/${id}`);
  if (venta.estado !== 'pendiente') {
    throw new Error('La venta no está en estado pendiente');
  }
  return venta;
};

/**
 * Obtiene una venta pendiente por su código
 */
export const getVentaPendienteByCodigo = async (codigo: string): Promise<VentaPendiente> => {
  try {
    const response = await apiService.get<VentaPendiente[]>(`${VENTA_ENDPOINT}/by-codigo/${codigo}`);
    const venta = response[0]; // Asumiendo que el endpoint devuelve un array
    if (venta?.estado !== 'pendiente') {
      throw new Error('No se encontró una venta pendiente con ese código');
    }
    return venta;
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
      `${VENTA_ENDPOINT}`,
      { ...ventaPendiente, estado: 'pendiente' } as unknown as Record<string, unknown>
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
    // Verificamos que la venta exista y esté en estado pendiente
    await getVentaPendienteById(id);
    
    return await apiService.patch<VentaPendiente>(
      `${VENTA_ENDPOINT}/${id}`,
      { ...ventaPendiente, estado: 'pendiente' }
    );
  } catch (error) {
    console.error(`Error al actualizar venta pendiente ${id}:`, error);
    throw new Error("No se pudo actualizar la venta pendiente. Por favor, intente nuevamente.");
  }
};

/**
 * Cambia el estado de una venta de 'pendiente' a 'completada'
 * @param id ID de la venta a actualizar
 */
export const deleteVentaPendiente = async (id: number): Promise<void> => {
  try {
    // Usamos el endpoint de actualización de venta
    await apiService.patch(`ventas/update/${id}`, { 
      estado: 'completada',
      // Asegurarse de incluir los campos necesarios para la actualización
      // según lo que espere tu backend
      actualizado: new Date().toISOString()
    });
    
    console.log(`✅ Venta ${id} marcada como completada correctamente`);
  } catch (error: unknown) {
    console.error(`Error al actualizar el estado de la venta ${id}:`, error);
    throw new Error('No se pudo actualizar el estado de la venta. Por favor, intente nuevamente.');
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
    // Primero obtenemos la venta para verificar que existe y está pendiente
    const venta = await apiService.get<Venta>(`${VENTA_ENDPOINT}/getById/${id}`);
    
    if (venta.estado !== 'pendiente') {
      throw new Error('La venta no está en estado pendiente');
    }
    
    // Actualizamos la venta a estado 'completada' con la información de pago
    return await apiService.patch<Venta>(
      `${VENTA_ENDPOINT}/update/${id}`,
      {
        estado: 'completada',
        pagado: pagoInfo.pagado,
        cambio: pagoInfo.cambio,
        cajaId: pagoInfo.cajaId,
        fechaFinalizacion: new Date().toISOString(),
        // El backend debería manejar la actualización del stock
        // cuando se actualiza el estado a 'completada'
      }
    );
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
    // Primero obtenemos la venta
    const venta = await apiService.get<VentaPendiente>(`${VENTA_ENDPOINT}/${ventaId}`);
    
    // Actualizamos el estado a 'pendiente'
    return await apiService.patch<VentaPendiente>(
      `${VENTA_ENDPOINT}/${ventaId}`,
      { 
        ...venta,
        estado: 'pendiente',
        ...(empresaId && { empresaId })
      }
    );
  } catch (error) {
    console.error(`Error al convertir venta ${ventaId} a pendiente:`, error);
    throw new Error("No se pudo convertir la venta a pendiente. Por favor, intente nuevamente.");
  }
};
