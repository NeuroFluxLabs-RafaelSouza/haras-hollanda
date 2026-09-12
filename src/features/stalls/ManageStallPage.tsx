import { useEffect, useState, type SubmitEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import type {
  Stall,
  StallStatus,
} from '../../domain/stall.ts'

import {
  getStallById,
  updateStallOperational,
} from './stallsService.ts'

import './ManageStallPage.css'

export function ManageStallPage() {
  const navigate = useNavigate()
  const { stallId } = useParams()

  const [stall, setStall] = useState<Stall | null>(null)

  const [status, setStatus] =
    useState<StallStatus>('operational')

  const [notes, setNotes] = useState('')
  const [maintenanceUntil, setMaintenanceUntil] =
    useState('')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadStall() {
      if (!stallId) {
        setError('Baia não identificada.')
        setLoading(false)
        return
      }

      try {
        const data = await getStallById(stallId)

        if (!isMounted) {
          return
        }

        setStall(data)
        setStatus(data.status)
        setNotes(data.notes ?? '')
        setMaintenanceUntil(
          data.maintenanceUntil ?? '',
        )
      } catch (error) {
        if (!isMounted) {
          return
        }

        const message =
          error instanceof Error
            ? error.message
            : 'Não foi possível carregar a baia.'

        setError(message)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadStall()

    return () => {
      isMounted = false
    }
  }, [stallId])

  function handleStatusChange(
    newStatus: StallStatus,
  ) {
    setStatus(newStatus)

    if (newStatus !== 'maintenance') {
      setMaintenanceUntil('')
    }
  }

  async function handleSubmit(
    event: SubmitEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (!stallId) {
      return
    }

    setError(null)
    setSaving(true)

    try {
      await updateStallOperational(stallId, {
        status,
        notes: notes.trim() || null,
        maintenanceUntil:
          status === 'maintenance'
            ? maintenanceUntil || null
            : null,
      })

      navigate('/baias')
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível atualizar a baia.'

      setError(message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="manage-stall-state">
        Carregando baia...
      </div>
    )
  }

  if (error && !stall) {
    return (
      <div className="manage-stall-state manage-stall-state--error">
        {error}
      </div>
    )
  }

  if (!stall) {
    return null
  }

  return (
    <section className="manage-stall-page">
      <header className="page-header">
        <p className="page-header__eyebrow">
          Gestão operacional
        </p>

        <h1 className="page-header__title">
          {stall.name}
        </h1>

        <p className="page-header__description">
          Atualize a condição operacional, observações e manutenção da baia.
        </p>
      </header>

      <form
        className="manage-stall-form"
        onSubmit={handleSubmit}
      >
        <div className="manage-stall-form__grid">
          <div className="manage-stall-field">
            <label htmlFor="status">
              Situação da baia
            </label>

            <select
              id="status"
              name="status"
              value={status}
              onChange={(event) =>
                handleStatusChange(
                  event.target.value as StallStatus,
                )
              }
            >
              <option value="operational">
                Operacional
              </option>

              <option value="maintenance">
                Em manutenção
              </option>

              <option value="inactive">
                Inativa
              </option>
            </select>
          </div>

          {status === 'maintenance' && (
            <div className="manage-stall-field">
              <label htmlFor="maintenanceUntil">
                Previsão de liberação
              </label>

              <input
                id="maintenanceUntil"
                name="maintenanceUntil"
                type="date"
                value={maintenanceUntil}
                onChange={(event) =>
                  setMaintenanceUntil(
                    event.target.value,
                  )
                }
              />
            </div>
          )}

          <div className="manage-stall-field manage-stall-field--full">
            <label htmlFor="notes">
              Observações
            </label>

            <textarea
              id="notes"
              name="notes"
              value={notes}
              onChange={(event) =>
                setNotes(event.target.value)
              }
              placeholder="Ex: Bebedouro com vazamento, trinco da porta precisa de ajuste..."
              rows={5}
            />
          </div>
        </div>

        {error && (
          <p className="manage-stall-form__error">
            {error}
          </p>
        )}

        <div className="manage-stall-form__actions">
          <Link
            className="manage-stall-cancel"
            to="/baias"
          >
            Cancelar
          </Link>

          <button
            className="manage-stall-submit"
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