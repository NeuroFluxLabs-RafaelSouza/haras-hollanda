import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type SubmitEvent,
} from 'react'

import {
  ArrowLeft,
  CalendarClock,
} from 'lucide-react'

import {
  Link,
  useNavigate,
} from 'react-router-dom'

import {
  MoneyInput,
} from '../../components/ui/MoneyInput.tsx'

import {
  SearchableSelect,
  type SearchableSelectOption,
} from '../../components/ui/SearchableSelect.tsx'

import {
  APPOINTMENT_EVENT_LABELS,
  type AppointmentEventType,
} from '../../domain/appointment.ts'

import {
  getHorses,
} from '../horses/horsesService.ts'

import {
  createAppointment,
  getSuggestedServiceAmount,
} from './appointmentsService.ts'

import {
  getProfessionals,
} from './professionalsService.ts'

import './NewAppointmentPage.css'

const observationPlaceholders: Record<
  AppointmentEventType,
  string
> = {
  feeding:
    'Ex: Ajustar a quantidade de ração no período da tarde.',

  veterinary:
    'Ex: Avaliar sensibilidade na pata dianteira direita.',

  farrier:
    'Ex: Verificar casco dianteiro direito e condição das ferraduras.',

  vaccine:
    'Ex: Aplicar vacina contra influenza e registrar o atendimento.',

  training:
    'Ex: Realizar treino leve de marcha por aproximadamente 40 minutos.',

  medication:
    'Ex: Administrar medicamento conforme orientação veterinária.',

  management:
    'Ex: Realizar manejo específico deste animal.',

  other:
    'Ex: Descreva a atividade que será realizada com este cavalo.',
}

