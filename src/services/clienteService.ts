


import { Cliente } from '@/types';
import { ApiService } from './api.service';

const api = new ApiService();

const CLIENTE_BASE_URL = 'clientes';

export const getAllClientes = async (empresaId?: number): Promise<Cliente[]> => {
  try {
    let url = `${CLIENTE_BASE_URL}/all`;
    if (empresaId) {
      url += `?empresaId=${empresaId}`;
    }
    return await api.get<Cliente[]>(url);
  } catch (error: any) {
    console.error("Error fetching clientes:", error.response?.data || error.message);
    throw error;
  }
};

export const getClienteById = async (id: number): Promise<Cliente> => {
  try {
    return await api.get<Cliente>(`${CLIENTE_BASE_URL}/getById/${id}`);
  } catch (error: any) {
    console.error("Error fetching cliente by ID:", error.response?.data || error.message);
    throw error;
  }
};

export const createCliente = async (cliente: Omit<Cliente, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>): Promise<Cliente> => {
  try {
    return await api.post<Cliente>(`${CLIENTE_BASE_URL}/create`, cliente);
  } catch (error: any) {
    console.error("Error creating cliente:", error.response?.data || error.message);
    throw error;
  }
};

export const updateCliente = async (id: number, cliente: Partial<Cliente>): Promise<Cliente> => {
  try {
    return await api.patch<Cliente>(`${CLIENTE_BASE_URL}/update/${id}`, cliente);
  } catch (error: any) {
    console.error("Error updating cliente:", error.response?.data || error.message);
    throw error;
  }
};

export const deleteCliente = async (id: number): Promise<void> => {
  try {
    await api.delete(`${CLIENTE_BASE_URL}/delete/${id}`);
  } catch (error: any) {
    console.error("Error deleting cliente:", error.response?.data || error.message);
    throw error;
  }
};
