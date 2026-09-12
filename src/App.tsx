import { Route, Routes } from 'react-router-dom'

import { AppLayout } from './components/layout/AppLayout.tsx'

import { AgendaPage } from './features/agenda/AgendaPage.tsx'
import { LoginPage } from './features/auth/LoginPage.tsx'
import { ProtectedRoute } from './features/auth/ProtectedRoute.tsx'
import { ClientsPage } from './features/clients/ClientsPage.tsx'
import { NewClientPage } from './features/clients/NewClientPage.tsx'
import { DashboardPage } from './features/dashboard/DashboardPage.tsx'
import { FinancePage } from './features/finance/FinancePage.tsx'
import { HorsesPage } from './features/horses/HorsesPage.tsx'
import { NewHorsesPage } from './features/horses/NewHorsesPage.tsx'
import { InventoryPage } from './features/inventory/InventoryPage.tsx'
import { SettingsPage } from './features/settings/SettingsPage.tsx'
import { ManageStallPage } from './features/stalls/ManageStallPage.tsx'
import { NewStallPage } from './features/stalls/NewStallPage.tsx'
import { StallsPage } from './features/stalls/StallsPage.tsx'

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

          <Route
            path="/baias"
            element={<StallsPage />}
          />

          <Route
            path="/baias/nova"
            element={<NewStallPage />}
          />

          <Route
            path="/baias/:stallId/gerenciar"
            element={<ManageStallPage />}
          />

          <Route
            path="/agenda"
            element={<AgendaPage />}
          />

          <Route
            path="/clientes"
            element={<ClientsPage />}
          />

          <Route
            path="/clientes/novo"
            element={<NewClientPage />}
          />

          <Route
            path="/estoque"
            element={<InventoryPage />}
          />

          <Route
            path="/financeiro"
            element={<FinancePage />}
          />

          <Route
            path="/configuracoes"
            element={<SettingsPage />}
          />
        </Route>
      </Route>
    </Routes>
  )
}

export default App