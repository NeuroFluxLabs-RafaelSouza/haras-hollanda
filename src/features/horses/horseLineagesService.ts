import type {
  CreateHorseLineageInput,
  HorseLineage,
} from '../../domain/horseLineage.ts'

import {
  supabase,
} from '../../lib/supabase.ts'

type HorseLineageRow = {
  id: string
  father_name: string
  mother_name: string
  notes: string | null
  active: boolean
  created_at: string
  updated_at: string
}

const horseLineageSelect = `
  id,
  father_name,
  mother_name,
  notes,
  active,
  created_at,
  updated_at
`

function normalizeName(
  value: string,
) {
  return value
    .trim()
    .replace(
      /\s+/g,
      ' ',
    )
}

function normalizeForComparison(
  value: string,
) {
  return normalizeName(
    value,
  )
    .normalize(
      'NFD',
    )
    .replace(
      /[\u0300-\u036f]/g,
      '',
    )
    .toLowerCase()
}

function mapHorseLineage(
  row: HorseLineageRow,
): HorseLineage {
  return {
    id:
      row.id,

    fatherName:
      row.father_name,

    motherName:
      row.mother_name,

    notes:
      row.notes,

    active:
      row.active,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,
  }
}

export async function getHorseLineages(): Promise<
  HorseLineage[]
> {
  const {
    data,
    error,
  } = await supabase
    .from(
      'horse_lineages',
    )
    .select(
      horseLineageSelect,
    )
    .eq(
      'active',
      true,
    )
    .order(
      'father_name',
      {
        ascending:
          true,
      },
    )
    .order(
      'mother_name',
      {
        ascending:
          true,
      },
    )

  if (error) {
    throw new Error(
      `Erro ao carregar linhagens: ${error.message}`,
    )
  }

  return (
    data ??
    []
  ).map(
    (row) =>
      mapHorseLineage(
        row as HorseLineageRow,
      ),
  )
}

export async function createHorseLineage(
  input: CreateHorseLineageInput,
): Promise<HorseLineage> {
  const fatherName =
    normalizeName(
      input.fatherName,
    )

  const motherName =
    normalizeName(
      input.motherName,
    )

  if (!fatherName) {
    throw new Error(
      'Informe o pai.',
    )
  }

  if (!motherName) {
    throw new Error(
      'Informe a mãe.',
    )
  }

  if (
    normalizeForComparison(
      fatherName,
    ) ===
    normalizeForComparison(
      motherName,
    )
  ) {
    throw new Error(
      'Pai e mãe precisam ser animais diferentes.',
    )
  }

  const {
    data,
    error,
  } = await supabase
    .from(
      'horse_lineages',
    )
    .insert({
      father_name:
        fatherName,

      mother_name:
        motherName,

      notes:
        input.notes
          ?.trim() ||
        null,

      active:
        true,
    })
    .select(
      horseLineageSelect,
    )
    .single()

  if (!error) {
    return mapHorseLineage(
      data as HorseLineageRow,
    )
  }

  if (
    error.code ===
    '23505'
  ) {
    const lineages =
      await getHorseLineages()

    const existing =
      lineages.find(
        (lineage) =>
          normalizeForComparison(
            lineage.fatherName,
          ) ===
            normalizeForComparison(
              fatherName,
            ) &&
          normalizeForComparison(
            lineage.motherName,
          ) ===
            normalizeForComparison(
              motherName,
            ),
      )

    if (existing) {
      return existing
    }
  }

  throw new Error(
    `Erro ao cadastrar linhagem: ${error.message}`,
  )
}