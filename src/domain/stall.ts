export type StallStatus =
  | 'operational'
  | 'maintenance'
  | 'inactive'

export type Stall = {
  id: string
  name: string
  status: StallStatus
  notes: string | null
  maintenanceUntil: string | null
  createdAt: string
}

export type CreateStallInput = {
  name: string
}

export type UpdateStallOperationalInput = {
  status: StallStatus
  notes: string | null
  maintenanceUntil: string | null
}

export type StallMaintenanceAlert = {
  stallId: string
  stallName: string
  message: string
  detail: string
  urgency: 'warning' | 'danger'
}

function getDateWithoutTime(date: Date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  )
}

export function createStallMaintenanceAlert(
  stall: Stall,
  today = new Date(),
): StallMaintenanceAlert | null {
  if (
    stall.status !== 'maintenance' ||
    !stall.maintenanceUntil
  ) {
    return null
  }

  const currentDate = getDateWithoutTime(today)

  const maintenanceDate = getDateWithoutTime(
    new Date(`${stall.maintenanceUntil}T00:00:00`),
  )

  const millisecondsPerDay = 1000 * 60 * 60 * 24

  const daysRemaining = Math.round(
    (maintenanceDate.getTime() - currentDate.getTime()) /
      millisecondsPerDay,
  )

  if (daysRemaining > 3) {
    return null
  }

  if (daysRemaining < 0) {
    return {
      stallId: stall.id,
      stallName: stall.name,
      message: `${stall.name} — manutenção atrasada`,
      detail: stall.notes ?? 'A previsão de liberação já passou.',
      urgency: 'danger',
    }
  }

  if (daysRemaining === 0) {
    return {
      stallId: stall.id,
      stallName: stall.name,
      message: `${stall.name} — liberação prevista hoje`,
      detail: stall.notes ?? 'Manutenção em andamento.',
      urgency: 'warning',
    }
  }

  return {
    stallId: stall.id,
    stallName: stall.name,
    message: `${stall.name} — manutenção termina em ${daysRemaining} ${
      daysRemaining === 1 ? 'dia' : 'dias'
    }`,
    detail: stall.notes ?? 'Manutenção em andamento.',
    urgency: 'warning',
  }
}