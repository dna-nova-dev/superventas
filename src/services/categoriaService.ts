import { ApiService } from './api.service';
import { Categoria } from '@/types';

const api = new ApiService();

interface ApiCategoriaResponse extends Categoria {}

function toCategoria(apiCat: ApiCategoriaResponse): Categoria {
  return {
    id: apiCat.id,
    nombre: apiCat.nombre,
    ubicacion: apiCat.ubicacion,
    createdAt: apiCat.createdAt,
    updatedAt: apiCat.updatedAt,
    deletedAt: apiCat.deletedAt,
    empresaId: apiCat.empresaId
  };
}

export const getAllCategorias = async (empresaId?: number): Promise<Categoria[]> => {
  let url = 'categorias/all';
  if (empresaId) {
    url += `?empresaId=${empresaId}`;
  }
  const apiCategorias = await api.get<ApiCategoriaResponse[]>(url);
  return apiCategorias.map(toCategoria);
};

export const getCategoriaById = async (id: number): Promise<Categoria | undefined> => {
  try {
    const apiCategoria = await api.get<ApiCategoriaResponse>(`categorias/getById/${id}`);
    return toCategoria(apiCategoria);
  } catch (error) {
    console.error('Error fetching categoria:', error);
    return undefined;
  }
};

export const createCategoria = async (categoria: Omit<Categoria, 'id'>): Promise<Categoria> => {
  const apiCategoria = await api.post<ApiCategoriaResponse>('categorias/create', {
    nombre: categoria.nombre,
    ubicacion: categoria.ubicacion,
    empresaId: categoria.empresaId
  });
  return toCategoria(apiCategoria);
};

export const updateCategoria = async (id: number, categoria: Partial<Categoria>): Promise<Categoria | undefined> => {
  try {
    const updateData: Partial<ApiCategoriaResponse> = {};
    if (categoria.nombre) updateData.nombre = categoria.nombre;
    if (categoria.ubicacion) updateData.ubicacion = categoria.ubicacion;

    const apiCategoria = await api.patch<ApiCategoriaResponse>(`categorias/update/${id}`, updateData);
    return toCategoria(apiCategoria);
  } catch (error) {
    console.error('Error updating categoria:', error);
    return undefined;
  }
};

export const deleteCategoria = async (id: number): Promise<boolean> => {
  try {
    await api.delete(`categorias/delete/${id}`);
    return true;
  } catch (error) {
    console.error('Error deleting categoria:', error);
    return false;
  }
};
