import {
  useEffect,
  useMemo,
  useState,
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

export function NewAppointmentPage() {
  const navigate = useNavigate()

  const [
    horseOptions,
    setHorseOptions,
  ] = useState<SearchableSelectOption[]>([])

  const [
    professionalOptions,
    setProfessionalOptions,
  ] = useState<SearchableSelectOption[]>([])

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
    scheduledAt,
    setScheduledAt,
  ] = useState('')

  const [
    description,
    setDescription,
  ] = useState('')

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
  ] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadOptions() {
      try {
        const [
          horses,
          professionals,
        ] = await Promise.all([
          getHorses(),
          getProfessionals(),
        ])

        if (!isMounted) {
          return
        }

        setHorseOptions(
          horses
            .filter(
              (horse) => horse.active,
            )
            .map(
              (horse) => ({
                value: horse.id,
                label: horse.name,
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
                value: professional.id,

                label:
                  professional.specialty
                    ? `${professional.name} · ${professional.specialty}`
                    : professional.name,
              }),
            ),
        )
      } catch (error) {
        if (!isMounted) {
          return
        }

        const message =
          error instanceof Error
            ? error.message
            : 'Não foi possível carregar os dados do formulário.'

        setError(message)
      } finally {
        if (isMounted) {
          setLoadingOptions(false)
        }
      }
    }

    loadOptions()

    return () => {
      isMounted = false
    }
  }, [])

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

  async function handleSubmit(
    event: SubmitEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    setError(null)

    if (!horseId) {
      setError(
        'Selecione o cavalo deste compromisso.',
      )

      return
    }

    if (!scheduledAt) {
      setError(
        'Informe a data e o horário do compromisso.',
      )

      return
    }

    const scheduledDate =
      new Date(scheduledAt)

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

    setSaving(true)

    try {
      await createAppointment({
        title: generatedTitle,

        description:
          description.trim() || null,

        eventType,

        scheduledAt:
          scheduledDate.toISOString(),

        horseId,

        professionalId:
          professionalId || null,
      })

      navigate('/agenda')
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível criar o compromisso.'

      setError(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="new-appointment-page">
      <header className="new-appointment-header">
        <Link
          className="new-appointment-header__back"
          to="/agenda"
        >
          <ArrowLeft size={17} />
          Agenda
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
        onSubmit={handleSubmit}
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
                value={horseId}
                options={horseOptions}
                placeholder="Pesquise o nome do cavalo..."
                emptyMessage="Nenhum cavalo encontrado."
                onChange={setHorseId}
              />
            )}
          </div>

          <div className="new-appointment-field new-appointment-field--full">
            <label htmlFor="eventType">
              Tipo de serviço
            </label>

            <select
              id="eventType"
              name="eventType"
              value={eventType}
              onChange={(event) =>
                setEventType(
                  event.target
                    .value as AppointmentEventType,
                )
              }
            >
              {eventTypeOptions.map(
                ([value, label]) => (
                  <option
                    value={value}
                    key={value}
                  >
                    {label}
                  </option>
                ),
              )}
            </select>
          </div>

          <div className="new-appointment-field new-appointment-field--full">
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
                value={professionalId}
                options={professionalOptions}
                placeholder="Pesquise o responsável..."
                emptyMessage="Nenhum profissional encontrado."
                onChange={setProfessionalId}
              />
            )}

            {professionalOptions.length === 0 && (
              <span className="new-appointment-field__help">
                Nenhum profissional ativo cadastrado.
              </span>
            )}
          </div>

          <div className="new-appointment-field new-appointment-field--full">
            <label htmlFor="scheduledAt">
              Data e horário
            </label>

            <input
              id="scheduledAt"
              name="scheduledAt"
              type="datetime-local"
              value={scheduledAt}
              onChange={(event) =>
                setScheduledAt(
                  event.target.value,
                )
              }
              required
            />
          </div>

          <div className="new-appointment-field new-appointment-field--full">
            <label htmlFor="description">
              Observação
            </label>

            <textarea
              id="description"
              name="description"
              value={description}
              onChange={(event) =>
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
              horseOptions.length === 0
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