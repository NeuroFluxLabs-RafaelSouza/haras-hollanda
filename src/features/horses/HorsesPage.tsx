import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
} from 'react'

import {
  ArrowLeftRight,
  CalendarDays,
  Camera,
  CircleDollarSign,
  DoorOpen,
  ImageIcon,
  Plus,
  Search,
  UserRound,
  Utensils,
} from 'lucide-react'

import {
  Link,
  useSearchParams,
} from 'react-router-dom'

import {
  ImageCropper,
} from '../../components/ui/ImageCropper.tsx'

import {
  getHorseLifeStageLabel,
} from '../../domain/horseLifeStage.ts'

import {
  HorseCommercialPage,
} from './HorseCommercialPage.tsx'

import type {
  HorseListItem,
} from './horsesService.ts'

import {
  getHorsePhotoUrl,
  getHorses,
  uploadHorsePhoto,
} from './horsesService.ts'

import './HorsesPage.css'

type PendingHorsePhoto = {
  horseId: string
  horseName: string
  currentPhotoPath: string | null
  file: File
}

const ALLOWED_SOURCE_IMAGE_TYPES =
  new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
  ])

function normalizeText(
  value: string,
) {
  return value
    .normalize(
      'NFD',
    )
    .replace(
      /[\u0300-\u036f]/g,
      '',
    )
    .toLowerCase()
    .trim()
}

function formatMonthlyFee(
  value: number,
) {
  return new Intl.NumberFormat(
    'pt-BR',
    {
      style:
        'currency',

      currency:
        'BRL',
    },
  ).format(
    value,
  )
}

function formatHorseAge(
  birthDate: string | null,
) {
  if (!birthDate) {
    return 'Não informada'
  }

  const [
    yearText,
    monthText,
    dayText,
  ] =
    birthDate.split(
      '-',
    )

  const birthYear =
    Number(
      yearText,
    )

  const birthMonth =
    Number(
      monthText,
    )

  const birthDay =
    Number(
      dayText,
    )

  if (
    !Number.isFinite(
      birthYear,
    ) ||
    !Number.isFinite(
      birthMonth,
    ) ||
    !Number.isFinite(
      birthDay,
    )
  ) {
    return 'Não informada'
  }

  const today =
    new Date()

  let years =
    today.getFullYear() -
    birthYear

  let months =
    today.getMonth() +
    1 -
    birthMonth

  if (
    today.getDate() <
    birthDay
  ) {
    months -=
      1
  }

  if (
    months <
    0
  ) {
    years -=
      1

    months +=
      12
  }

  if (
    years <
    0
  ) {
    return 'Não informada'
  }

  const yearLabel =
    years ===
    1
      ? '1 ano'
      : `${years} anos`

  const monthLabel =
    months ===
    1
      ? '1 mês'
      : `${months} meses`

  if (
    years ===
      0 &&
    months ===
      0
  ) {
    return 'Menos de 1 mês'
  }

  if (
    years ===
    0
  ) {
    return monthLabel
  }

  if (
    months ===
    0
  ) {
    return yearLabel
  }

  return `${yearLabel} e ${monthLabel}`
}

function formatLineage(
  horse: HorseListItem,
) {
  if (
    horse.lineageText?.trim()
  ) {
    return horse.lineageText
  }

  if (
    horse.lineageFatherName &&
    horse.lineageMotherName
  ) {
    return `${horse.lineageFatherName} × ${horse.lineageMotherName}`
  }

  return 'Não informada'
}

export function HorsesPage() {
  const [
    searchParams,
  ] = useSearchParams()

  const area =
    searchParams.get(
      'area',
    )

  if (
    area ===
    'comercial'
  ) {
    return (
      <HorseCommercialPage />
    )
  }

  return (
    <HorsesListPage />
  )
}

