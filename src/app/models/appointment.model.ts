export interface AppointmentDto {
  id: string; // UUID
  userId: string; // UUID
  workerId: string; // UUID
  serviceItemId: string; // UUID
  fecha: string; // LocalDate (YYYY-MM-DD)
  horaInicio: string; // LocalTime (HH:mm or HH:mm:ss)
  horaFin: string; // LocalTime (HH:mm or HH:mm:ss)
  estado: string; // PENDIENTE, CONFIRMADA, CANCELADA, etc.
}

export interface AppointmentRequest {
  workerId: string; // UUID
  serviceItemId: string; // UUID
  fecha: string; // LocalDate (YYYY-MM-DD)
  horaInicio: string; // LocalTime (HH:mm)
}

export interface AvailableSlotsResponse {
  horasDisponibles: string[]; // List of LocalTime as strings
}
