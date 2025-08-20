import { CreateEmpresa, Empresa } from '@/types';
import { ApiService } from './api.service';

const EMPRESA_ENDPOINT = 'empresas';
const apiService = new ApiService();

export const getAllEmpresas = async (): Promise<Empresa[]> => {
  try {
    const response = await apiService.get<Empresa[]>(`${EMPRESA_ENDPOINT}/all`);
    return response;
  } catch (error: any) {
    console.error("Error fetching empresas:", error);
    throw error;
  }
};

export const getEmpresaById = async (id: number): Promise<Empresa> => {
  try {
    return await apiService.get<Empresa>(`${EMPRESA_ENDPOINT}/getById/${id}`);
  } catch (error: any) {
    console.error(`Error fetching empresa with ID ${id}:`, error);
    throw error;
  }
};

export const createEmpresa = async (empresa: Omit<CreateEmpresa, 'empresa_id'>): Promise<CreateEmpresa> => {
  try {
    return await apiService.post<Empresa>(`${EMPRESA_ENDPOINT}/create`, empresa);
  } catch (error: any) {
    console.error("Error creating empresa:", error);
    throw error;
  }
};

export const getEmpresaByUsuarioId = async (owner: number): Promise<Empresa> => {
  try {
    const response = await apiService.get<Empresa>(`${EMPRESA_ENDPOINT}/by-owner/${owner}`);
    return response;
  } catch (error: any) {
    console.error(`Error fetching ventas for owner ID ${owner}:`, error);
    throw error;
  }
};

export const getEmpresaByEmpleadoId = async (empleadoId: number): Promise<Empresa> => {
  try {
    const response = await apiService.get<Empresa>(`${EMPRESA_ENDPOINT}/by-empleado/${empleadoId}`);
    return response;
  } catch (error: any) {
    console.error(`Error fetching empresa for empleado ID ${empleadoId}:`, error);
    throw error;
  }
};

export const updateEmpresa = async (id: number, empresa: Partial<Empresa>): Promise<Empresa> => {
  try {
    return await apiService.patch<Empresa>(`${EMPRESA_ENDPOINT}/update/${id}`, empresa);
  } catch (error: any) {
    console.error(`Error updating empresa with ID ${id}:`, error);
    throw error;
  }
};
export const deleteEmpresa = async (id: number): Promise<void> => {
  try {
    return await apiService.delete(`${EMPRESA_ENDPOINT}/delete/${id}`);
  } catch (error: any) {
    console.error(`Error deleting empresa with ID ${id}:`, error);
    throw error;
  }
}
