import { Usuario } from '@/types';
import { ApiService } from './api.service';

// Define the structure for the user object in the API response
export interface UserResponse {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  usuario: string;
  cargo: string;
  cajaId: number;
  foto: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  empresaId: number; // Assuming empresaId is part of the user object
}

// Define the structure for the login API response
export interface LoginResponse {
  access_token: string;
  user: UserResponse;
}

// Update credentials interface to use username
export interface LoginCredentials {
  username: string;
  password: string;
}

// Instantiate ApiService outside the object
const apiServiceInstance = new ApiService();

// Helper function to map API response to Usuario type
const mapUserResponse = (user: UserResponse): Usuario => ({
  usuario_id: user.id,
  usuario_nombre: user.nombre,
  usuario_apellido: user.apellido,
  usuario_email: user.email,
  usuario_usuario: user.usuario,
  usuario_clave: '', // Password not included in API response
  usuario_cargo: user.cargo,
  caja_id: user.cajaId,
  usuario_foto: user.foto,
  usuario_creado: user.createdAt,
  usuario_actualizado: user.updatedAt,
  usuario_eliminado: user.deletedAt,
  empresaId: user.empresaId, // Assuming empresaId is part of the user object
});

export const usuarioService = {
  apiService: apiServiceInstance,

  async getAllUsuarios(): Promise<Usuario[]> {
    try {
      const response = await apiServiceInstance.get<UserResponse[]>('usuarios/all');
      return response.map(mapUserResponse);
    } catch (error) {
      console.error("Error fetching users:", error);
      throw new Error('Error al obtener la lista de usuarios');
    }
  },

  async getUsuarioById(id: number): Promise<Usuario | undefined> {
    try {
      const response = await apiServiceInstance.get<UserResponse>(`usuarios/getById/${id}`);
      return mapUserResponse(response);
    } catch (error) {
      console.error(`Error fetching user ${id}:`, error);
      return undefined;
    }
  },

  async createUsuario(usuario: Omit<Usuario, 'usuario_id' | 'usuario_creado' | 'usuario_actualizado' | 'usuario_eliminado'>): Promise<Usuario> {
    try {
      const payload = {
        nombre: usuario.usuario_nombre,
        apellido: usuario.usuario_apellido,
        email: usuario.usuario_email,
        usuario: usuario.usuario_usuario,
        cargo: usuario.usuario_cargo,
        cajaId: usuario.caja_id,
        foto: usuario.usuario_foto,
        clave: usuario.usuario_clave, // Assuming clave is part of the payload
        empresaId: usuario.empresaId // Assuming empresaId is part of the payload
      };
      const response = await apiServiceInstance.post<UserResponse>('usuarios/create', payload);
      return mapUserResponse(response);
    } catch (error) {
      console.error("Error creating user:", error);
      throw new Error('Error al crear el usuario');
    }
  },

  async updateUsuario(id: number, usuario: Partial<Usuario>): Promise<Usuario> {
    try {
      const payload = {
        nombre: usuario.usuario_nombre,
        apellido: usuario.usuario_apellido,
        email: usuario.usuario_email,
        usuario: usuario.usuario_usuario,
        cargo: usuario.usuario_cargo,
        cajaId: usuario.caja_id,
        foto: usuario.usuario_foto,
        empresaId: usuario.empresaId // Assuming empresaId is part of the payload
      };
      const response = await apiServiceInstance.patch<UserResponse>(`usuarios/update/${id}`, payload);
      return mapUserResponse(response);
    } catch (error) {
      console.error(`Error updating user ${id}:`, error);
      throw new Error('Error al actualizar el usuario');
    }
  },

  async deleteUsuario(id: number): Promise<void> {
    try {
      await apiServiceInstance.delete(`usuarios/delete/${id}`);
    } catch (error) {
      console.error(`Error deleting user ${id}:`, error);
      throw new Error('Error al eliminar el usuario');
    }
  },

  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const response = await apiServiceInstance.post<LoginResponse>('auth/login', credentials);
      return response;
    } catch (error) {
      console.error("Login failed:", error);
      if (error instanceof Error && error.message.includes('401')) {
        throw new Error('Credenciales inválidas');
      }
      throw new Error('Error al intentar iniciar sesión. Por favor, inténtalo de nuevo.');
    }
  },

  logout() {
    localStorage.removeItem('auth_token');
  },

  getCurrentUser(): UserResponse | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token');
  },


  async updatePassword(userId: number, currentPassword: string, newPassword: string): Promise<void> {
    try {
      await apiServiceInstance.patch(`usuarios/update/${userId}`, {
        currentPassword,
        password: newPassword
      });
    } catch (error) {
      console.error("Password update failed:", error);
      throw new Error('Error al actualizar la contraseña');
    }
  }
};

// Removemos las exportaciones individuales ya que ahora están dentro del objeto usuarioService
