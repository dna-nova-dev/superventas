import { ApiService } from './api.service';
import { Categoria } from '@/types';

const api = new ApiService();

function toCategoria(apiCat: Categoria): Categoria {
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
  try {
    let url = 'categorias/all';
    if (empresaId) {
      url += `?empresaId=${empresaId}`;
    }
    console.log('Solicitando categorías a:', url);
    const response = await api.get<Categoria[]>(url);
    console.log('Respuesta de la API (categorías):', response);
    
    if (!Array.isArray(response)) {
      console.error('La respuesta de la API no es un array:', response);
      throw new Error('Formato de respuesta inesperado');
    }
    
    const categorias = response.map(toCategoria);
    console.log('Categorías mapeadas:', categorias);
    return categorias;
  } catch (error) {
    console.error('Error en getAllCategorias:', error);
    throw error; // Re-lanzamos el error para manejarlo en el componente
  }
};

export const getCategoriaById = async (id: number): Promise<Categoria | undefined> => {
  try {
    const apiCategoria = await api.get<Categoria>(`categorias/getById/${id}`);
    return toCategoria(apiCategoria);
  } catch (error) {
    console.error('Error fetching categoria:', error);
    return undefined;
  }
};

export const createCategoria = async (categoria: Omit<Categoria, 'id'>): Promise<Categoria> => {
  const apiCategoria = await api.post<Categoria>('categorias/create', {
    nombre: categoria.nombre,
    ubicacion: categoria.ubicacion,
    empresaId: categoria.empresaId
  });
  return toCategoria(apiCategoria);
};

export const updateCategoria = async (id: number, categoria: Partial<Categoria>): Promise<Categoria | undefined> => {
  try {
    const updateData: Partial<Categoria> = {};
    if (categoria.nombre) updateData.nombre = categoria.nombre;
    if (categoria.ubicacion) updateData.ubicacion = categoria.ubicacion;

    const updatedCategoria = await api.put<Categoria>(`categorias/update/${id}`, updateData);
    return toCategoria(updatedCategoria);
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
