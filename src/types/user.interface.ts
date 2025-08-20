export interface User {
  _id: string;
  novaId: string;
  nombre: string;
  email: string;
  countryCode: string;
  telefono: string;
  rol: string;
  enrolledCoursesIds: string[];
  foto_perfil?: string;
  createdAt: Date;
  role: "student" | "teacher" | "admin";
}

export interface LoginResponse {
  token: string;
  user: User;
}
