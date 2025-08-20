import { ApiService } from './api.service';
import { Caja, CreateCajaDto, UpdateCajaDto } from '@/types/caja.interface';

const apiService = new ApiService();

export const getAllCajas = async (empresaId?: number): Promise<Caja[]> => {
  let url = 'cajas/all';
  if (empresaId) {
    url += `?empresaId=${empresaId}`;
  }
  return await apiService.get<Caja[]>(url);
};

export const getCajaById = async (id: number): Promise<Caja> => {
  return await apiService.get<Caja>(`cajas/getById/${id}`);
};

export const createCaja = async (caja: CreateCajaDto): Promise<Caja> => {
  return await apiService.post<Caja>('cajas/create', caja);
};

export const updateCaja = async (id: number, caja: UpdateCajaDto): Promise<Caja> => {
  return await apiService.patch<Caja>(`cajas/update/${id}`, caja);
};

export const deleteCaja = async (id: number): Promise<void> => {
  return await apiService.delete(`cajas/delete/${id}`);
};
