export interface ShiftDto {
  id: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  breakStartTime?: string;
  breakEndTime?: string;
  workerId: string;
}

export interface ShiftRequestDto {
  fecha: string;
  horaInicio: string;
  horaFin: string;
  breakStartTime?: string;
  breakEndTime?: string;
}
