import type {
  HorseSex,
} from './horse.ts'

export type HorseLifeStage =
  | 'foal'
  | 'adult'

function parseBirthDate(
  birthDate: string,
) {
  const [
    yearText,
    monthText,
    dayText,
  ] =
    birthDate.split(
      '-',
    )

  const year =
    Number(
      yearText,
    )

  const month =
    Number(
      monthText,
    )

  const day =
    Number(
      dayText,
    )

  if (
    !Number.isFinite(
      year,
    ) ||
    !Number.isFinite(
      month,
    ) ||
    !Number.isFinite(
      day,
    )
  ) {
    return null
  }

  return {
    year,
    month,
    day,
  }
}

export function getHorseCompletedYears(
  birthDate: string | null,
  referenceDate = new Date(),
): number | null {
  if (!birthDate) {
    return null
  }

  const parsed =
    parseBirthDate(
      birthDate,
    )

  if (!parsed) {
    return null
  }

  let age =
    referenceDate.getFullYear() -
    parsed.year

  const currentMonth =
    referenceDate.getMonth() +
    1

  const hasNotHadBirthdayYet =
    currentMonth <
      parsed.month ||
    (
      currentMonth ===
        parsed.month &&
      referenceDate.getDate() <
        parsed.day
    )

  if (
    hasNotHadBirthdayYet
  ) {
    age -=
      1
  }

  if (
    age <
    0
  ) {
    return null
  }

  return age
}

export function getHorseLifeStage(
  birthDate: string | null,
): HorseLifeStage | null {
  const age =
    getHorseCompletedYears(
      birthDate,
    )

  if (
    age ===
    null
  ) {
    return null
  }

  return age <=
    3
    ? 'foal'
    : 'adult'
}

export function getHorseLifeStageLabel(
  sex: HorseSex,
  birthDate: string | null,
) {
  const stage =
    getHorseLifeStage(
      birthDate,
    )

  if (
    stage ===
    null
  ) {
    return sex ===
      'male'
      ? 'Macho'
      : 'Fêmea'
  }

  if (
    stage ===
    'foal'
  ) {
    return sex ===
      'male'
      ? 'Potro'
      : 'Potra'
  }

  return sex ===
    'male'
    ? 'Cavalo'
    : 'Égua'
}