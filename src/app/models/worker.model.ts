export interface WorkerDto {
  id: string;
  nombre: string;
  especialidad: string;
}

export interface WorkerRequest {
  nombre: string;
  especialidad: string;
}

export interface RegisterWorkerDto {
  dni: string;
  nombre: string;
  especialidad: string;
  password: string;
}
