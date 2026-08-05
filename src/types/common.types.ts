export enum Role {
  PATIENT = 'PATIENT',
  DOCTOR = 'DOCTOR',
  ADMIN = 'ADMIN',
}

export interface User {
  id: string;
  role: Role;
  phoneNumber: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}
