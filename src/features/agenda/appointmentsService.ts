import type {
  Appointment,
  AppointmentEventType,
  AppointmentStatus,
  CreateAppointmentInput,
  UpdateAppointmentInput,
} from '../../domain/appointment.ts'

import { supabase } from '../../lib/supabase.ts'

type AppointmentRow = {
  id: string
  title: string
  description: string | null
  event_type: AppointmentEventType
  scheduled_at: string
  horse_id: string | null
  professional_id: string | null
  status: AppointmentStatus
  created_at: string
}

type HorseRelation = {
  id: string
  name: string
}

type ProfessionalRelation = {
  id: string
  name: string
  specialty: string | null
}

type Relation<T> =
  | T
  | T[]
  | null

type AppointmentListRow = AppointmentRow & {
  horse: Relation<HorseRelation>
  professional: Relation<ProfessionalRelation>
}

export type AppointmentListItem = Appointment & {
  horseName: string | null
  professionalName: string | null
  professionalSpecialty: string | null
}

const appointmentSelect = `
  id,
  title,
  description,
  event_type,
  scheduled_at,
  horse_id,
  professional_id,
  status,
  created_at
`

const appointmentListSelect = `
  id,
  title,
  description,
  event_type,
  scheduled_at,
  horse_id,
  professional_id,
  status,
  created_at,
  horse:horses (
    id,
    name
  ),
  professional:professionals (
    id,
    name,
    specialty
  )
`

function getSingleRelation<T>(
  relation: Relation<T>,
): T | null {
  if (!relation) {
    return null
  }

  if (Array.isArray(relation)) {
    return relation[0] ?? null
  }

  return relation
}

function mapAppointment(
  row: AppointmentRow,
): Appointment {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    eventType: row.event_type,
    scheduledAt: row.scheduled_at,
    horseId: row.horse_id,
    professionalId: row.professional_id,
    status: row.status,
    createdAt: row.created_at,
  }
}

function mapAppointmentListItem(
  row: AppointmentListRow,
): AppointmentListItem {
  const horse =
    getSingleRelation(row.horse)

  const professional =
    getSingleRelation(row.professional)

  return {
    ...mapAppointment(row),

    horseName:
      horse?.name ?? null,

    professionalName:
      professional?.name ?? null,

    professionalSpecialty:
      professional?.specialty ?? null,
  }
}

function getTodayRange() {
  const start = new Date()

  start.setHours(
    0,
    0,
    0,
    0,
  )

  const end = new Date(start)

  end.setDate(
    end.getDate() + 1,
  )

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  }
}

export async function getAppointments(): Promise<
  AppointmentListItem[]
> {
  const { data, error } = await supabase
    .from('appointments')
    .select(appointmentListSelect)
    .order('scheduled_at', {
      ascending: true,
    })

  if (error) {
    throw new Error(
      `Erro ao buscar compromissos: ${error.message}`,
    )
  }

  return (data ?? []).map(
    (appointment) =>
      mapAppointmentListItem(
        appointment as AppointmentListRow,
      ),
  )
}

export async function getTodayAppointments(): Promise<
  AppointmentListItem[]
> {
  const {
    start,
    end,
  } = getTodayRange()

  const { data, error } = await supabase
    .from('appointments')
    .select(appointmentListSelect)
    .gte('scheduled_at', start)
    .lt('scheduled_at', end)
    .neq('status', 'cancelled')
    .order('scheduled_at', {
      ascending: true,
    })

  if (error) {
    throw new Error(
      `Erro ao buscar compromissos de hoje: ${error.message}`,
    )
  }

  return (data ?? []).map(
    (appointment) =>
      mapAppointmentListItem(
        appointment as AppointmentListRow,
      ),
  )
}

export async function getAppointmentById(
  appointmentId: string,
): Promise<Appointment> {
  const { data, error } = await supabase
    .from('appointments')
    .select(appointmentSelect)
    .eq('id', appointmentId)
    .single()

  if (error) {
    throw new Error(
      `Erro ao buscar compromisso: ${error.message}`,
    )
  }

  return mapAppointment(
    data as AppointmentRow,
  )
}

export async function createAppointment(
  input: CreateAppointmentInput,
): Promise<Appointment> {
  const { data, error } = await supabase
    .from('appointments')
    .insert({
      title: input.title,
      description: input.description,
      event_type: input.eventType,
      scheduled_at: input.scheduledAt,
      horse_id: input.horseId,
      professional_id:
        input.professionalId,
    })
    .select(appointmentSelect)
    .single()

  if (error) {
    throw new Error(
      `Erro ao criar compromisso: ${error.message}`,
    )
  }

  return mapAppointment(
    data as AppointmentRow,
  )
}

export async function updateAppointment(
  appointmentId: string,
  input: UpdateAppointmentInput,
): Promise<Appointment> {
  const { data, error } = await supabase
    .from('appointments')
    .update({
      title: input.title,
      description: input.description,
      event_type: input.eventType,
      scheduled_at: input.scheduledAt,
      horse_id: input.horseId,
      professional_id:
        input.professionalId,
      status: input.status,
    })
    .eq('id', appointmentId)
    .select(appointmentSelect)
    .single()

  if (error) {
    throw new Error(
      `Erro ao atualizar compromisso: ${error.message}`,
    )
  }

  return mapAppointment(
    data as AppointmentRow,
  )
}

export async function updateAppointmentStatus(
  appointmentId: string,
  status: AppointmentStatus,
): Promise<Appointment> {
  const { data, error } = await supabase
    .from('appointments')
    .update({
      status,
    })
    .eq('id', appointmentId)
    .select(appointmentSelect)
    .single()

  if (error) {
    throw new Error(
      `Erro ao atualizar status do compromisso: ${error.message}`,
    )
  }

  return mapAppointment(
    data as AppointmentRow,
  )
}

export async function deleteAppointment(
  appointmentId: string,
): Promise<void> {
  const { error } = await supabase
    .from('appointments')
    .delete()
    .eq('id', appointmentId)

  if (error) {
    throw new Error(
      `Erro ao excluir compromisso: ${error.message}`,
    )
  }
}