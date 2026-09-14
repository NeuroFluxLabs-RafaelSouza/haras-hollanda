import {
  Navigate,
  Route,
  Routes,
} from 'react-router-dom'

import {
  AppLayout,
} from './components/layout/AppLayout.tsx'

import {
  AgendaPage,
} from './features/agenda/AgendaPage.tsx'

import {
  EditAppointmentPage,
} from './features/agenda/EditAppointmentPage.tsx'

import {
  NewAppointmentPage,
} from './features/agenda/NewAppointmentPage.tsx'

import {
  NewProfessionalPage,
} from './features/agenda/NewProfessionalPage.tsx'

import {
  ProfessionalsPage,
} from './features/agenda/ProfessionalsPage.tsx'

import {
  LoginPage,
} from './features/auth/LoginPage.tsx'

import {
  ProtectedRoute,
} from './features/auth/ProtectedRoute.tsx'

import {
  ClientsPage,
} from './features/clients/ClientsPage.tsx'

import {
  NewClientPage,
} from './features/clients/NewClientPage.tsx'

import {
  DashboardPage,
} from './features/dashboard/DashboardPage.tsx'

import {
  DailyFeedingPage,
} from './features/feeding/DailyFeedingPage.tsx'

import {
  FeedingPlanPage,
} from './features/feeding/FeedingPlanPage.tsx'

import {
  FinancePage,
} from './features/finance/FinancePage.tsx'

import {
  HorsesPage,
} from './features/horses/HorsesPage.tsx'

import {
  NewHorsesPage,
} from './features/horses/NewHorsesPage.tsx'

import {
  InventoryMovementPage,
} from './features/inventory/InventoryMovementPage.tsx'

import {
  InventoryPage,
} from './features/inventory/InventoryPage.tsx'

import {
  InventoryPurchasePage,
} from './features/inventory/InventoryPurchasePage.tsx'

import {
  NewProductPage,
} from './features/inventory/NewProductPage.tsx'

import {
  ProductsPage,
} from './features/inventory/ProductsPage.tsx'

import {
  SettingsPage,
} from './features/settings/SettingsPage.tsx'

import {
  ManageStallPage,
} from './features/stalls/ManageStallPage.tsx'

import {
  NewStallPage,
} from './features/stalls/NewStallPage.tsx'

import {
  StallsPage,
} from './features/stalls/StallsPage.tsx'

import './App.css'

function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={<LoginPage />}
      />

      <Route
        element={<ProtectedRoute />}
      >
        <Route
          element={<AppLayout />}
        >
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
            path="/cavalos/alimentacao-hoje"
            element={<DailyFeedingPage />}
          />

          <Route
            path="/cavalos/:horseId/alimentacao"
            element={<FeedingPlanPage />}
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
            path="/agenda/novo"
            element={<NewAppointmentPage />}
          />

          <Route
            path="/agenda/:appointmentId/editar"
            element={<EditAppointmentPage />}
          />

          <Route
            path="/agenda/profissionais"
            element={<ProfessionalsPage />}
          />

          <Route
            path="/agenda/profissionais/novo"
            element={<NewProfessionalPage />}
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
            path="/estoque/compra"
            element={<InventoryPurchasePage />}
          />

          <Route
            path="/estoque/produtos"
            element={<ProductsPage />}
          />

          <Route
            path="/estoque/produtos/novo"
            element={<NewProductPage />}
          />

          <Route
            path="/estoque/novo"
            element={
              <Navigate
                to="/estoque/produtos/novo"
                replace
              />
            }
          />

          <Route
            path="/estoque/:itemId/movimentar"
            element={<InventoryMovementPage />}
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