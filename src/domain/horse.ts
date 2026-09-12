export type HorseSex =
  | 'male'
  | 'female'

export type Horse = {
  id: string
  name: string
  breed: string | null
  sex: HorseSex
  clientId: string
  stallId: string | null
  monthlyFee: number | null
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
  clientId: string
  stallId: string | null
  monthlyFee: number | null
  active: boolean
}