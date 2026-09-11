import { Sidebar } from './components/layout/Sidebar.tsx'
import './App.css'
import { Dashboard } from './features/dashboard/Dashboard.tsx'

function App() {
  return (
    <div className="app">
      <Sidebar />

      <main className="app__content">
        <header className="page-header">
          <p className="page-header__eyebrow">Gestão equestre</p>

          <h1 className="page-header__title">
            Haras Hollanda
          </h1>

          <p className="page-header__description">
            Visão geral da operação do haras.
          </p>
        </header>

        <Dashboard />
      </main>
    </div>
  )
}

export default App