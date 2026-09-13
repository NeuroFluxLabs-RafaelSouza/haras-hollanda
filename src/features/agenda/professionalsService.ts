import type {
  CreateProfessionalInput,
  Professional,
  UpdateProfessionalInput,
} from '../../domain/professional.ts'

import { supabase } from '../../lib/supabase.ts'

type ProfessionalRow = {
  id: string
  name: string
  specialty: string | null
  phone: string | null
  active: boolean
  created_at: string
}

const professionalSelect = `
  id,
  name,
  specialty,
  phone,
  active,
  created_at
`

function mapProfessional(
  row: ProfessionalRow,
): Professional {
  return {
    id: row.id,
    name: row.name,
    specialty: row.specialty,
    phone: row.phone,
    active: row.active,
    createdAt: row.created_at,
  }
}

export async function getProfessionals(): Promise<
  Professional[]
> {
  const { data, error } = await supabase
    .from('professionals')
    .select(professionalSelect)
    .order('name', {
      ascending: true,
    })

  if (error) {
    throw new Error(
      `Erro ao buscar profissionais: ${error.message}`,
    )
  }

  return (data ?? []).map(
    (professional) =>
      mapProfessional(
        professional as ProfessionalRow,
      ),
  )
}

export async function getProfessionalById(
  professionalId: string,
): Promise<Professional> {
  const { data, error } = await supabase
    .from('professionals')
    .select(professionalSelect)
    .eq('id', professionalId)
    .single()

  if (error) {
    throw new Error(
      `Erro ao buscar profissional: ${error.message}`,
    )
  }

  return mapProfessional(
    data as ProfessionalRow,
  )
}

export async function createProfessional(
  input: CreateProfessionalInput,
): Promise<Professional> {
  const { data, error } = await supabase
    .from('professionals')
    .insert({
      name: input.name,
      specialty: input.specialty,
      phone: input.phone,
    })
    .select(professionalSelect)
    .single()

  if (error) {
    throw new Error(
      `Erro ao cadastrar profissional: ${error.message}`,
    )
  }

  return mapProfessional(
    data as ProfessionalRow,
  )
}

export async function updateProfessional(
  professionalId: string,
  input: UpdateProfessionalInput,
): Promise<Professional> {
  const { data, error } = await supabase
    .from('professionals')
    .update({
      name: input.name,
      specialty: input.specialty,
      phone: input.phone,
      active: input.active,
    })
    .eq('id', professionalId)
    .select(professionalSelect)
    .single()

  if (error) {
    throw new Error(
      `Erro ao atualizar profissional: ${error.message}`,
    )
  }

  return mapProfessional(
    data as ProfessionalRow,
  )
}