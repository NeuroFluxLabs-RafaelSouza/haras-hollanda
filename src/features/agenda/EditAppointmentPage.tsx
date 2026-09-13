import {
  useEffect,
  useMemo,
  useState,
  type SubmitEvent,
} from 'react'

import {
  ArrowLeft,
  CalendarClock,
  Trash2,
  XCircle,
} from 'lucide-react'

import {
  Link,
  useNavigate,
  useParams,
} from 'react-router-dom'

import {
  SearchableSelect,
  type SearchableSelectOption,
} from '../../components/ui/SearchableSelect.tsx'

import {
  APPOINTMENT_EVENT_LABELS,
  type Appointment,
  type AppointmentEventType,
} from '../../domain/appointment.ts'

import {
  getHorses,
} from '../horses/horsesService.ts'

import {
  deleteAppointment,
  getAppointmentById,
  updateAppointment,
  updateAppointmentStatus,
} from './appointmentsService.ts'

import {
  getProfessionals,
} from './professionalsService.ts'

import './EditAppointmentPage.css'

function toDateTimeLocalValue(
  isoDate: string,
) {
  const date = new Date(isoDate)

  const year =
    date.getFullYear()

  const month = String(
    date.getMonth() + 1,
  ).padStart(2, '0')

  const day = String(
    date.getDate(),
  ).padStart(2, '0')

  const hours = String(
    date.getHours(),
  ).padStart(2, '0')

  const minutes = String(
    date.getMinutes(),
  ).padStart(2, '0')

  return `${year}-${month}-${day}T${hours}:${minutes}`
}

