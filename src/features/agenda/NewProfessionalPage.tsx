import {
  useState,
  type SubmitEvent,
} from 'react'

import {
  ArrowLeft,
  UserRound,
} from 'lucide-react'

import {
  Link,
  useNavigate,
} from 'react-router-dom'

import {
  createProfessional,
} from './professionalsService.ts'

import './NewProfessionalPage.css'

function formatPhoneInput(
  value: string,
) {
  const digits = value
    .replace(/\D/g, '')
    .slice(0, 11)

  if (digits.length <= 2) {
    return digits
      ? `(${digits}`
      : ''
  }

  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  }

  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

export function NewProfessionalPage() {
  const navigate = useNavigate()

  const [
    name,
    setName,
  ] = useState('')

  const [
    specialty,
    setSpecialty,
  ] = useState('')

  const [
    phone,
    setPhone,
  ] = useState('')

  const [
    saving,
    setSaving,
  ] = useState(false)

  const [
    error,
    setError,
  ] = useState<string | null>(null)

  async function handleSubmit(
    event: SubmitEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    setError(null)

    const trimmedName =
      name.trim()

    if (!trimmedName) {
      setError(
        'Informe o nome do profissional.',
      )

      return
    }

    setSaving(true)

    try {
      await createProfessional({
        name: trimmedName,

        specialty:
          specialty.trim() || null,

        phone:
          phone.trim() || null,
      })

      navigate(
        '/agenda/profissionais',
      )
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível cadastrar o profissional.'

      setError(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="new-professional-page">
      <header className="new-professional-header">
        <Link
          className="new-professional-header__back"
          to="/agenda/profissionais"
        >
          <ArrowLeft size={17} />
          Profissionais
        </Link>

        <div>
          <p className="page-header__eyebrow">
            Cadastro
          </p>

          <h1 className="page-header__title">
            Novo profissional
          </h1>

          <p className="page-header__description">
            Cadastre quem executa serviços e atendimentos no haras.
          </p>
        </div>
      </header>

      <form
        className="new-professional-form"
        onSubmit={handleSubmit}
      >
        <div className="new-professional-form__header">
          <div className="new-professional-form__icon">
            <UserRound
              size={19}
              strokeWidth={1.8}
            />
          </div>

          <div>
            <h2>
              Dados do profissional
            </h2>

            <p>
              Essas informações serão usadas nos compromissos da Agenda.
            </p>
          </div>
        </div>

        <div className="new-professional-form__grid">
          <div className="new-professional-field">
            <label htmlFor="name">
              Nome
            </label>

            <input
              id="name"
              name="name"
              type="text"
              value={name}
              onChange={(event) =>
                setName(
                  event.target.value,
                )
              }
              placeholder="Ex: João da Silva"
              autoComplete="off"
              required
            />
          </div>

          <div className="new-professional-field">
            <label htmlFor="specialty">
              Especialidade
            </label>

            <input
              id="specialty"
              name="specialty"
              type="text"
              value={specialty}
              onChange={(event) =>
                setSpecialty(
                  event.target.value,
                )
              }
              placeholder="Ex: Ferrador"
              autoComplete="off"
            />
          </div>

          <div className="new-professional-field new-professional-field--full">
            <label htmlFor="phone">
              Telefone
            </label>

            <input
              id="phone"
              name="phone"
              type="tel"
              value={phone}
              onChange={(event) =>
                setPhone(
                  formatPhoneInput(
                    event.target.value,
                  ),
                )
              }
              placeholder="(32) 99999-9999"
              autoComplete="tel"
            />
          </div>
        </div>

        {error && (
          <div className="new-professional-form__error">
            {error}
          </div>
        )}

        <div className="new-professional-form__actions">
          <Link
            className="new-professional-cancel"
            to="/agenda/profissionais"
          >
            Cancelar
          </Link>

          <button
            className="new-professional-submit"
            type="submit"
            disabled={saving}
          >
            {saving
              ? 'Cadastrando...'
              : 'Cadastrar profissional'}
          </button>
        </div>
      </form>
    </section>
  )
}