export type Client = {
  id: string
  name: string
  phone: string | null
  email: string | null
  active: boolean
  createdAt: string
}

export type CreateClientInput = {
  name: string
  phone: string | null
  email: string | null
}