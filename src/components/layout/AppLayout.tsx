import { Outlet } from 'react-router-dom'

import { LogoutButton } from '../../features/auth/LogoutButton.tsx'
import { MobileBottomNav } from './MobileBottomNav.tsx'
import { Sidebar } from './Sidebar.tsx'

export function AppLayout() {
  return (
    <div className="app">
      <Sidebar
        footerAction={<LogoutButton />}
      />

      <main className="app__content">
        <Outlet />
      </main>

      <MobileBottomNav
        footerAction={<LogoutButton />}
      />
    </div>
  )
}