function formatCurrency(
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

function hasCompletedDateYear(
  value: string,
) {
  const match =
    /^(\d{4})-\d{2}-\d{2}$/.exec(
      value,
    )

  if (
    !match
  ) {
    return false
  }

  const year =
    Number(
      match[1],
    )

  return (
    Number.isInteger(
      year,
    ) &&
    year >= 1000
  )
}

export function NewAppointmentPage() {
  const navigate =
    useNavigate()

  const timeInputRef =
    useRef<HTMLInputElement>(
      null,
    )

  const serviceAmountManuallyEditedRef =
    useRef(false)

  const [
    horseOptions,
    setHorseOptions,
  ] = useState<
    SearchableSelectOption[]
  >([])

  const [
    professionalOptions,
    setProfessionalOptions,
  ] = useState<
    SearchableSelectOption[]
  >([])

  const [
    horseId,
    setHorseId,
  ] = useState('')

  const [
    professionalId,
    setProfessionalId,
  ] = useState('')

  const [
    eventType,
    setEventType,
  ] = useState<AppointmentEventType>(
    'management',
  )

  const [
    appointmentDate,
    setAppointmentDate,
  ] = useState('')

  const [
    appointmentTime,
    setAppointmentTime,
  ] = useState('')

  const [
    description,
    setDescription,
  ] = useState('')

  const [
    serviceAmount,
    setServiceAmount,
  ] = useState(0)

  const [
    suggestedServiceAmount,
    setSuggestedServiceAmount,
  ] = useState<
    number | null
  >(null)

  const [
    loadingSuggestedAmount,
    setLoadingSuggestedAmount,
  ] = useState(false)

  const [
    loadingOptions,
    setLoadingOptions,
  ] = useState(true)

  const [
    saving,
    setSaving,
  ] = useState(false)

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null)

  useEffect(() => {
    let isMounted =
      true

    async function loadOptions() {
      try {
        const [
          horses,
          professionals,
        ] = await Promise.all([
          getHorses(),
          getProfessionals(),
        ])

        if (
          !isMounted
        ) {
          return
        }

        setHorseOptions(
          horses
            .filter(
              (horse) =>
                horse.active,
            )
            .map(
              (horse) => ({
                value:
                  horse.id,

                label:
                  horse.name,
              }),
            ),
        )

        setProfessionalOptions(
          professionals
            .filter(
              (professional) =>
                professional.active,
            )
            .map(
              (professional) => ({
                value:
                  professional.id,

                label:
                  professional.specialty
                    ? `${professional.name} · ${professional.specialty}`
                    : professional.name,
              }),
            ),
        )
      } catch (error) {
        if (
          !isMounted
        ) {
          return
        }

        const message =
          error instanceof Error
            ? error.message
            : 'Não foi possível carregar os dados do formulário.'

        setError(
          message,
        )
      } finally {
        if (
          isMounted
        ) {
          setLoadingOptions(
            false,
          )
        }
      }
    }

    loadOptions()

    return () => {
      isMounted =
        false
    }
  }, [])

  useEffect(() => {
    let isMounted =
      true

    async function loadSuggestedAmount() {
      if (
        !professionalId
      ) {
        setSuggestedServiceAmount(
          null,
        )

        return
      }

      try {
        setLoadingSuggestedAmount(
          true,
        )

        const amount =
          await getSuggestedServiceAmount(
            professionalId,
            eventType,
          )

        if (
          !isMounted
        ) {
          return
        }

        setSuggestedServiceAmount(
          amount,
        )

        if (
          !serviceAmountManuallyEditedRef.current
        ) {
          setServiceAmount(
            amount ??
              0,
          )
        }
      } catch {
        if (
          isMounted
        ) {
          setSuggestedServiceAmount(
            null,
          )
        }
      } finally {
        if (
          isMounted
        ) {
          setLoadingSuggestedAmount(
            false,
          )
        }
      }
    }

    loadSuggestedAmount()

    return () => {
      isMounted =
        false
    }
  }, [
    professionalId,
    eventType,
  ])

  const eventTypeOptions =
    useMemo(
      () =>
        Object.entries(
          APPOINTMENT_EVENT_LABELS,
        ) as [
          AppointmentEventType,
          string,
        ][],
      [],
    )

  function handleServiceAmountChange(
    value: number,
  ) {
    serviceAmountManuallyEditedRef.current =
      true

    setServiceAmount(
      value,
    )
  }

  function handleDateChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const value =
      event.target.value

    setAppointmentDate(
      value,
    )

    if (
      hasCompletedDateYear(
        value,
      )
    ) {
      window.requestAnimationFrame(
        () => {
          timeInputRef.current?.focus()
        },
      )
    }
  }

  async function handleSubmit(
    event: SubmitEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    setError(
      null,
    )

    if (
      !horseId
    ) {
      setError(
        'Selecione o cavalo deste compromisso.',
      )

      return
    }

    if (
      !appointmentDate
    ) {
      setError(
        'Informe a data do compromisso.',
      )

      return
    }

    if (
      !appointmentTime
    ) {
      setError(
        'Informe o horário do compromisso.',
      )

      timeInputRef.current?.focus()

      return
    }

    if (
      !Number.isFinite(
        serviceAmount,
      ) ||
      serviceAmount <
        0
    ) {
      setError(
        'Informe um valor de serviço válido.',
      )

      return
    }

    const scheduledDate =
      new Date(
        `${appointmentDate}T${appointmentTime}`,
      )

    if (
      Number.isNaN(
        scheduledDate.getTime(),
      )
    ) {
      setError(
        'Informe uma data e horário válidos.',
      )

      return
    }

    const generatedTitle =
      APPOINTMENT_EVENT_LABELS[
        eventType
      ]

    setSaving(
      true,
    )

    try {
      await createAppointment({
        title:
          generatedTitle,

        description:
          description.trim() ||
          null,

        eventType,

        scheduledAt:
          scheduledDate.toISOString(),

        horseId,

        professionalId:
          professionalId ||
          null,

        serviceAmount:
          serviceAmount >
          0
            ? serviceAmount
            : null,
      })

      navigate(
        '/agenda',
      )
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível criar o compromisso.'

      setError(
        message,
      )
    } finally {
      setSaving(
        false,
      )
    }
  }

  return (
    <section className="new-appointment-page">
      <header className="new-appointment-header">
        <Link
          className="new-appointment-header__back"
          to="/agenda"
        >
          <ArrowLeft
            size={17}
          />

          Voltar à agenda
        </Link>

        <div>
          <p className="page-header__eyebrow">
            Planejamento
          </p>

          <h1 className="page-header__title">
            Novo compromisso
          </h1>

          <p className="page-header__description">
            Programe serviços, atendimentos e atividades do cavalo.
          </p>
        </div>
      </header>

      <form
        className="new-appointment-form"
        onSubmit={
          handleSubmit
        }
      >
        <div className="new-appointment-form__header">
          <div className="new-appointment-form__icon">
            <CalendarClock
              size={19}
              strokeWidth={1.8}
            />
          </div>

          <div>
            <h2>
              Dados do compromisso
            </h2>

            <p>
              Escolha o animal e organize as informações necessárias para a
              atividade.
            </p>
          </div>
        </div>

        <div className="new-appointment-form__grid">
          <div className="new-appointment-field new-appointment-field--full">
            <label htmlFor="horse">
              Cavalo
            </label>

            {loadingOptions ? (
              <div className="new-appointment-form__state">
                Carregando cavalos...
              </div>
            ) : (
              <SearchableSelect
                id="horse"
                value={
                  horseId
                }
                options={
                  horseOptions
                }
                placeholder="Pesquise o nome do cavalo..."
                emptyMessage="Nenhum cavalo encontrado."
                onChange={
                  setHorseId
                }
              />
            )}
          </div>

          <div className="new-appointment-field">
            <label htmlFor="eventType">
              Tipo de serviço
            </label>

            <select
              id="eventType"
              name="eventType"
              value={
                eventType
              }
              onChange={(
                event,
              ) =>
                setEventType(
                  event.target
                    .value as AppointmentEventType,
                )
              }
            >
              {eventTypeOptions.map(
                (
                  [
                    value,
                    label,
                  ],
                ) => (
                  <option
                    value={
                      value
                    }
                    key={
                      value
                    }
                  >
                    {label}
                  </option>
                ),
              )}
            </select>
          </div>

          <div className="new-appointment-field">
            <label htmlFor="professional">
              Técnico responsável
            </label>

            {loadingOptions ? (
              <div className="new-appointment-form__state">
                Carregando profissionais...
              </div>
            ) : (
              <SearchableSelect
                id="professional"
                value={
                  professionalId
                }
                options={
                  professionalOptions
                }
                placeholder="Pesquise o responsável..."
                emptyMessage="Nenhum profissional encontrado."
                onChange={
                  setProfessionalId
                }
              />
            )}

            {professionalOptions.length ===
              0 && (
              <span className="new-appointment-field__help">
                Nenhum profissional ativo cadastrado.
              </span>
            )}
          </div>

          <div className="new-appointment-field new-appointment-field--full">
            <label htmlFor="serviceAmount">
              Valor do serviço
            </label>

            <MoneyInput
              id="serviceAmount"
              name="serviceAmount"
              value={
                serviceAmount
              }
              onChange={
                handleServiceAmountChange
              }
            />

            <span className="new-appointment-field__help">
              {loadingSuggestedAmount
                ? 'Buscando o último valor usado para este profissional...'
                : suggestedServiceAmount !==
                    null
                  ? `Último valor usado para este profissional e serviço: ${formatCurrency(
                      suggestedServiceAmount,
                    )}. Você pode ajustar se necessário.`
                  : professionalId
                    ? 'Ainda não existe um valor anterior para este profissional e serviço. Informe o valor desta vez.'
                    : 'Selecione o profissional. O aplicativo tentará preencher o último valor usado automaticamente.'}
            </span>
          </div>

          <div className="new-appointment-datetime new-appointment-field--full">
            <div className="new-appointment-field">
              <label htmlFor="appointmentDate">
                Data
              </label>

              <input
                id="appointmentDate"
                name="appointmentDate"
                type="date"
                value={
                  appointmentDate
                }
                onChange={
                  handleDateChange
                }
                required
              />
            </div>

            <div className="new-appointment-field">
              <label htmlFor="appointmentTime">
                Horário
              </label>

              <input
                ref={
                  timeInputRef
                }
                id="appointmentTime"
                name="appointmentTime"
                type="time"
                value={
                  appointmentTime
                }
                onChange={(
                  event,
                ) =>
                  setAppointmentTime(
                    event.target.value,
                  )
                }
                required
              />
            </div>
          </div>

          <div className="new-appointment-field new-appointment-field--full">
            <label htmlFor="description">
              Observação
            </label>

            <textarea
              id="description"
              name="description"
              value={
                description
              }
              onChange={(
                event,
              ) =>
                setDescription(
                  event.target.value,
                )
              }
              placeholder={
                observationPlaceholders[
                  eventType
                ]
              }
              rows={5}
            />
          </div>
        </div>

        {error && (
          <div className="new-appointment-form__error">
            {error}
          </div>
        )}

        <div className="new-appointment-form__actions">
          <Link
            className="new-appointment-cancel"
            to="/agenda"
          >
            Cancelar
          </Link>

          <button
            className="new-appointment-submit"
            type="submit"
            disabled={
              saving ||
              loadingOptions ||
              horseOptions.length ===
                0
            }
          >
            {saving
              ? 'Agendando...'
              : 'Criar compromisso'}
          </button>
        </div>
      </form>
    </section>
  )
}