import type {
  Appointment,
  AppointmentEventType,
  AppointmentStatus,
  CompleteAppointmentResult,
  CreateAppointmentInput,
  UpdateAppointmentInput,
} from '../../domain/appointment.ts'

import {
  supabase,
} from '../../lib/supabase.ts'

type AppointmentRow = {
  id: string
  title: string
  description: string | null
  event_type: AppointmentEventType
  scheduled_at: string
  horse_id: string | null
  professional_id: string | null
  service_amount: number | string | null
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

type AppointmentListRow =
  AppointmentRow & {
    horse: Relation<HorseRelation>
    professional: Relation<ProfessionalRelation>
  }

type AppointmentPaymentRow = {
  appointment_id: string | null
}

type SuggestedAmountRow = {
  service_amount: number | string | null
}

type CompleteAppointmentRow = {
  completed_appointment_id: string
  completed_status: string
  created_transaction_id: string | null
  payment_registered: boolean
  already_registered: boolean
}

export type AppointmentListItem =
  Appointment & {
    horseName: string | null
    professionalName: string | null
    professionalSpecialty: string | null
    paymentRegistered: boolean
  }

const appointmentSelect = `
  id,
  title,
  description,
  event_type,
  scheduled_at,
  horse_id,
  professional_id,
  service_amount,
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
  service_amount,
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

  if (
    Array.isArray(
      relation,
    )
  ) {
    return relation[0] ??
      null
  }

  return relation
}

function mapAppointment(
  row: AppointmentRow,
): Appointment {
  return {
    id:
      row.id,

    title:
      row.title,

    description:
      row.description,

    eventType:
      row.event_type,

    scheduledAt:
      row.scheduled_at,

    horseId:
      row.horse_id,

    professionalId:
      row.professional_id,

    serviceAmount:
      row.service_amount ===
      null
        ? null
        : Number(
            row.service_amount,
          ),

    status:
      row.status,

    createdAt:
      row.created_at,
  }
}

function mapAppointmentListItem(
  row: AppointmentListRow,
  paidAppointmentIds: Set<string>,
): AppointmentListItem {
  const horse =
    getSingleRelation(
      row.horse,
    )

  const professional =
    getSingleRelation(
      row.professional,
    )

  return {
    ...mapAppointment(
      row,
    ),

    horseName:
      horse?.name ??
      null,

    professionalName:
      professional?.name ??
      null,

    professionalSpecialty:
      professional?.specialty ??
      null,

    paymentRegistered:
      paidAppointmentIds.has(
        row.id,
      ),
  }
}

function getTodayRange() {
  const start =
    new Date()

  start.setHours(
    0,
    0,
    0,
    0,
  )

  const end =
    new Date(
      start,
    )

  end.setDate(
    end.getDate() + 1,
  )

  return {
    start:
      start.toISOString(),

    end:
      end.toISOString(),
  }
}

async function getPaidAppointmentIds(
  appointmentIds: string[],
): Promise<Set<string>> {
  if (
    appointmentIds.length ===
    0
  ) {
    return new Set()
  }

  const {
    data,
    error,
  } = await supabase
    .from(
      'financial_transactions',
    )
    .select(
      'appointment_id',
    )
    .eq(
      'source_type',
      'appointment',
    )
    .in(
      'appointment_id',
      appointmentIds,
    )

  if (error) {
    throw new Error(
      `Erro ao verificar pagamentos da agenda: ${error.message}`,
    )
  }

  return new Set(
    (
      data ??
      []
    )
      .map(
        (row) =>
          (
            row as AppointmentPaymentRow
          ).appointment_id,
      )
      .filter(
        (
          appointmentId,
        ): appointmentId is string =>
          appointmentId !==
          null,
      ),
  )
}

async function mapAppointmentsWithPaymentStatus(
  rows: AppointmentListRow[],
): Promise<AppointmentListItem[]> {
  const paidAppointmentIds =
    await getPaidAppointmentIds(
      rows.map(
        (row) =>
          row.id,
      ),
    )

  return rows.map(
    (row) =>
      mapAppointmentListItem(
        row,
        paidAppointmentIds,
      ),
  )
}

export async function getAppointments(): Promise<
  AppointmentListItem[]
> {
  const {
    data,
    error,
  } = await supabase
    .from(
      'appointments',
    )
    .select(
      appointmentListSelect,
    )
    .order(
      'scheduled_at',
      {
        ascending:
          true,
      },
    )

  if (error) {
    throw new Error(
      `Erro ao buscar compromissos: ${error.message}`,
    )
  }

  return mapAppointmentsWithPaymentStatus(
    (
      data ??
      []
    ) as AppointmentListRow[],
  )
}

export async function getTodayAppointments(): Promise<
  AppointmentListItem[]
> {
  const {
    start,
    end,
  } =
    getTodayRange()

  const {
    data,
    error,
  } = await supabase
    .from(
      'appointments',
    )
    .select(
      appointmentListSelect,
    )
    .gte(
      'scheduled_at',
      start,
    )
    .lt(
      'scheduled_at',
      end,
    )
    .neq(
      'status',
      'cancelled',
    )
    .order(
      'scheduled_at',
      {
        ascending:
          true,
      },
    )

  if (error) {
    throw new Error(
      `Erro ao buscar compromissos de hoje: ${error.message}`,
    )
  }

  return mapAppointmentsWithPaymentStatus(
    (
      data ??
      []
    ) as AppointmentListRow[],
  )
}

export async function getAppointmentById(
  appointmentId: string,
): Promise<Appointment> {
  const {
    data,
    error,
  } = await supabase
    .from(
      'appointments',
    )
    .select(
      appointmentSelect,
    )
    .eq(
      'id',
      appointmentId,
    )
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

export async function getAppointmentPaymentRegistered(
  appointmentId: string,
): Promise<boolean> {
  const {
    data,
    error,
  } = await supabase
    .from(
      'financial_transactions',
    )
    .select(
      'id',
    )
    .eq(
      'appointment_id',
      appointmentId,
    )
    .eq(
      'source_type',
      'appointment',
    )
    .limit(
      1,
    )

  if (error) {
    throw new Error(
      `Erro ao verificar pagamento do compromisso: ${error.message}`,
    )
  }

  return (
    data?.length ??
    0
  ) > 0
}

export async function getSuggestedServiceAmount(
  professionalId: string,
  eventType: AppointmentEventType,
): Promise<number | null> {
  if (
    !professionalId
  ) {
    return null
  }

  const {
    data,
    error,
  } = await supabase
    .from(
      'appointments',
    )
    .select(
      'service_amount',
    )
    .eq(
      'professional_id',
      professionalId,
    )
    .eq(
      'event_type',
      eventType,
    )
    .not(
      'service_amount',
      'is',
      null,
    )
    .order(
      'scheduled_at',
      {
        ascending:
          false,
      },
    )
    .limit(
      1,
    )

  if (error) {
    throw new Error(
      `Erro ao buscar último valor do serviço: ${error.message}`,
    )
  }

  const result =
    data?.[0] as
      | SuggestedAmountRow
      | undefined

  if (
    !result ||
    result.service_amount ===
      null
  ) {
    return null
  }

  return Number(
    result.service_amount,
  )
}

export async function createAppointment(
  input: CreateAppointmentInput,
): Promise<Appointment> {
  const {
    data,
    error,
  } = await supabase
    .from(
      'appointments',
    )
    .insert({
      title:
        input.title,

      description:
        input.description,

      event_type:
        input.eventType,

      scheduled_at:
        input.scheduledAt,

      horse_id:
        input.horseId,

      professional_id:
        input.professionalId,

      service_amount:
        input.serviceAmount,
    })
    .select(
      appointmentSelect,
    )
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
  const {
    data,
    error,
  } = await supabase
    .from(
      'appointments',
    )
    .update({
      title:
        input.title,

      description:
        input.description,

      event_type:
        input.eventType,

      scheduled_at:
        input.scheduledAt,

      horse_id:
        input.horseId,

      professional_id:
        input.professionalId,

      service_amount:
        input.serviceAmount,

      status:
        input.status,
    })
    .eq(
      'id',
      appointmentId,
    )
    .select(
      appointmentSelect,
    )
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

export async function completeAppointmentWithFinance(
  appointmentId: string,
  registerPayment: boolean,
): Promise<CompleteAppointmentResult> {
  const {
    data,
    error,
  } = await supabase.rpc(
    'complete_appointment_with_finance',
    {
      p_appointment_id:
        appointmentId,

      p_register_payment:
        registerPayment,

      p_paid_at:
        new Date().toISOString(),
    },
  )

  if (error) {
    throw new Error(
      `Erro ao concluir compromisso: ${error.message}`,
    )
  }

  const result =
    data?.[0] as
      | CompleteAppointmentRow
      | undefined

  if (!result) {
    throw new Error(
      'O compromisso foi processado, mas o banco não retornou o resultado esperado.',
    )
  }

  return {
    appointmentId:
      result.completed_appointment_id,

    status:
      'completed',

    transactionId:
      result.created_transaction_id,

    paymentRegistered:
      result.payment_registered,

    alreadyRegistered:
      result.already_registered,
  }
}

export async function updateAppointmentStatus(
  appointmentId: string,
  status: AppointmentStatus,
): Promise<Appointment> {
  const {
    data,
    error,
  } = await supabase
    .from(
      'appointments',
    )
    .update({
      status,
    })
    .eq(
      'id',
      appointmentId,
    )
    .select(
      appointmentSelect,
    )
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
  const {
    error,
  } = await supabase
    .from(
      'appointments',
    )
    .delete()
    .eq(
      'id',
      appointmentId,
    )

  if (error) {
    throw new Error(
      `Erro ao excluir compromisso: ${error.message}`,
    )
  }
}