import { Route, Routes, useLocation } from 'react-router-dom'

import { NewHorsesPage } from './features/horses/NewHorsesPage.tsx'
import { Sidebar } from './components/layout/Sidebar.tsx'
import { Dashboard } from './features/dashboard/Dashboard.tsx'
import { HorsesPage } from './features/horses/HorsesPage.tsx'
import { LoginPage } from './features/auth/LoginPage.tsx'

import './App.css'



function App() {
  const location = useLocation()
const isLoginPage = location.pathname === '/login'
  return (
    <div className="app">
     {!isLoginPage && <Sidebar />}

      <main
  className={
    isLoginPage
      ? 'app__content app__content--login'
      : 'app__content'
  }
>
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
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App