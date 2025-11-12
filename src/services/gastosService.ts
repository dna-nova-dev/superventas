import { Gasto } from '../types';
import { ApiService } from './api.service';

const GASTOS_BASE_URL = 'gastos';
const apiService = new ApiService();

export const getGastos = async (): Promise<Gasto[]> => {
  try {
    const response = await apiService.get<Gasto[]>(`${GASTOS_BASE_URL}/all`);
    return response;
  } catch (error: unknown) {
    console.error("Error fetching gastos:", error);
    if (error instanceof Error) {
      throw new Error(`Error al obtener gastos: ${error.message}`);
    }
    throw new Error('Ocurrió un error desconocido al obtener los gastos');
  }
};

export const getGastoById = async (id: number): Promise<Gasto> => {
  try {
    const response = await apiService.get<Gasto>(`${GASTOS_BASE_URL}/getById/${id}`);
    return response;
  } catch (error: unknown) {
    console.error(`Error fetching gasto with id ${id}:`, error);
    if (error instanceof Error) {
      throw new Error(`Error al obtener el gasto: ${error.message}`);
    }
    throw new Error('Ocurrió un error desconocido al obtener el gasto');
  }
};

export const createGasto = async (gastoData: Omit<Gasto, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>): Promise<Gasto> => {
  try {
    const response = await apiService.post<Gasto>(`${GASTOS_BASE_URL}/create`, gastoData);
    return response;
  } catch (error: unknown) {
    console.error("Error creating gasto:", error);
    if (error instanceof Error) {
      throw new Error(`Error al crear el gasto: ${error.message}`);
    }
    throw new Error('Ocurrió un error desconocido al crear el gasto');
  }
};

export const updateGasto = async (id: number, gastoData: Partial<Gasto>): Promise<Gasto> => {
  try {
    const response = await apiService.patch<Gasto>(`${GASTOS_BASE_URL}/update/${id}`, gastoData);
    return response;
  } catch (error: unknown) {
    console.error(`Error updating gasto with id ${id}:`, error);
    if (error instanceof Error) {
      throw new Error(`Error al actualizar el gasto: ${error.message}`);
    }
    throw new Error('Ocurrió un error desconocido al actualizar el gasto');
  }
};

export const deleteGasto = async (id: number): Promise<void> => {
  try {
    await apiService.delete(`${GASTOS_BASE_URL}/delete/${id}`);
  } catch (error: unknown) {
    console.error(`Error deleting gasto with id ${id}:`, error);
    if (error instanceof Error) {
      throw new Error(`Error al eliminar el gasto: ${error.message}`);
    }
    throw new Error('Ocurrió un error desconocido al eliminar el gasto');
  }
};
