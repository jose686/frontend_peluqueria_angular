export interface User {
  id: string;
  email: string;
  nombre: string;
  apellidos?: string;
  telefono?: string;
  role: string;
  activo?: boolean;
  fechaCreacion?: string;
}

export interface LoginRequest {
  email: string;
  password:  string;
}

export interface LoginResponse {
  token: string;
  type: string;
  id: string;
  email: string;
  role: string;
}

export interface RegisterRequest {
  email: string;
  password:  string;
  nombre: string;
  apellidos?: string;
  telefono?: string;
}
