import {
  useEffect,
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

type LoginMode =
  | 'login'
  | 'forgot'
  | 'reset'

function getInitialMode(): LoginMode {
  const searchParams =
    new URLSearchParams(
      window.location.search,
    )

  return searchParams.get(
    'mode',
  ) ===
    'reset'
    ? 'reset'
    : 'login'
}

export function LoginPage() {
  const navigate =
    useNavigate()

  const [
    mode,
    setMode,
  ] =
    useState<LoginMode>(
      getInitialMode,
    )

  const [
    email,
    setEmail,
  ] = useState('')

  const [
    password,
    setPassword,
  ] = useState('')

  const [
    newPassword,
    setNewPassword,
  ] = useState('')

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState('')

  const [
    error,
    setError,
  ] = useState('')

  const [
    successMessage,
    setSuccessMessage,
  ] = useState('')

  const [
    loading,
    setLoading,
  ] = useState(false)

  useEffect(() => {
    const {
      data: {
        subscription,
      },
    } =
      supabase.auth
        .onAuthStateChange(
          (
            event,
          ) => {
            if (
              event ===
              'PASSWORD_RECOVERY'
            ) {
              setMode(
                'reset',
              )

              setError(
                '',
              )

              setSuccessMessage(
                '',
              )
            }
          },
        )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  function clearMessages() {
    setError(
      '',
    )

    setSuccessMessage(
      '',
    )
  }

  function showLogin() {
    clearMessages()

    setMode(
      'login',
    )

    setNewPassword(
      '',
    )

    setConfirmPassword(
      '',
    )

    navigate(
      '/login',
      {
        replace:
          true,
      },
    )
  }

  function showForgotPassword() {
    clearMessages()

    setMode(
      'forgot',
    )
  }

  async function handleLoginSubmit(
    event: SubmitEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (
      loading
    ) {
      return
    }

    clearMessages()

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

        return
      }

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
    } finally {
      setLoading(
        false,
      )
    }
  }

  async function handleRecoverySubmit(
    event: SubmitEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (
      loading
    ) {
      return
    }

    clearMessages()

    const trimmedEmail =
      email.trim()

    if (
      !trimmedEmail
    ) {
      setError(
        'Informe o e-mail da conta.',
      )

      return
    }

    setLoading(
      true,
    )

    try {
      const redirectTo =
        `${window.location.origin}/login?mode=reset`

      const {
        error: recoveryError,
      } =
        await supabase.auth
          .resetPasswordForEmail(
            trimmedEmail,
            {
              redirectTo,
            },
          )

      if (
        recoveryError
      ) {
        setError(
          'Não foi possível enviar o link de recuperação. Tente novamente.',
        )

        return
      }

      setSuccessMessage(
        'Enviamos um link de recuperação para o e-mail informado.',
      )
    } catch {
      setError(
        'Não foi possível enviar o link de recuperação. Tente novamente.',
      )
    } finally {
      setLoading(
        false,
      )
    }
  }

  async function handlePasswordResetSubmit(
    event: SubmitEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (
      loading
    ) {
      return
    }

    clearMessages()

    if (
      newPassword.length <
      6
    ) {
      setError(
        'A nova senha precisa ter pelo menos 6 caracteres.',
      )

      return
    }

    if (
      newPassword !==
      confirmPassword
    ) {
      setError(
        'As senhas não coincidem.',
      )

      return
    }

    setLoading(
      true,
    )

    try {
      const {
        error: updateError,
      } =
        await supabase.auth
          .updateUser(
            {
              password:
                newPassword,
            },
          )

      if (
        updateError
      ) {
        setError(
          'O link é inválido ou expirou. Solicite uma nova recuperação de senha.',
        )

        return
      }

      await supabase.auth
        .signOut()

      setPassword(
        '',
      )

      setNewPassword(
        '',
      )

      setConfirmPassword(
        '',
      )

      setMode(
        'login',
      )

      navigate(
        '/login',
        {
          replace:
            true,
        },
      )

      setSuccessMessage(
        'Senha atualizada. Entre com a nova senha.',
      )
    } catch {
      setError(
        'Não foi possível atualizar a senha. Solicite um novo link de recuperação.',
      )
    } finally {
      setLoading(
        false,
      )
    }
  }

  return (
    <main className="login-page">
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
            <div className="login-brand__text">
              <strong>
                Haras Hollanda
              </strong>

              <span>
                Gestão equestre
              </span>
            </div>
          </div>

          {mode ===
            'login' && (
            <>
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
                  handleLoginSubmit
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
                  <div className="login-field__header">
                    <label htmlFor="password">
                      Senha
                    </label>

                    <button
                      className="login-link-button"
                      type="button"
                      disabled={
                        loading
                      }
                      onClick={
                        showForgotPassword
                      }
                    >
                      Esqueci minha senha
                    </button>
                  </div>

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

                {successMessage && (
                  <p
                    className="login-success"
                    role="status"
                    aria-live="polite"
                  >
                    {
                      successMessage
                    }
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
            </>
          )}

          {mode ===
            'forgot' && (
            <>
              <header className="login-header">
                <span className="login-header__eyebrow">
                  Recuperação de acesso
                </span>

                <h1>
                  Recuperar senha
                </h1>

                <p>
                  Informe o e-mail da conta administrativa. Você receberá um link
                  para definir uma nova senha.
                </p>
              </header>

              <form
                className="login-form"
                onSubmit={
                  handleRecoverySubmit
                }
              >
                <div className="login-field">
                  <label htmlFor="recoveryEmail">
                    E-mail
                  </label>

                  <input
                    id="recoveryEmail"
                    name="recoveryEmail"
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

                {error && (
                  <p
                    className="login-error"
                    role="alert"
                    aria-live="polite"
                  >
                    {error}
                  </p>
                )}

                {successMessage && (
                  <p
                    className="login-success"
                    role="status"
                    aria-live="polite"
                  >
                    {
                      successMessage
                    }
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
                      ? 'Enviando...'
                      : 'Enviar link'}
                  </span>

                  <span
                    className="login-submit__arrow"
                    aria-hidden="true"
                  >
                    →
                  </span>
                </button>

                <button
                  className="login-secondary"
                  type="button"
                  disabled={
                    loading
                  }
                  onClick={
                    showLogin
                  }
                >
                  Voltar para o login
                </button>
              </form>
            </>
          )}

          {mode ===
            'reset' && (
            <>
              <header className="login-header">
                <span className="login-header__eyebrow">
                  Recuperação de acesso
                </span>

                <h1>
                  Nova senha
                </h1>

                <p>
                  Defina uma nova senha para a conta administrativa.
                </p>
              </header>

              <form
                className="login-form"
                onSubmit={
                  handlePasswordResetSubmit
                }
              >
                <div className="login-field">
                  <label htmlFor="newPassword">
                    Nova senha
                  </label>

                  <input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    value={
                      newPassword
                    }
                    onChange={(
                      event,
                    ) =>
                      setNewPassword(
                        event.target.value,
                      )
                    }
                    placeholder="Digite a nova senha"
                    autoComplete="new-password"
                    disabled={
                      loading
                    }
                    required
                  />
                </div>

                <div className="login-field">
                  <label htmlFor="confirmPassword">
                    Confirmar senha
                  </label>

                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={
                      confirmPassword
                    }
                    onChange={(
                      event,
                    ) =>
                      setConfirmPassword(
                        event.target.value,
                      )
                    }
                    placeholder="Digite novamente"
                    autoComplete="new-password"
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
                      ? 'Atualizando...'
                      : 'Atualizar senha'}
                  </span>

                  <span
                    className="login-submit__arrow"
                    aria-hidden="true"
                  >
                    →
                  </span>
                </button>

                <button
                  className="login-secondary"
                  type="button"
                  disabled={
                    loading
                  }
                  onClick={
                    showLogin
                  }
                >
                  Voltar para o login
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </main>
  )
}
