import { Proveedor } from "@/types";
import { ApiService } from "./api.service";

const api = new ApiService();

const PROVEEDOR_BASE_URL = "proveedores";

export const getAllProveedores = async (
  empresaId?: number
): Promise<Proveedor[]> => {
  try {
    let url = `${PROVEEDOR_BASE_URL}/all`;
    if (empresaId) {
      url += `?empresaId=${empresaId}`;
    }
    return await api.get<Proveedor[]>(url);
  } catch (error: any) {
    console.error(
      "Error fetching clientes:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export const getProveedorById = async (id: number): Promise<Proveedor> => {
  try {
    return await api.get<Proveedor>(`${PROVEEDOR_BASE_URL}/getById/${id}`);
  } catch (error: any) {
    console.error(
      "Error fetching proveedor by ID:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export const createProveedor = async (
  proveedor: Omit<Proveedor, "id" | "createdAt" | "updatedAt" | "deletedAt">
): Promise<Proveedor> => {
  try {
    return await api.post<Proveedor>(`${PROVEEDOR_BASE_URL}/create`, proveedor);
  } catch (error: any) {
    console.error(
      "Error creating cliente:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export const updateProveedor = async (
  id: number,
  proveedor: Partial<Proveedor>
): Promise<Proveedor> => {
  try {
    return await api.patch<Proveedor>(
      `${PROVEEDOR_BASE_URL}/update/${id}`,
      proveedor
    );
  } catch (error: any) {
    console.error(
      "Error updating proveedor:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export const deleteProveedor = async (id: number): Promise<void> => {
  try {
    await api.delete(`${PROVEEDOR_BASE_URL}/delete/${id}`);
  } catch (error: any) {
    console.error(
      "Error deleting proveedor:",
      error.response?.data || error.message
    );
    throw error;
  }
};
