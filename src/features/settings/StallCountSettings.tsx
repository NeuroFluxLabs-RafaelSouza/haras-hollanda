import {
  useEffect,
  useRef,
  useState,
  type SubmitEvent,
} from 'react'

import {
  AlertTriangle,
  CheckCircle2,
  DoorOpen,
  Plus,
} from 'lucide-react'

import {
  getCurrentStallCount,
  syncStallCount,
} from './stallCountService.ts'

import './StallCountSettings.css'

export function StallCountSettings() {
  const submittingRef = useRef(false)
  const [
    currentCount,
    setCurrentCount,
  ] = useState(0)

  const [
    targetCount,
    setTargetCount,
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
    error,
    setError,
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

    async function loadStallCount() {
      try {
        const count =
          await getCurrentStallCount()

        if (!isMounted) {
          return
        }

        setCurrentCount(
          count,
        )

        setTargetCount(
          String(
            count > 0
              ? count
              : 1,
          ),
        )
      } catch (error) {
        if (!isMounted) {
          return
        }

        const message =
          error instanceof Error
            ? error.message
            : 'Não foi possível carregar a quantidade de baias.'

        setError(
          message,
        )
      } finally {
        if (isMounted) {
          setLoading(
            false,
          )
        }
      }
    }

    void loadStallCount()

    return () => {
      isMounted =
        false
    }
  }, [])

  const parsedTargetCount =
    Number(
      targetCount,
    )

  const targetIsValid =
    Number.isInteger(
      parsedTargetCount,
    ) &&
    parsedTargetCount >=
      1 &&
    parsedTargetCount <=
      500

  const targetIsLower =
    targetIsValid &&
    parsedTargetCount <
      currentCount

  async function handleSubmit(
    event: SubmitEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (submittingRef.current || loading) {
      return
    }

    setError(
      null,
    )

    setSuccessMessage(
      null,
    )

    if (
      !targetIsValid
    ) {
      setError(
        'Informe uma quantidade entre 1 e 500 baias.',
      )

      return
    }

    submittingRef.current = true
    setSaving(
      true,
    )

    try {
      const result =
        await syncStallCount(
          parsedTargetCount,
        )

      setCurrentCount(
        result.totalCount,
      )

      setTargetCount(
        String(
          result.requestedCount,
        ),
      )

      if (
        result.createdCount >
        0
      ) {
        setSuccessMessage(
          result.createdCount ===
            1
            ? `1 nova baia foi criada. O Haras agora possui ${result.totalCount} baias.`
            : `${result.createdCount} novas baias foram criadas. O Haras agora possui ${result.totalCount} baias.`,
        )

        return
      }

      if (
        result.requestedCount <
        result.previousCount
      ) {
        setSuccessMessage(
          `Nenhuma baia foi removida. O Haras continua com ${result.totalCount} baias.`,
        )

        return
      }

      setSuccessMessage(
        `Nenhuma nova baia foi necessária. As ${result.totalCount} baias já estão cadastradas.`,
      )
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível gerar as baias.'

      setError(
        message,
      )
    } finally {
      submittingRef.current = false
      setSaving(
        false,
      )
    }
  }

  return (
    <section className="stall-count-settings">
      <div className="stall-count-settings__header">
        <div className="stall-count-settings__icon">
          <DoorOpen
            size={20}
            strokeWidth={
              1.7
            }
          />
        </div>

        <div>
          <h2>
            Baias
          </h2>

          <p>
            Defina quantas baias físicas existem no Haras. O sistema cria
            automaticamente apenas as que ainda não existem.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="stall-count-settings__loading">
          Carregando baias...
        </div>
      ) : (
        <>
          <div className="stall-count-settings__summary">
            <div className="stall-count-settings__summary-icon">
              <DoorOpen
                size={19}
                strokeWidth={
                  1.7
                }
              />
            </div>

            <div className="stall-count-settings__summary-content">
              <span>
                Baias cadastradas
              </span>

              <strong>
                {currentCount}
              </strong>
            </div>

            <span className="stall-count-settings__summary-status">
              Estrutura atual
            </span>
          </div>

          <form
            className="stall-count-settings__form"
            onSubmit={
              handleSubmit
            }
          >
            <div className="stall-count-settings__field">
              <label htmlFor="stallCount">
                Quantidade de baias
              </label>

              <input
                id="stallCount"
                name="stallCount"
                type="number"
                inputMode="numeric"
                min={1}
                max={500}
                step={1}
                disabled={saving}
                required
                value={
                  targetCount
                }
                onChange={(
                  event,
                ) => {
                  setTargetCount(
                    event.target.value,
                  )

                  setError(
                    null,
                  )

                  setSuccessMessage(
                    null,
                  )
                }}
                placeholder="Ex: 23"
              />

              <span className="stall-count-settings__help">
                Informe o total de baias que deseja ter cadastrado no sistema.
              </span>
            </div>

            <div className="stall-count-settings__preview">
              <span>
                Resultado
              </span>

              {!targetIsValid ? (
                <strong>
                  Informe uma quantidade entre 1 e 500.
                </strong>
              ) : targetIsLower ? (
                <>
                  <strong>
                    Nenhuma baia será excluída
                  </strong>

                  <small>
                    Atualmente existem {currentCount} baias. Reduzir este número
                    não apaga baias existentes nem seu histórico. Números
                    ausentes até Baia {String(parsedTargetCount).padStart(2, '0')}
                    {' '}serão criados.
                  </small>
                </>
              ) : (
                <>
                  <strong>
                    Baia 01 até Baia {String(parsedTargetCount).padStart(2, '0')}
                  </strong>

                  <small>
                    Apenas as baias ausentes serão criadas. As existentes
                    serão preservadas, inclusive as que estiverem fora dessa sequência.
                  </small>
                </>
              )}
            </div>

            {error && (
              <div className="stall-count-settings__message stall-count-settings__message--error">
                <AlertTriangle
                  size={17}
                  strokeWidth={
                    1.8
                  }
                />

                <span>
                  {error}
                </span>
              </div>
            )}

            {successMessage && (
              <div className="stall-count-settings__message stall-count-settings__message--success">
                <CheckCircle2
                  size={17}
                  strokeWidth={
                    1.8
                  }
                />

                <span>
                  {successMessage}
                </span>
              </div>
            )}

            <div className="stall-count-settings__actions">
              <div className="stall-count-settings__note">
                O sistema nunca duplica uma baia existente.
              </div>

              <button
                type="submit"
                disabled={
                  saving ||
                  !targetIsValid
                }
              >
                <Plus
                  size={16}
                  strokeWidth={
                    1.9
                  }
                />

                {saving
                  ? 'Gerando baias...'
                  : 'Confirmar e gerar baias'}
              </button>
            </div>
          </form>
        </>
      )}
    </section>
  )
}
