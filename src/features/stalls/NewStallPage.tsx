import { useState, type SubmitEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { createStall } from './stallsService.ts'

import './NewStallPage.css'

export function NewStallPage() {
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(
    event: SubmitEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    setError(null)
    setLoading(true)

    try {
      await createStall({
        name: name.trim(),
      })

      navigate('/baias')
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível cadastrar a baia.'

      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="new-stall-page">
      <header className="page-header">
        <p className="page-header__eyebrow">
          Novo cadastro
        </p>

        <h1 className="page-header__title">
          Nova baia
        </h1>

        <p className="page-header__description">
          Cadastre uma nova baia para controlar a ocupação do haras.
        </p>
      </header>

      <form
        className="new-stall-form"
        onSubmit={handleSubmit}
      >
        <div className="new-stall-field">
          <label htmlFor="name">
            Identificação da baia
          </label>

          <input
            id="name"
            name="name"
            type="text"
            value={name}
            onChange={(event) =>
              setName(event.target.value)
            }
            placeholder="Ex: Baia 01"
            required
          />
        </div>

        {error && (
          <p className="new-stall-form__error">
            {error}
          </p>
        )}

        <div className="new-stall-form__actions">
          <Link
            className="new-stall-cancel"
            to="/baias"
          >
            Cancelar
          </Link>

          <button
            className="new-stall-submit"
            type="submit"
            disabled={loading}
          >
            {loading
              ? 'Cadastrando...'
              : 'Cadastrar baia'}
          </button>
        </div>
      </form>
    </section>
  )
}