function HorsesListPage() {
  const [
    horses,
    setHorses,
  ] = useState<
    HorseListItem[]
  >([])

  const [
    photoUrls,
    setPhotoUrls,
  ] = useState<
    Record<string, string>
  >({})

  const [
    pendingHorsePhoto,
    setPendingHorsePhoto,
  ] = useState<
    PendingHorsePhoto | null
  >(null)

  const [
    uploadingPhotoId,
    setUploadingPhotoId,
  ] = useState<
    string | null
  >(null)

  const [
    search,
    setSearch,
  ] = useState('')

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    )

  const [
    photoError,
    setPhotoError,
  ] =
    useState<string | null>(
      null,
    )

  const [
    successMessage,
    setSuccessMessage,
  ] =
    useState<string | null>(
      null,
    )

  useEffect(() => {
    let isMounted =
      true

    async function loadHorses() {
      try {
        const data =
          await getHorses()

        const nextPhotoUrls:
          Record<string, string> =
          {}

        await Promise.all(
          data.map(
            async (
              horse,
            ) => {
              if (
                !horse.photoPath
              ) {
                return
              }

              try {
                const photoUrl =
                  await getHorsePhotoUrl(
                    horse.photoPath,
                  )

                if (
                  photoUrl
                ) {
                  nextPhotoUrls[
                    horse.id
                  ] =
                    photoUrl
                }
              } catch {
                return
              }
            },
          ),
        )

        if (
          isMounted
        ) {
          setHorses(
            data,
          )

          setPhotoUrls(
            nextPhotoUrls,
          )
        }
      } catch (error) {
        if (
          !isMounted
        ) {
          return
        }

        const message =
          error instanceof Error
            ? error.message
            : 'Não foi possível carregar os cavalos.'

        setError(
          message,
        )
      } finally {
        if (
          isMounted
        ) {
          setLoading(
            false,
          )
        }
      }
    }

    void loadHorses()

    return () => {
      isMounted =
        false
    }
  }, [])

  const filteredHorses =
    useMemo(
      () => {
        const normalizedSearch =
          normalizeText(
            search,
          )

        if (
          !normalizedSearch
        ) {
          return horses
        }

        return horses.filter(
          (horse) => {
            const lineage =
              formatLineage(
                horse,
              )

            const stage =
              getHorseLifeStageLabel(
                horse.sex,
                horse.birthDate,
              )

            return [
              horse.name,
              horse.breed ??
                '',
              horse.ownerName,
              horse.stallName ??
                '',
              lineage,
              stage,
            ].some(
              (value) =>
                normalizeText(
                  value,
                ).includes(
                  normalizedSearch,
                ),
            )
          },
        )
      },
      [
        horses,
        search,
      ],
    )

  const horseCountLabel =
    horses.length ===
    1
      ? '1 cavalo cadastrado'
      : `${horses.length} cavalos cadastrados`

  function handlePhotoSelection(
    horse: HorseListItem,
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file =
      event.target.files?.[0] ??
      null

    event.target.value =
      ''

    if (!file) {
      return
    }

    setPhotoError(
      null,
    )

    setSuccessMessage(
      null,
    )

    if (
      !ALLOWED_SOURCE_IMAGE_TYPES.has(
        file.type,
      )
    ) {
      setPhotoError(
        'Use uma imagem JPG, PNG ou WebP.',
      )

      return
    }

    setPendingHorsePhoto({
      horseId:
        horse.id,

      horseName:
        horse.name,

      currentPhotoPath:
        horse.photoPath,

      file,
    })
  }

  async function handleAdjustedPhoto(
    file: File,
  ) {
    if (
      !pendingHorsePhoto
    ) {
      return
    }

    const {
      horseId,
      horseName,
      currentPhotoPath,
    } =
      pendingHorsePhoto

    setUploadingPhotoId(
      horseId,
    )

    setPhotoError(
      null,
    )

    setSuccessMessage(
      null,
    )

    try {
      const result =
        await uploadHorsePhoto(
          horseId,
          currentPhotoPath,
          file,
        )

      setHorses(
        (
          currentHorses,
        ) =>
          currentHorses.map(
            (horse) =>
              horse.id ===
              horseId
                ? {
                    ...horse,

                    photoPath:
                      result.photoPath,
                  }
                : horse,
          ),
      )

      setPhotoUrls(
        (
          currentPhotoUrls,
        ) => ({
          ...currentPhotoUrls,

          [horseId]:
            result.photoUrl,
        }),
      )

      setPendingHorsePhoto(
        null,
      )

      setSuccessMessage(
        `Foto de ${horseName} atualizada com sucesso.`,
      )
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível salvar a foto do cavalo.'

      setPhotoError(
        message,
      )
    } finally {
      setUploadingPhotoId(
        null,
      )
    }
  }

  return (
    <section className="horses-page">
      <header className="page-header">
        <p className="page-header__eyebrow">
          Gestão dos animais
        </p>

        <h1 className="page-header__title">
          Cavalos
        </h1>

        <p className="page-header__description">
          Consulte os animais e as informações essenciais da rotina do haras.
        </p>
      </header>

      <div className="horses-toolbar">
        <span className="horses-toolbar__count">
          {horseCountLabel}
        </span>

        <div className="horses-toolbar__actions">
          <div className="horses-search">
            <Search
              size={16}
              strokeWidth={
                1.8
              }
            />

            <input
              type="search"
              value={
                search
              }
              onChange={(
                event,
              ) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Buscar cavalo..."
              aria-label="Buscar cavalo"
            />
          </div>

          <Link
            className="horses-feeding-today-button"
            to="/cavalos/alimentacao-hoje"
          >
            <Utensils
              size={17}
              strokeWidth={
                1.8
              }
            />

            Alimentação de hoje
          </Link>

          <Link
            className="horses-commercial-button"
            to="/cavalos?area=comercial"
          >
            <ArrowLeftRight
              size={17}
              strokeWidth={
                1.8
              }
            />

            Comercial
          </Link>

          <Link
            className="horses-add-button"
            to="/cavalos/novo"
          >
            <Plus
              size={17}
            />

            Novo cavalo
          </Link>
        </div>
      </div>

      {photoError && (
        <div className="horses-message horses-message--error">
          {photoError}
        </div>
      )}

      {successMessage && (
        <div className="horses-message horses-message--success">
          {successMessage}
        </div>
      )}

      {loading && (
        <div className="horses-state">
          Carregando cavalos...
        </div>
      )}

      {error && (
        <div className="horses-state horses-state--error">
          {error}
        </div>
      )}

      {!loading &&
        !error &&
        horses.length ===
          0 && (
          <div className="horses-empty">
            <strong>
              Nenhum cavalo cadastrado
            </strong>

            <span>
              Cadastre o primeiro animal para começar a organizar o haras.
            </span>

            <Link
              className="horses-add-button"
              to="/cavalos/novo"
            >
              <Plus
                size={17}
              />

              Novo cavalo
            </Link>
          </div>
        )}

      {!loading &&
        !error &&
        horses.length >
          0 &&
        filteredHorses.length ===
          0 && (
          <div className="horses-state">
            Nenhum cavalo encontrado para “{search}”.
          </div>
        )}

      {!loading &&
        !error &&
        filteredHorses.length >
          0 && (
          <div className="horses-grid">
            {filteredHorses.map(
              (horse) => {
                const photoUrl =
                  photoUrls[
                    horse.id
                  ]

                const uploadingPhoto =
                  uploadingPhotoId ===
                  horse.id

                const stageLabel =
                  getHorseLifeStageLabel(
                    horse.sex,
                    horse.birthDate,
                  )

                const ageLabel =
                  formatHorseAge(
                    horse.birthDate,
                  )

                const lineageLabel =
                  formatLineage(
                    horse,
                  )

                const showMonthlyFee =
                  horse.ownershipType ===
                    'client' &&
                  horse.monthlyFee !==
                    null

                const commercialMode =
                  horse.ownershipType ===
                  'haras'
                    ? 'sale'
                    : 'purchase'

                return (
                  <article
                    className="horse-card"
                    key={
                      horse.id
                    }
                  >
                    <div className="horse-card__profile">
                      <div className="horse-card__photo-column">
                        <div className="horse-card__photo">
                          {photoUrl ? (
                            <img
                              src={
                                photoUrl
                              }
                              alt={`Foto de ${horse.name}`}
                            />
                          ) : (
                            <div className="horse-card__photo-placeholder">
                              <ImageIcon
                                size={28}
                                strokeWidth={
                                  1.6
                                }
                              />

                              <span>
                                Sem foto
                              </span>
                            </div>
                          )}
                        </div>

                        <label
                          className={`horse-card__photo-button ${
                            uploadingPhoto
                              ? 'horse-card__photo-button--disabled'
                              : ''
                          }`}
                        >
                          <Camera
                            size={14}
                            strokeWidth={
                              1.8
                            }
                          />

                          {uploadingPhoto
                            ? 'Salvando...'
                            : photoUrl
                              ? 'Trocar foto'
                              : 'Adicionar foto'}

                          <input
                            className="horse-card__photo-input"
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            disabled={
                              uploadingPhoto
                            }
                            onChange={(
                              event,
                            ) =>
                              handlePhotoSelection(
                                horse,
                                event,
                              )
                            }
                          />
                        </label>
                      </div>

                      <div className="horse-card__identity">
                        <div className="horse-card__header">
                          <div>
                            <h2 className="horse-card__name">
                              {horse.name}
                            </h2>

                            <span className="horse-card__breed">
                              {horse.breed ??
                                'Raça não informada'}
                            </span>
                          </div>

                          {!horse.active && (
                            <span className="horse-card__status horse-card__status--inactive">
                              Inativo
                            </span>
                          )}
                        </div>

                        <div className="horse-card__stage">
                          {stageLabel}
                        </div>

                        <div className="horse-card__lineage">
                          <span>
                            Linhagem
                          </span>

                          <strong>
                            {lineageLabel}
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div className="horse-card__details">
                      <div className="horse-card__detail">
                        <div className="horse-card__detail-icon">
                          <UserRound
                            size={17}
                            strokeWidth={
                              1.7
                            }
                          />
                        </div>

                        <div>
                          <span>
                            Proprietário
                          </span>

                          <strong>
                            {horse.ownerName}
                          </strong>
                        </div>
                      </div>

                      <div className="horse-card__detail">
                        <div className="horse-card__detail-icon">
                          <CalendarDays
                            size={17}
                            strokeWidth={
                              1.7
                            }
                          />
                        </div>

                        <div>
                          <span>
                            Idade
                          </span>

                          <strong>
                            {ageLabel}
                          </strong>
                        </div>
                      </div>

                      <div className="horse-card__detail">
                        <div className="horse-card__detail-icon">
                          <DoorOpen
                            size={17}
                            strokeWidth={
                              1.7
                            }
                          />
                        </div>

                        <div>
                          <span>
                            Baia
                          </span>

                          <strong>
                            {horse.stallName ??
                              'Sem baia'}
                          </strong>
                        </div>
                      </div>

                      {showMonthlyFee && (
                        <div className="horse-card__detail">
                          <div className="horse-card__detail-icon">
                            <CircleDollarSign
                              size={17}
                              strokeWidth={
                                1.7
                              }
                            />
                          </div>

                          <div>
                            <span>
                              Mensalidade
                            </span>

                            <strong>
                              {formatMonthlyFee(
                                horse.monthlyFee as number,
                              )}
                            </strong>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="horse-card__actions">
                      <Link
                        className="horse-card__action"
                        to={`/cavalos/${horse.id}/alimentacao`}
                      >
                        <Utensils
                          size={15}
                          strokeWidth={
                            1.8
                          }
                        />

                        Plano alimentar
                      </Link>

                      <Link
                        className="horse-card__action horse-card__action--commercial"
                        to={`/cavalos?area=comercial&mode=${commercialMode}&horse=${horse.id}`}
                      >
                        <ArrowLeftRight
                          size={15}
                          strokeWidth={
                            1.8
                          }
                        />

                        Comercial
                      </Link>
                    </div>
                  </article>
                )
              },
            )}
          </div>
        )}

      {pendingHorsePhoto && (
        <ImageCropper
          file={
            pendingHorsePhoto.file
          }
          title={`Foto de ${pendingHorsePhoto.horseName}`}
          description="Ajuste o enquadramento dentro do quadrado antes de salvar."
          cropShape="square"
          confirmLabel="Salvar foto"
          onCancel={() =>
            setPendingHorsePhoto(
              null,
            )
          }
          onConfirm={
            handleAdjustedPhoto
          }
        />
      )}
    </section>
  )
}