export interface AppointmentDto {
  id: string; // UUID
  userId?: string; // UUID (nullable)
  customerId?: string; // UUID (nullable)
  workerId: string; // UUID
  serviceItemId: number | string;
  fecha: string; // LocalDate (YYYY-MM-DD)
  horaInicio: string; // LocalTime (HH:mm or HH:mm:ss)
  horaFin: string; // LocalTime (HH:mm or HH:mm:ss)
  estado: string; // PENDIENTE, CONFIRMADA, CANCELADA, etc.
  clienteNombre?: string;
  clienteTelefono?: string;
  workerName?: string;
  serviceName?: string;
  precio?: number;
}

export interface AppointmentRequest {
  workerId: string; // UUID
  serviceItemId: number | string;
  fecha: string; // LocalDate (YYYY-MM-DD)
  horaInicio: string; // LocalTime (HH:mm)
}

export interface AvailableSlotsResponse {
  horasDisponibles: string[]; // List of LocalTime as strings
}

export interface OtpRequest {
  telefono: string;
}

export interface OtpVerifyResponse {
  valid: boolean;
  message: string;
}

export interface PublicBookRequest {
  workerId: string;
  serviceItemId: number | string;
  fecha: string;
  horaInicio: string;
  nombre: string;
  telefono: string;
  pin: string;
}

