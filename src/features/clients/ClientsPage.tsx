import { useEffect, useState } from 'react'
import { Mail, Phone, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'

import type { Client } from '../../domain/client'
import { getClients } from './clientsService'

import './ClientsPage.css'

export function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadClients() {
      try {
        const data = await getClients()

        if (isMounted) {
          setClients(data)
        }
      } catch (error) {
        if (isMounted) {
          const message =
            error instanceof Error
              ? error.message
              : 'Não foi possível carregar os clientes.'

          setError(message)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadClients()

    return () => {
      isMounted = false
    }
  }, [])

  const clientCountLabel =
    clients.length === 1
      ? '1 cliente cadastrado'
      : `${clients.length} clientes cadastrados`

  return (
    <section className="clients-page">
      <header className="page-header">
        <p className="page-header__eyebrow">
          Relacionamento
        </p>

        <h1 className="page-header__title">
          Clientes
        </h1>

        <p className="page-header__description">
          Gerencie responsáveis, contatos e vínculos com os cavalos do haras.
        </p>
      </header>

      <div className="clients-toolbar">
        <span className="clients-toolbar__count">
          {clientCountLabel}
        </span>

        <Link
          className="clients-add-button"
          to="/clientes/novo"
        >
          <Plus size={17} />
          Novo cliente
        </Link>
      </div>

      {loading && (
        <div className="clients-state">
          Carregando clientes...
        </div>
      )}

      {error && (
        <div className="clients-state clients-state--error">
          {error}
        </div>
      )}

      {!loading && !error && clients.length === 0 && (
        <div className="clients-empty">
          <strong>Nenhum cliente cadastrado</strong>

          <span>
            Cadastre o primeiro cliente para começar a vincular cavalos e
            responsabilidades financeiras.
          </span>

          <Link
            className="clients-add-button"
            to="/clientes/novo"
          >
            <Plus size={17} />
            Novo cliente
          </Link>
        </div>
      )}

      {!loading && !error && clients.length > 0 && (
        <div className="clients-grid">
          {clients.map((client) => (
            <article
              className="client-card"
              key={client.id}
            >
              <div className="client-card__header">
                <div>
                  <h2 className="client-card__name">
                    {client.name}
                  </h2>

                  <span className="client-card__type">
                    Responsável
                  </span>
                </div>

                <span
                  className={
                    client.active
                      ? 'client-card__status'
                      : 'client-card__status client-card__status--inactive'
                  }
                >
                  {client.active ? 'Ativo' : 'Inativo'}
                </span>
              </div>

              <div className="client-card__contacts">
                <div className="client-card__contact">
                  <Phone size={16} strokeWidth={1.8} />

                  <span>
                    {client.phone ?? 'Telefone não informado'}
                  </span>
                </div>

                <div className="client-card__contact">
                  <Mail size={16} strokeWidth={1.8} />

                  <span>
                    {client.email ?? 'E-mail não informado'}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}