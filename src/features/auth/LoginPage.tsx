import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { supabase } from '../../lib/supabase'
import './LoginPage.css'

export function LoginPage() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setError('')
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (error) {
      setError('E-mail ou senha inválidos.')
      return
    }

    navigate('/')
  }

  return (
  <main className="login-page">
    <section className="login-card">
      <div className="login-brand">
        <div className="login-brand__mark">
          HH
        </div>

        <div className="login-brand__text">
          <strong>Haras Hollanda</strong>
          <span>Gestão equestre</span>
        </div>
      </div>

      <header className="login-header">
        <h1>Bem-vindo</h1>

        <p>
          Entre com sua conta administrativa para acessar a gestão do haras.
        </p>
      </header>

      <form
        className="login-form"
        onSubmit={handleSubmit}
      >
        <div className="login-field">
          <label htmlFor="email">
            E-mail
          </label>

          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="seu@email.com"
            required
          />
        </div>

        <div className="login-field">
          <label htmlFor="password">
            Senha
          </label>

          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Digite sua senha"
            required
          />
        </div>

        {error && (
          <p className="login-error">
            {error}
          </p>
        )}

        <button
          className="login-submit"
          type="submit"
          disabled={loading}
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </section>
  </main>
)
}