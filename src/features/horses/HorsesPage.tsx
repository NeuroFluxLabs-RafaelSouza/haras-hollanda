import { Link } from 'react-router-dom'

import { Plus, Search } from 'lucide-react'
import './HorsesPage.css'


const horses = [
  {
    name: 'Apache',
    breed: 'Quarto de Milha',
    sex: 'Macho',
    client: 'Carlos Henrique',
    stall: 'Baia 04',
    feeding: '4 kg/dia',
    feedingCost: 'R$ 16/dia',
    status: 'Ativo',
  },
  {
    name: 'Luna',
    breed: 'Mangalarga',
    sex: 'Fêmea',
    client: 'Mariana Lopes',
    stall: 'Baia 08',
    feeding: '3 kg/dia',
    feedingCost: 'R$ 12/dia',
    status: 'Ativo',
  },
  {
    name: 'Imperador',
    breed: 'Campolina',
    sex: 'Macho',
    client: 'Ricardo Almeida',
    stall: 'Baia 12',
    feeding: '5 kg/dia',
    feedingCost: 'R$ 20/dia',
    status: 'Ativo',
  },
]

export function HorsesPage() {
  return (
  <section className="horses-page">
    <header className="page-header">
      <p className="page-header__eyebrow">Gestão de animais</p>

      <h1 className="page-header__title">Cavalos</h1>

      <p className="page-header__description">
        Acompanhe os cavalos hospedados, responsáveis, baias e alimentação.
      </p>
    </header>

    <div className="horses-toolbar">
  <span className="horses-toolbar__count">
    {horses.length} cavalos cadastrados
  </span>

  <div className="horses-toolbar__actions">
    <label className="horses-search">
      <Search size={17} />

      <input
        type="search"
        placeholder="Buscar cavalo..."
      />
    </label>

    <Link
  className="horses-add-button"
  to="/cavalos/novo"
    >
     <Plus size={17} />
    Novo cavalo
    </Link>

  </div>
</div>

    <div className="horses-grid">
      {horses.map((horse) => (
        <article className="horse-card" key={horse.name}>
          <div className="horse-card__top">
            <div>
              <h2 className="horse-card__name">
                {horse.name}
              </h2>

              <p className="horse-card__meta">
                {horse.breed} · {horse.sex}
              </p>
            </div>

            <span className="horse-card__status">
              {horse.status}
            </span>
          </div>

          <div className="horse-card__details">
            <div className="horse-card__detail">
              <span>Cliente</span>
              <strong>{horse.client}</strong>
            </div>

            <div className="horse-card__detail">
              <span>Baia</span>
              <strong>{horse.stall}</strong>
            </div>
          </div>

          <div className="horse-card__feeding">
            <span>Alimentação diária</span>

            <strong>
              {horse.feeding} · {horse.feedingCost}
            </strong>
          </div>
        </article>
      ))}
    </div>
  </section>
)
}