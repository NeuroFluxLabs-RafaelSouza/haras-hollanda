import { Dashboard } from './Dashboard.tsx'

export function DashboardPage() {
  return (
    <>
      <header className="page-header">
        <p className="page-header__eyebrow">
          Gestão equestre
        </p>

        <h1 className="page-header__title">
          Haras Hollanda
        </h1>

        <p className="page-header__description">
          Visão geral da operação do haras.
        </p>
      </header>

      <Dashboard />
    </>
  )
}