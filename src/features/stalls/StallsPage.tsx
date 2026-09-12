import { useEffect, useState } from 'react'

import type { Stall } from '../../domain/stall.ts'
import { getStalls } from './stallsService.ts'

export function StallsPage() {
  const [stalls, setStalls] = useState<Stall[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadStalls() {
      try {
        const data = await getStalls()

        if (isMounted) {
          setStalls(data)
        }
      } catch (error) {
        if (isMounted) {
          const message =
            error instanceof Error
              ? error.message
              : 'Não foi possível carregar as baias.'

          setError(message)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadStalls()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <section>
      <header className="page-header">
        <p className="page-header__eyebrow">
          Gestão de ocupação
        </p>

        <h1 className="page-header__title">
          Baias
        </h1>

        <p className="page-header__description">
          Acompanhe a ocupação e disponibilidade das baias do haras.
        </p>
      </header>

      {loading && (
        <p>
          Carregando baias...
        </p>
      )}

      {error && (
        <p>
          {error}
        </p>
      )}

      {!loading && !error && stalls.length === 0 && (
        <p>
          Nenhuma baia cadastrada.
        </p>
      )}

      {!loading && !error && stalls.length > 0 && (
        <div>
          {stalls.map((stall) => (
            <article key={stall.id}>
              <h2>{stall.name}</h2>

              <p>
                {stall.active ? 'Ativa' : 'Inativa'}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}