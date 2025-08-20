import { Producto } from '@/types';
import { ApiService } from './api.service';

const api = new ApiService();

export const getAllProductos = async (empresaId?: number): Promise<Producto[]> => {
  try {
    let url = 'productos/all';
    if (empresaId) {
      url += `?empresaId=${empresaId}`;
    }
    return await api.get<Producto[]>(url);
  } catch (error) {
    console.error('Error fetching productos:', error);
    throw error;
  }
};

export const getProductoById = async (id: number): Promise<Producto | undefined> => {
  try {
    return await api.get<Producto>(`productos/getById/${id}`);
  } catch (error) {
    console.error(`Error fetching producto ${id}:`, error);
    return undefined;
  }
};

export const createProducto = async (producto: Omit<Producto, 'id'>): Promise<Producto> => {
  try {
    return await api.post<Producto>('productos/create', producto);
  } catch (error) {
    console.error('Error creating producto:', error);
    throw error;
  }
};

export const updateProducto = async (id: number, producto: Partial<Producto>): Promise<Producto | undefined> => {
  try {
    return await api.patch<Producto>(`productos/update/${id}`, producto);
  } catch (error) {
    console.error(`Error updating producto ${id}:`, error);
    return undefined;
  }
};

export const deleteProducto = async (id: number): Promise<boolean> => {
  try {
    await api.delete(`productos/delete/${id}`);
    return true;
  } catch (error) {
    console.error(`Error deleting producto ${id}:`, error);
    return false;
  }
};
