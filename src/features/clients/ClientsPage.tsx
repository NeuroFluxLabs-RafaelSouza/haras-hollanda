import { useEffect, useState } from 'react'

import type { Client } from '../../domain/client'
import { getClients } from './clientsService'

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

  return (
    <section>
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

      {loading && (
        <p>
          Carregando clientes...
        </p>
      )}

      {error && (
        <p>
          {error}
        </p>
      )}

      {!loading && !error && clients.length === 0 && (
        <p>
          Nenhum cliente cadastrado.
        </p>
      )}

      {!loading && !error && clients.length > 0 && (
        <div>
          {clients.map((client) => (
            <article key={client.id}>
              <h2>{client.name}</h2>

              <p>
                {client.phone ?? 'Telefone não informado'}
              </p>

              <p>
                {client.email ?? 'E-mail não informado'}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}