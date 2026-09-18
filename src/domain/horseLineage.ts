export type HorseLineage = {
  id: string
  fatherName: string
  motherName: string
  notes: string | null
  active: boolean
  createdAt: string
  updatedAt: string
}

export type CreateHorseLineageInput = {
  fatherName: string
  motherName: string
  notes?: string | null
}

export function formatHorseLineage(
  lineage: HorseLineage,
) {
  return `${lineage.fatherName} × ${lineage.motherName}`
}