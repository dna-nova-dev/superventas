import { ApiService } from './api.service';
import { Caja, CreateCajaDto, UpdateCajaDto } from '@/types/caja.interface';

const apiService = new ApiService();

export const getAllCajas = async (empresaId?: number): Promise<Caja[]> => {
  try {
    let url = 'cajas/all';
    if (empresaId) {
      url += `?empresaId=${empresaId}`;
    }
    const response = await apiService.get<any[]>(url);
    
    console.log('Respuesta de la API de cajas:', response); // Debug log
    
    // Mapear los campos de la base de datos a la interfaz Caja
    const cajas = response.map(caja => {
      // Usar los nombres de campos de la base de datos
      const cajaMapeada = {
        id: caja.id,
        numero: caja.caja_numero || caja.numero,
        nombre: caja.caja_nombre || caja.nombre,
        efectivo: caja.caja_efectivo || caja.efectivo || '0.00',
        empresaId: caja.empresa_id || caja.empresaId,
        createdAt: caja.created_at || caja.createdAt,
        updatedAt: caja.updated_at || caja.updatedAt,
        deletedAt: caja.deleted_at || caja.deletedAt || null
      };
      
      console.log('Caja mapeada:', cajaMapeada); // Debug log
      return cajaMapeada;
    });
    
    console.log('Cajas después del mapeo:', cajas); // Debug log
    return cajas;
  } catch (error) {
    console.error('Error al obtener las cajas:', error);
    throw error;
  }
};

export const getCajaById = async (id: number): Promise<Caja> => {
  return await apiService.get<Caja>(`cajas/getById/${id}`);
};

export const createCaja = async (caja: CreateCajaDto): Promise<Caja> => {
  // Convertir a any para evitar problemas de tipo temporalmente
  return await apiService.post<Caja>('cajas/create', caja as any);
};

export const updateCaja = async (id: number, caja: UpdateCajaDto): Promise<Caja> => {
  // Convertir a any para evitar problemas de tipo temporalmente
  return await apiService.patch<Caja>(`cajas/update/${id}`, caja as any);
};

export const deleteCaja = async (id: number): Promise<void> => {
  return await apiService.delete(`cajas/delete/${id}`);
};
