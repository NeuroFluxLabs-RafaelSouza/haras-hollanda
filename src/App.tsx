import { Route, Routes } from 'react-router-dom'

import { AppLayout } from './components/layout/AppLayout.tsx'

import { LoginPage } from './features/auth/LoginPage.tsx'
import { ProtectedRoute } from './features/auth/ProtectedRoute.tsx'
import { DashboardPage } from './features/dashboard/DashboardPage.tsx'
import { HorsesPage } from './features/horses/HorsesPage.tsx'
import { NewHorsesPage } from './features/horses/NewHorsesPage.tsx'

import './App.css'

function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={<LoginPage />}
      />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route
            path="/"
            element={<DashboardPage />}
          />

          <Route
            path="/cavalos"
            element={<HorsesPage />}
          />

          <Route
            path="/cavalos/novo"
            element={<NewHorsesPage />}
          />
        </Route>
      </Route>
    </Routes>
  )
}

export default App