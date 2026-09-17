export type HorseSex =
  | 'male'
  | 'female'

export type HorseOwnershipType =
  | 'client'
  | 'haras'

export type Horse = {
  id: string
  name: string
  breed: string | null
  sex: HorseSex
  birthDate: string | null
  ownershipType: HorseOwnershipType
  clientId: string | null
  stallId: string | null
  monthlyFee: number | null
  photoPath: string | null
  active: boolean
  createdAt: string
}

export type CreateHorseInput = {
  name: string
  breed: string | null
  sex: HorseSex
  clientId: string
  stallId: string | null
  monthlyFee: number | null
}

export type UpdateHorseInput = {
  name: string
  breed: string | null
  sex: HorseSex
  clientId: string | null
  stallId: string | null
  monthlyFee: number | null
  active: boolean
  birthDate?: string | null
  ownershipType?: HorseOwnershipType
}