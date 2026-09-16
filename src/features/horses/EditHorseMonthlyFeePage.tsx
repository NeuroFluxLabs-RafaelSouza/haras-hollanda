import {
  useEffect,
  useState,
  type SubmitEvent,
} from 'react'

import {
  ArrowLeft,
  CircleDollarSign,
} from 'lucide-react'

import {
  Link,
  useNavigate,
  useParams,
} from 'react-router-dom'

import {
  MoneyInput,
} from '../../components/ui/MoneyInput.tsx'

import {
  getHorseById,
  updateHorseMonthlyFee,
} from './horsesService.ts'

import './EditHorseMonthlyFeePage.css'

export function EditHorseMonthlyFeePage() {
  const {
    horseId,
  } = useParams<{
    horseId: string
  }>()

  const navigate =
    useNavigate()

  const [
    horseName,
    setHorseName,
  ] = useState('')

  const [
    monthlyFee,
    setMonthlyFee,
  ] = useState(0)

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

  useEffect(() => {
    let isMounted =
      true

    async function loadHorse() {
      if (
        !horseId
      ) {
        setError(
          'Cavalo não identificado.',
        )

        setLoading(
          false,
        )

        return
      }

      try {
        const horse =
          await getHorseById(
            horseId,
          )

        if (
          !isMounted
        ) {
          return
        }

        setHorseName(
          horse.name,
        )

        setMonthlyFee(
          horse.monthlyFee ??
          0,
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
            : 'Não foi possível carregar a mensalidade.'

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

    loadHorse()

    return () => {
      isMounted =
        false
    }
  }, [
    horseId,
  ])

  async function handleSubmit(
    event: SubmitEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (
      !horseId
    ) {
      setError(
        'Cavalo não identificado.',
      )

      return
    }

    if (
      !Number.isFinite(
        monthlyFee,
      ) ||
      monthlyFee < 0
    ) {
      setError(
        'Informe uma mensalidade válida.',
      )

      return
    }

    setSaving(
      true,
    )

    setError(
      null,
    )

    try {
      await updateHorseMonthlyFee(
        horseId,
        monthlyFee > 0
          ? monthlyFee
          : null,
      )

      navigate(
        '/cavalos',
      )
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível atualizar a mensalidade.'

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
    <section className="edit-horse-fee-page">
      <header className="edit-horse-fee-header">
        <Link
          className="edit-horse-fee-header__back"
          to="/cavalos"
        >
          <ArrowLeft
            size={17}
          />

          Voltar aos cavalos
        </Link>

        <div>
          <p className="page-header__eyebrow">
            Financeiro do cavalo
          </p>

          <h1 className="page-header__title">
            Editar mensalidade
          </h1>

          <p className="page-header__description">
            Corrija o valor mensal sem precisar editar todo o cadastro do
            cavalo.
          </p>
        </div>
      </header>

      {loading ? (
        <div className="edit-horse-fee-state">
          Carregando mensalidade...
        </div>
      ) : (
        <form
          className="edit-horse-fee-form"
          onSubmit={
            handleSubmit
          }
        >
          <div className="edit-horse-fee-card">
            <div className="edit-horse-fee-card__heading">
              <div className="edit-horse-fee-card__icon">
                <CircleDollarSign
                  size={20}
                  strokeWidth={1.8}
                />
              </div>

              <div>
                <span>
                  Cavalo
                </span>

                <strong>
                  {horseName}
                </strong>
              </div>
            </div>

            <div className="edit-horse-fee-field">
              <label htmlFor="monthlyFee">
                Mensalidade
              </label>

              <MoneyInput
                id="monthlyFee"
                name="monthlyFee"
                value={
                  monthlyFee
                }
                onChange={
                  setMonthlyFee
                }
              />

              <span>
                Digite o valor normalmente. O sistema formata em reais
                automaticamente.
              </span>
            </div>

            <div className="edit-horse-fee-notice">
              <strong>
                Histórico financeiro protegido
              </strong>

              <span>
                A alteração será usada nas próximas mensalidades geradas. Valores
                financeiros já registrados não são modificados automaticamente.
              </span>
            </div>
          </div>

          {error && (
            <div className="edit-horse-fee-error">
              {error}
            </div>
          )}

          <div className="edit-horse-fee-actions">
            <Link
              to="/cavalos"
            >
              Cancelar
            </Link>

            <button
              type="submit"
              disabled={
                saving
              }
            >
              {saving
                ? 'Salvando...'
                : 'Salvar mensalidade'}
            </button>
          </div>
        </form>
      )}
    </section>
  )
}