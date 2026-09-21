import {
  useState,
  type SubmitEvent,
} from 'react'

import {
  useNavigate,
} from 'react-router-dom'

import {
  supabase,
} from '../../lib/supabase.ts'

import './LoginPage.css'

const LOGIN_EXIT_ANIMATION_MS =
  1200

export function LoginPage() {
  const navigate =
    useNavigate()

  const [
    email,
    setEmail,
  ] = useState('')

  const [
    password,
    setPassword,
  ] = useState('')

  const [
    error,
    setError,
  ] = useState('')

  const [
    loading,
    setLoading,
  ] = useState(false)

  const [
    isEntering,
    setIsEntering,
  ] = useState(false)

  async function handleSubmit(
    event: SubmitEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (
      loading ||
      isEntering
    ) {
      return
    }

    setError(
      '',
    )

    setLoading(
      true,
    )

    try {
      const {
        error: signInError,
      } =
        await supabase.auth
          .signInWithPassword(
            {
              email:
                email.trim(),

              password,
            },
          )

      if (
        signInError
      ) {
        setError(
          'E-mail ou senha inválidos.',
        )

        setLoading(
          false,
        )

        return
      }

      setIsEntering(
        true,
      )

      await new Promise<void>(
        (resolve) => {
          window.setTimeout(
            resolve,
            LOGIN_EXIT_ANIMATION_MS,
          )
        },
      )

      navigate(
        '/',
        {
          replace:
            true,
        },
      )
    } catch {
      setError(
        'Não foi possível entrar agora. Tente novamente.',
      )

      setLoading(
        false,
      )
    }
  }

  const pageClassName =
    isEntering
      ? 'login-page login-page--entering'
      : 'login-page'

  return (
    <main
      className={
        pageClassName
      }
    >
      <div className="login-scene">
        <div
          className="login-emblem-stage"
          aria-hidden="true"
        >
          <img
            className="login-emblem-stage__image"
            src="/brasao-haras.png"
            alt=""
          />
        </div>

        <section
          className="login-card"
          aria-busy={
            loading
          }
        >
          <div className="login-brand">
            <div className="login-brand__mark">
              <img
                src="/brasao-haras.png"
                alt=""
              />
            </div>

            <div className="login-brand__text">
              <strong>
                Haras Hollanda
              </strong>

              <span>
                Gestão equestre
              </span>
            </div>
          </div>

          <header className="login-header">
            <span className="login-header__eyebrow">
              Área administrativa
            </span>

            <h1>
              Bem-vindo
            </h1>

            <p>
              Entre com sua conta para acessar a gestão do haras.
            </p>
          </header>

          <form
            className="login-form"
            onSubmit={
              handleSubmit
            }
          >
            <div className="login-field">
              <label htmlFor="email">
                E-mail
              </label>

              <input
                id="email"
                name="email"
                type="email"
                value={
                  email
                }
                onChange={(
                  event,
                ) =>
                  setEmail(
                    event.target.value,
                  )
                }
                placeholder="seu@email.com"
                autoComplete="email"
                disabled={
                  loading
                }
                required
              />
            </div>

            <div className="login-field">
              <label htmlFor="password">
                Senha
              </label>

              <input
                id="password"
                name="password"
                type="password"
                value={
                  password
                }
                onChange={(
                  event,
                ) =>
                  setPassword(
                    event.target.value,
                  )
                }
                placeholder="Digite sua senha"
                autoComplete="current-password"
                disabled={
                  loading
                }
                required
              />
            </div>

            {error && (
              <p
                className="login-error"
                role="alert"
                aria-live="polite"
              >
                {error}
              </p>
            )}

            <button
              className="login-submit"
              type="submit"
              disabled={
                loading
              }
            >
              <span>
                {loading
                  ? 'Entrando...'
                  : 'Entrar'}
              </span>

              <span
                className="login-submit__arrow"
                aria-hidden="true"
              >
                →
              </span>
            </button>
          </form>
        </section>
      </div>
    </main>
  )
}
