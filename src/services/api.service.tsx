// Base API service with authentication
import { AuthService } from "./auth.service";

export class ApiService {
  static post(arg0: string, ventaPendiente: { productos: string; clienteId: number; clienteName: string; total: string; nombreVendedor: string; estado: string; fecha: string; }) {
    throw new Error("Method not implemented.");
  }
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL as string;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    const token = AuthService.getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return headers;
  }

  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}/${endpoint}`, {
      method: "GET",
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }

  async put<T, D extends Record<string, unknown> = Record<string, unknown>>(endpoint: string, data: D): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}/${endpoint}`, {
        method: "PUT",
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });

      const responseData = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorMessage = (responseData as { message?: string }).message || response.statusText;
        const error = new Error(`API error: ${response.status} ${errorMessage}`) as Error & {
          status: number;
          data?: unknown;
        };
        error.status = response.status;
        error.data = responseData;
        throw error;
      }

      return responseData as T;
    } catch (error) {
      console.error('Error en la petición PUT:', error);
      throw error;
    }
  }

  async post<T, D extends Record<string, unknown> = Record<string, unknown>>(endpoint: string, data: D): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}/${endpoint}`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });

      const responseData = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorMessage = (responseData as { message?: string }).message || response.statusText;
        const error = new Error(`API error: ${response.status} ${errorMessage}`) as Error & {
          status: number;
          data: unknown;
        };
        error.status = response.status;
        error.data = responseData;
        throw error;
      }

      return responseData as T;
    } catch (error) {
      console.error('Error in API POST request:', error);
      throw error;
    }
  }

  async patch<T, D extends Record<string, unknown> = Record<string, unknown>>(endpoint: string, data: D): Promise<T> {
    const response = await fetch(`${this.baseUrl}/${endpoint}`, {
      method: "PATCH",
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }

  async delete<T = void, D extends Record<string, unknown> = Record<string, unknown>>(
    endpoint: string, 
    data?: D
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}/${endpoint}`, {
      method: "DELETE",
      headers: this.getHeaders(),
      ...(data && { body: JSON.stringify(data) })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    // Si la respuesta no tiene contenido, devolvemos void
    if (response.status === 204) {
      return undefined as unknown as T;
    }

    // Si se espera un tipo específico, intentamos parsear la respuesta
    return response.json() as Promise<T>;
  }
}
