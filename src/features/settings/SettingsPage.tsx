import {
  useEffect,
  useState,
} from 'react'

import type {
  SubmitEvent,
} from 'react'

import {
  AlertTriangle,
  Boxes,
  Building2,
  CheckCircle2,
  Save,
  WalletCards,
} from 'lucide-react'

import {
  getAppSettings,
  updateAppSettings,
} from './settingsService.ts'

import './SettingsPage.css'

export function SettingsPage() {
  const [
    harasName,
    setHarasName,
  ] = useState('')

  const [
    monthlyDueDay,
    setMonthlyDueDay,
  ] = useState(10)

  const [
    financialAlertDays,
    setFinancialAlertDays,
  ] = useState(3)

  const [
    inventoryReplenishmentDays,
    setInventoryReplenishmentDays,
  ] = useState(7)

  const [
    loading,
    setLoading,
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

  const [
    success,
    setSuccess,
  ] = useState<
    string | null
  >(null)

  useEffect(() => {
    let isMounted =
      true

    async function loadSettings() {
      try {
        setLoading(
          true,
        )

        const settings =
          await getAppSettings()

        if (
          !isMounted
        ) {
          return
        }

        setHarasName(
          settings.harasName,
        )

        setMonthlyDueDay(
          settings.monthlyDueDay,
        )

        setFinancialAlertDays(
          settings.financialAlertDays,
        )

        setInventoryReplenishmentDays(
          settings.inventoryReplenishmentDays,
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
            : 'Não foi possível carregar as configurações.'

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

    loadSettings()

    return () => {
      isMounted =
        false
    }
  }, [])

  async function handleSubmit(
    event: SubmitEvent,
  ) {
    event.preventDefault()

    try {
      setSaving(
        true,
      )

      setError(
        null,
      )

      setSuccess(
        null,
      )

      const settings =
        await updateAppSettings({
          harasName,
          monthlyDueDay,
          financialAlertDays,
          inventoryReplenishmentDays,
        })

      setHarasName(
        settings.harasName,
      )

      setMonthlyDueDay(
        settings.monthlyDueDay,
      )

      setFinancialAlertDays(
        settings.financialAlertDays,
      )

      setInventoryReplenishmentDays(
        settings.inventoryReplenishmentDays,
      )

      setSuccess(
        'Configurações salvas com sucesso.',
      )
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível salvar as configurações.'

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
    <section className="settings-page">
      <header className="page-header">
        <p className="page-header__eyebrow">
          Preferências do sistema
        </p>

        <h1 className="page-header__title">
          Configurações
        </h1>

        <p className="page-header__description">
          Defina as regras gerais usadas pelo Haras Hollanda.
        </p>
      </header>

      {error && (
        <div className="settings-message settings-message--error">
          <AlertTriangle
            size={18}
            strokeWidth={1.8}
          />

          <div>
            <strong>
              Não foi possível atualizar as configurações
            </strong>

            <span>
              {error}
            </span>
          </div>
        </div>
      )}

      {success && (
        <div className="settings-message settings-message--success">
          <CheckCircle2
            size={18}
            strokeWidth={1.8}
          />

          <div>
            <strong>
              Configurações atualizadas
            </strong>

            <span>
              {success}
            </span>
          </div>
        </div>
      )}

      {loading ? (
        <div className="settings-state">
          Carregando configurações...
        </div>
      ) : (
        <form
          className="settings-form"
          onSubmit={
            handleSubmit
          }
        >
          <section className="settings-card">
            <div className="settings-card__header">
              <div className="settings-card__icon">
                <Building2
                  size={19}
                  strokeWidth={1.8}
                />
              </div>

              <div>
                <span>
                  Identidade
                </span>

                <h2>
                  Dados do haras
                </h2>

                <p>
                  Informações gerais que identificam o estabelecimento.
                </p>
              </div>
            </div>

            <div className="settings-field">
              <label htmlFor="haras-name">
                Nome do haras
              </label>

              <input
                id="haras-name"
                type="text"
                value={
                  harasName
                }
                onChange={(
                  event,
                ) =>
                  setHarasName(
                    event.target.value,
                  )
                }
                placeholder="Ex: Haras Hollanda"
                required
              />

              <span>
                Esse nome poderá ser reutilizado em outras áreas do sistema.
              </span>
            </div>
          </section>

          <section className="settings-card">
            <div className="settings-card__header">
              <div className="settings-card__icon">
                <WalletCards
                  size={19}
                  strokeWidth={1.8}
                />
              </div>

              <div>
                <span>
                  Financeiro
                </span>

                <h2>
                  Mensalidades
                </h2>

                <p>
                  Defina quando as mensalidades vencem e quando o sistema deve avisar.
                </p>
              </div>
            </div>

            <div className="settings-grid">
              <div className="settings-field">
                <label htmlFor="monthly-due-day">
                  Dia padrão de vencimento
                </label>

                <input
                  id="monthly-due-day"
                  type="number"
                  min="1"
                  max="28"
                  value={
                    monthlyDueDay
                  }
                  onChange={(
                    event,
                  ) =>
                    setMonthlyDueDay(
                      Number(
                        event.target.value,
                      ),
                    )
                  }
                  required
                />

                <span>
                  Usado nas novas cobranças mensais.
                </span>
              </div>

              <div className="settings-field">
                <label htmlFor="financial-alert-days">
                  Avisar com antecedência
                </label>

                <div className="settings-field__unit">
                  <input
                    id="financial-alert-days"
                    type="number"
                    min="0"
                    max="15"
                    value={
                      financialAlertDays
                    }
                    onChange={(
                      event,
                    ) =>
                      setFinancialAlertDays(
                        Number(
                          event.target.value,
                        ),
                      )
                    }
                    required
                  />

                  <span>
                    dias
                  </span>
                </div>

                <span>
                  Define quando o Dashboard começa a mostrar o próximo vencimento.
                </span>
              </div>
            </div>
          </section>

          <section className="settings-card">
            <div className="settings-card__header">
              <div className="settings-card__icon">
                <Boxes
                  size={19}
                  strokeWidth={1.8}
                />
              </div>

              <div>
                <span>
                  Estoque
                </span>

                <h2>
                  Planejamento de reposição
                </h2>

                <p>
                  Controle com quantos dias de autonomia o estoque deve gerar atenção.
                </p>
              </div>
            </div>

            <div className="settings-field settings-field--compact">
              <label htmlFor="inventory-replenishment-days">
                Autonomia mínima desejada
              </label>

              <div className="settings-field__unit">
                <input
                  id="inventory-replenishment-days"
                  type="number"
                  min="1"
                  max="60"
                  value={
                    inventoryReplenishmentDays
                  }
                  onChange={(
                    event,
                  ) =>
                    setInventoryReplenishmentDays(
                      Number(
                        event.target.value,
                      ),
                    )
                  }
                  required
                />

                <span>
                  dias
                </span>
              </div>

              <span>
                Abaixo desse limite o sistema poderá recomendar reposição.
              </span>
            </div>
          </section>

          <footer className="settings-actions">
            <div className="settings-actions__note">
              Alterações futuras passam a utilizar essas preferências.
            </div>

            <button
              className="settings-save-button"
              type="submit"
              disabled={
                saving
              }
            >
              <Save
                size={16}
                strokeWidth={1.9}
              />

              {saving
                ? 'Salvando...'
                : 'Salvar configurações'}
            </button>
          </footer>
        </form>
      )}
    </section>
  )
}