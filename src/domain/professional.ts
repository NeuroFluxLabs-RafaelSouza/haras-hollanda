export type Professional = {
  id: string
  name: string
  specialty: string | null
  phone: string | null
  active: boolean
  createdAt: string
}

export type CreateProfessionalInput = {
  name: string
  specialty: string | null
  phone: string | null
}

export type UpdateProfessionalInput = {
  name: string
  specialty: string | null
  phone: string | null
  active: boolean
}