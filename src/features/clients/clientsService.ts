import type {
  Client,
  CreateClientInput,
} from '../../domain/client'

import { supabase } from '../../lib/supabase'

type ClientRow = {
  id: string
  name: string
  phone: string | null
  email: string | null
  active: boolean
  created_at: string
}

function mapClient(row: ClientRow): Client {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    active: row.active,
    createdAt: row.created_at,
  }
}

export async function getClients(): Promise<Client[]> {
  const { data, error } = await supabase
    .from('clients')
    .select('id, name, phone, email, active, created_at')
    .order('name', { ascending: true })

  if (error) {
    throw new Error(`Erro ao buscar clientes: ${error.message}`)
  }

  return (data ?? []).map((client) =>
    mapClient(client as ClientRow),
  )
}

export async function createClient(
  input: CreateClientInput,
): Promise<Client> {
  const { data, error } = await supabase
    .from('clients')
    .insert({
      name: input.name,
      phone: input.phone,
      email: input.email,
    })
    .select('id, name, phone, email, active, created_at')
    .single()

  if (error) {
    throw new Error(`Erro ao cadastrar cliente: ${error.message}`)
  }

  return mapClient(data as ClientRow)
}