export function EditAppointmentPage() {
  const navigate = useNavigate()

  const {
    appointmentId,
  } = useParams()

  const [
    appointment,
    setAppointment,
  ] = useState<Appointment | null>(
    null,
  )

  const [
    horseOptions,
    setHorseOptions,
  ] = useState<SearchableSelectOption[]>(
    [],
  )

  const [
    professionalOptions,
    setProfessionalOptions,
  ] = useState<SearchableSelectOption[]>(
    [],
  )

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
    loading,
    setLoading,
  ] = useState(true)

  const [
    saving,
    setSaving,
  ] = useState(false)

  const [
    deleting,
    setDeleting,
  ] = useState(false)

  const [
    cancelling,
    setCancelling,
  ] = useState(false)

  const [
    error,
    setError,
  ] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadData() {
      if (!appointmentId) {
        setError(
          'Compromisso não identificado.',
        )

        setLoading(false)

        return
      }

      try {
        const [
          appointmentData,
          horses,
          professionals,
        ] = await Promise.all([
          getAppointmentById(
            appointmentId,
          ),

          getHorses(),

          getProfessionals(),
        ])

        if (!isMounted) {
          return
        }

        setAppointment(
          appointmentData,
        )

        setHorseId(
          appointmentData.horseId ?? '',
        )

        setProfessionalId(
          appointmentData.professionalId ??
            '',
        )

        setEventType(
          appointmentData.eventType,
        )

        setScheduledAt(
          toDateTimeLocalValue(
            appointmentData.scheduledAt,
          ),
        )

        setDescription(
          appointmentData.description ??
            '',
        )

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
                professional.active ||
                professional.id ===
                  appointmentData.professionalId,
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
        if (!isMounted) {
          return
        }

        const message =
          error instanceof Error
            ? error.message
            : 'Não foi possível carregar o compromisso.'

        setError(message)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadData()

    return () => {
      isMounted = false
    }
  }, [appointmentId])

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

    if (
      !appointmentId ||
      !appointment
    ) {
      return
    }

    setError(null)

    if (!horseId) {
      setError(
        'Selecione o cavalo deste compromisso.',
      )

      return
    }

    if (!scheduledAt) {
      setError(
        'Informe a data e o horário.',
      )

      return
    }

    const scheduledDate =
      new Date(scheduledAt)

    setSaving(true)

    try {
      await updateAppointment(
        appointmentId,
        {
          title:
            APPOINTMENT_EVENT_LABELS[
              eventType
            ],

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

          status:
            appointment.status,
        },
      )

      navigate('/agenda')
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível atualizar o compromisso.'

      setError(message)
    } finally {
      setSaving(false)
    }
  }

  async function handleCancelAppointment() {
    if (!appointmentId) {
      return
    }

    const confirmed =
      window.confirm(
        'Deseja cancelar este compromisso? Ele continuará no histórico da Agenda.',
      )

    if (!confirmed) {
      return
    }

    setCancelling(true)
    setError(null)

    try {
      await updateAppointmentStatus(
        appointmentId,
        'cancelled',
      )

      navigate('/agenda')
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível cancelar o compromisso.'

      setError(message)
    } finally {
      setCancelling(false)
    }
  }

  async function handleDelete() {
    if (!appointmentId) {
      return
    }

    const confirmed =
      window.confirm(
        'Excluir definitivamente este compromisso? Esta ação não poderá ser desfeita.',
      )

    if (!confirmed) {
      return
    }

    setDeleting(true)
    setError(null)

    try {
      await deleteAppointment(
        appointmentId,
      )

      navigate('/agenda')
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível excluir o compromisso.'

      setError(message)
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="edit-appointment-state">
        Carregando compromisso...
      </div>
    )
  }

  if (!appointment) {
    return (
      <div className="edit-appointment-state edit-appointment-state--error">
        {error ??
          'Compromisso não encontrado.'}
      </div>
    )
  }

  return (
    <section className="edit-appointment-page">
      <header className="edit-appointment-header">
        <Link
          className="edit-appointment-header__back"
          to="/agenda"
        >
          <ArrowLeft size={17} />
          Agenda
        </Link>

        <div>
          <p className="page-header__eyebrow">
            Gerenciamento
          </p>

          <h1 className="page-header__title">
            Editar compromisso
          </h1>

          <p className="page-header__description">
            Altere o serviço, responsável, data, horário ou observações.
          </p>
        </div>
      </header>

      <form
        className="edit-appointment-form"
        onSubmit={handleSubmit}
      >
        <div className="edit-appointment-form__header">
          <div className="edit-appointment-form__icon">
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
              Atualize as informações necessárias.
            </p>
          </div>
        </div>

        <div className="edit-appointment-form__grid">
          <div className="edit-appointment-field edit-appointment-field--full">
            <label htmlFor="horse">
              Cavalo
            </label>

            <SearchableSelect
              id="horse"
              value={horseId}
              options={horseOptions}
              placeholder="Pesquise o cavalo..."
              emptyMessage="Nenhum cavalo encontrado."
              onChange={setHorseId}
            />
          </div>

          <div className="edit-appointment-field edit-appointment-field--full">
            <label htmlFor="eventType">
              Tipo de serviço
            </label>

            <select
              id="eventType"
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

          <div className="edit-appointment-field edit-appointment-field--full">
            <label htmlFor="professional">
              Técnico responsável
            </label>

            <SearchableSelect
              id="professional"
              value={professionalId}
              options={professionalOptions}
              placeholder="Pesquise o responsável..."
              emptyMessage="Nenhum profissional encontrado."
              onChange={setProfessionalId}
            />
          </div>

          <div className="edit-appointment-field edit-appointment-field--full">
            <label htmlFor="scheduledAt">
              Data e horário
            </label>

            <input
              id="scheduledAt"
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

          <div className="edit-appointment-field edit-appointment-field--full">
            <label htmlFor="description">
              Observação
            </label>

            <textarea
              id="description"
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value,
                )
              }
              rows={5}
            />
          </div>
        </div>

        {error && (
          <div className="edit-appointment-form__error">
            {error}
          </div>
        )}

        <div className="edit-appointment-form__danger">
          <button
            type="button"
            className="edit-appointment-cancel-event"
            disabled={
              cancelling ||
              appointment.status ===
                'cancelled'
            }
            onClick={
              handleCancelAppointment
            }
          >
            <XCircle size={16} />
            Cancelar compromisso
          </button>

          <button
            type="button"
            className="edit-appointment-delete"
            disabled={deleting}
            onClick={handleDelete}
          >
            <Trash2 size={16} />
            Excluir
          </button>
        </div>

        <div className="edit-appointment-form__actions">
          <Link
            className="edit-appointment-back"
            to="/agenda"
          >
            Voltar
          </Link>

          <button
            className="edit-appointment-submit"
            type="submit"
            disabled={saving}
          >
            {saving
              ? 'Salvando...'
              : 'Salvar alterações'}
          </button>
        </div>
      </form>
    </section>
  )
}