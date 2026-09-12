export type AppointmentEventType =
  | 'feeding'
  | 'veterinary'
  | 'farrier'
  | 'vaccine'
  | 'training'
  | 'medication'
  | 'management'
  | 'other'

export type AppointmentStatus =
  | 'pending'
  | 'completed'
  | 'cancelled'

export type Appointment = {
  id: string
  title: string
  description: string | null
  eventType: AppointmentEventType
  scheduledAt: string
  horseId: string | null
  status: AppointmentStatus
  createdAt: string
}

export type CreateAppointmentInput = {
  title: string
  description: string | null
  eventType: AppointmentEventType
  scheduledAt: string
  horseId: string | null
}

export type UpdateAppointmentInput = {
  title: string
  description: string | null
  eventType: AppointmentEventType
  scheduledAt: string
  horseId: string | null
  status: AppointmentStatus
}

export const APPOINTMENT_EVENT_LABELS: Record<
  AppointmentEventType,
  string
> = {
  feeding: 'Alimentação',
  veterinary: 'Veterinário',
  farrier: 'Ferrageamento',
  vaccine: 'Vacinação',
  training: 'Treino',
  medication: 'Medicação',
  management: 'Gestão do haras',
  other: 'Outro',
}

export const APPOINTMENT_STATUS_LABELS: Record<
  AppointmentStatus,
  string
> = {
  pending: 'Pendente',
  completed: 'Concluído',
  cancelled: 'Cancelado',
}