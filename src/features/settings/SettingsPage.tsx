import {
  useEffect,
  useState,
  type ChangeEvent,
  type SubmitEvent,
} from 'react'

import {
  AlertTriangle,
  Boxes,
  Building2,
  CheckCircle2,
  ImagePlus,
  Save,
  WalletCards,
} from 'lucide-react'

import {
  ImageCropper,
} from '../../components/ui/ImageCropper.tsx'

import {
  getAppSettings,
  getHarasLogoUrl,
  updateAppSettings,
  uploadHarasLogo,
} from './settingsService.ts'

import './SettingsPage.css'

export function SettingsPage() {
  const [
    harasName,
    setHarasName,
  ] = useState(
    'Haras Hollanda',
  )

  const [
    logoUrl,
    setLogoUrl,
  ] = useState<
    string | null
  >(null)

  const [
    pendingLogoFile,
    setPendingLogoFile,
  ] = useState<
    File | null
  >(null)

  const [
    monthlyDueDay,
    setMonthlyDueDay,
  ] = useState(
    10,
  )

  const [
    financialAlertDays,
    setFinancialAlertDays,
  ] = useState(
    3,
  )

  const [
    inventoryReplenishmentDays,
    setInventoryReplenishmentDays,
  ] = useState(
    7,
  )

  const [
    loading,
    setLoading,
  ] = useState(
    true,
  )

  const [
    saving,
    setSaving,
  ] = useState(
    false,
  )

  const [
    uploadingLogo,
    setUploadingLogo,
  ] = useState(
    false,
  )

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
        const settings =
          await getAppSettings()

        const currentLogoUrl =
          await getHarasLogoUrl(
            settings.logoPath,
          )

        if (
          !isMounted
        ) {
          return
        }

        setHarasName(
          settings.harasName,
        )

        setLogoUrl(
          currentLogoUrl,
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

  function handleLogoChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file =
      event.target.files?.[0]

    event.target.value =
      ''

    if (!file) {
      return
    }

    setError(
      null,
    )

    setSuccess(
      null,
    )

    setPendingLogoFile(
      file,
    )
  }

  async function handleAdjustedLogo(
    adjustedFile: File,
  ) {
    try {
      setUploadingLogo(
        true,
      )

      setError(
        null,
      )

      setSuccess(
        null,
      )

      const settings =
        await uploadHarasLogo(
          adjustedFile,
        )

      const uploadedLogoUrl =
        await getHarasLogoUrl(
          settings.logoPath,
        )

      setLogoUrl(
        uploadedLogoUrl,
      )

      setPendingLogoFile(
        null,
      )

      setSuccess(
        'Logo atualizada com sucesso.',
      )
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível enviar a logo.'

      setError(
        message,
      )

      throw error
    } finally {
      setUploadingLogo(
        false,
      )
    }
  }

  async function handleSubmit(
    event: SubmitEvent<HTMLFormElement>,
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
    <>
      <section className="settings-page">
        <header className="page-header">
          <p className="page-header__eyebrow">
            Preferências do sistema
          </p>

          <h1 className="page-header__title">
            Configurações
          </h1>

          <p className="page-header__description">
            Gerencie os dados do haras e as regras usadas automaticamente
            pelo sistema.
          </p>
        </header>

        {error && (
          <div className="settings-message settings-message--error">
            <AlertTriangle
              size={18}
              strokeWidth={
                1.8
              }
            />

            <span>
              {error}
            </span>
          </div>
        )}

        {success && (
          <div className="settings-message settings-message--success">
            <CheckCircle2
              size={18}
              strokeWidth={
                1.8
              }
            />

            <span>
              {success}
            </span>
          </div>
        )}

        {loading ? (
          <div className="settings-loading">
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
              <header className="settings-card__header">
                <div className="settings-card__icon">
                  <Building2
                    size={19}
                    strokeWidth={
                      1.8
                    }
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
                    Informações usadas para identificar o sistema.
                  </p>
                </div>
              </header>

              <div className="settings-branding">
                <div className="settings-logo-preview">
                  {logoUrl ? (
                    <img
                      src={
                        logoUrl
                      }
                      alt={`Logo de ${harasName}`}
                    />
                  ) : (
                    <Building2
                      size={28}
                      strokeWidth={
                        1.6
                      }
                    />
                  )}
                </div>

                <div className="settings-logo-content">
                  <strong>
                    Logo do haras
                  </strong>

                  <p>
                    Envie a imagem e ajuste o enquadramento antes de salvar.
                  </p>

                  <div className="settings-logo-actions">
                    <label
                      className={`settings-logo-button ${
                        uploadingLogo
                          ? 'settings-logo-button--disabled'
                          : ''
                      }`}
                      htmlFor="harasLogo"
                    >
                      <ImagePlus
                        size={16}
                        strokeWidth={
                          1.8
                        }
                      />

                      {uploadingLogo
                        ? 'Salvando...'
                        : logoUrl
                          ? 'Trocar logo'
                          : 'Enviar logo'}
                    </label>

                    <input
                      className="settings-logo-input"
                      id="harasLogo"
                      name="harasLogo"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={
                        handleLogoChange
                      }
                      disabled={
                        uploadingLogo
                      }
                    />
                  </div>

                  <span className="settings-logo-help">
                    JPG, PNG ou WebP. Máximo de 5 MB.
                  </span>
                </div>
              </div>

              <div className="settings-field">
                <label htmlFor="harasName">
                  Nome do haras
                </label>

                <input
                  id="harasName"
                  name="harasName"
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
                  autoComplete="organization"
                  required
                />

                <span>
                  Esse nome aparece na identidade visual do sistema.
                </span>
              </div>
            </section>

            <section className="settings-card">
              <header className="settings-card__header">
                <div className="settings-card__icon">
                  <WalletCards
                    size={19}
                    strokeWidth={
                      1.8
                    }
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
                    Defina como o sistema prepara e sinaliza as cobranças.
                  </p>
                </div>
              </header>

              <div className="settings-grid">
                <div className="settings-field">
                  <label htmlFor="monthlyDueDay">
                    Dia padrão de vencimento
                  </label>

                  <div className="settings-input-unit">
                    <input
                      id="monthlyDueDay"
                      name="monthlyDueDay"
                      type="number"
                      min={1}
                      max={28}
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
                      dia
                    </span>
                  </div>

                  <span>
                    Usado nas novas cobranças mensais.
                  </span>
                </div>

                <div className="settings-field">
                  <label htmlFor="financialAlertDays">
                    Avisar com antecedência
                  </label>

                  <div className="settings-input-unit">
                    <input
                      id="financialAlertDays"
                      name="financialAlertDays"
                      type="number"
                      min={0}
                      max={15}
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
                    Define quando o Dashboard começa a avisar sobre
                    vencimentos próximos.
                  </span>
                </div>
              </div>
            </section>

            <section className="settings-card">
              <header className="settings-card__header">
                <div className="settings-card__icon">
                  <Boxes
                    size={19}
                    strokeWidth={
                      1.8
                    }
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
                    Defina com quanta antecedência uma compra deve ser
                    recomendada.
                  </p>
                </div>
              </header>

              <div className="settings-field">
                <label htmlFor="inventoryReplenishmentDays">
                  Autonomia mínima desejada
                </label>

                <div className="settings-input-unit">
                  <input
                    id="inventoryReplenishmentDays"
                    name="inventoryReplenishmentDays"
                    type="number"
                    min={1}
                    max={60}
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
                  Quando a autonomia prevista chegar a esse valor, o sistema
                  recomenda reposição.
                </span>
              </div>
            </section>

            <footer className="settings-actions">
              <button
                className="settings-save-button"
                type="submit"
                disabled={
                  saving ||
                  uploadingLogo
                }
              >
                <Save
                  size={17}
                  strokeWidth={
                    1.8
                  }
                />

                {saving
                  ? 'Salvando...'
                  : 'Salvar configurações'}
              </button>
            </footer>
          </form>
        )}
      </section>

      {pendingLogoFile && (
        <ImageCropper
          file={
            pendingLogoFile
          }
          title="Ajustar logo"
          description="O círculo mostra como a imagem ficará na barra lateral."
          cropShape="circle"
          confirmLabel="Salvar logo"
          onCancel={
            () =>
              setPendingLogoFile(
                null,
              )
          }
          onConfirm={
            handleAdjustedLogo
          }
        />
      )}
    </>
  )
}