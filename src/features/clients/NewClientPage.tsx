import { useState, type SubmitEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { createClient } from './clientsService'

import './NewClientPage.css'

export function NewClientPage() {
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

 async function handleSubmit(
  event: SubmitEvent<HTMLFormElement>,
) {
    event.preventDefault()

    setError(null)
    setLoading(true)

    try {
      await createClient({
        name: name.trim(),
        phone: phone.trim() || null,
        email: email.trim() || null,
      })

      navigate('/clientes')
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível cadastrar o cliente.'

      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="new-client-page">
      <header className="page-header">
        <p className="page-header__eyebrow">
          Novo cadastro
        </p>

        <h1 className="page-header__title">
          Novo cliente
        </h1>

        <p className="page-header__description">
          Cadastre o responsável financeiro e os dados de contato.
        </p>
      </header>

      <form
        className="new-client-form"
        onSubmit={handleSubmit}
      >
        <div className="new-client-form__grid">
          <div className="new-client-field new-client-field--full">
            <label htmlFor="name">
              Nome
            </label>

            <input
              id="name"
              name="name"
              type="text"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              placeholder="Ex: Carlos Henrique"
              required
            />
          </div>

          <div className="new-client-field">
            <label htmlFor="phone">
              Telefone
            </label>

            <input
              id="phone"
              name="phone"
              type="tel"
              value={phone}
              onChange={(event) =>
                setPhone(event.target.value)
              }
              placeholder="(32) 99999-9999"
            />
          </div>

          <div className="new-client-field">
            <label htmlFor="email">
              E-mail
            </label>

            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="cliente@email.com"
            />
          </div>
        </div>

        {error && (
          <p className="new-client-form__error">
            {error}
          </p>
        )}

        <div className="new-client-form__actions">
          <Link
            className="new-client-cancel"
            to="/clientes"
          >
            Cancelar
          </Link>

          <button
            className="new-client-submit"
            type="submit"
            disabled={loading}
          >
            {loading
              ? 'Cadastrando...'
              : 'Cadastrar cliente'}
          </button>
        </div>
      </form>
    </section>
  )
}