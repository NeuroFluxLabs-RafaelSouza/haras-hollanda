import { Route, Routes } from 'react-router-dom'

import { NewHorsesPage } from './features/horses/NewHorsesPage.tsx'
import { Sidebar } from './components/layout/Sidebar.tsx'
import { Dashboard } from './features/dashboard/Dashboard.tsx'
import { HorsesPage } from './features/horses/HorsesPage.tsx'

import './App.css'



function App() {
  return (
    <div className="app">
      <Sidebar />

      <main className="app__content">
        <Routes>
          <Route
            path="/"
            element={
              <>
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
              </>
            }
          />

          <Route path="/cavalos" element={<HorsesPage />} />
          <Route path="/cavalos/novo" element={<NewHorsesPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App