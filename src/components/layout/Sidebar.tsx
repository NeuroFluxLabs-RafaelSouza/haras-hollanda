import { NavLink } from 'react-router-dom'

import {
  CalendarDays,
  CircleDollarSign,
  Grid2X2,
  Home,
  Package,
  Settings,
  Stethoscope,
  UserRound,
  UsersRound,
} from 'lucide-react'


import './Sidebar.css'

const menuItems = [
  { label: 'Início', icon: Home, path: '/' },
  { label: 'Cavalos', icon: Stethoscope, path: '/cavalos' },
  { label: 'Baias', icon: Grid2X2, path: '/baias' },
  { label: 'Agenda', icon: CalendarDays, path: '/agenda' },
  { label: 'Clientes', icon: UsersRound, path: '/clientes' },
  { label: 'Estoque', icon: Package, path: '/estoque' },
  { label: 'Financeiro', icon: CircleDollarSign, path: '/financeiro' },
  { label: 'Configurações', icon: Settings, path: '/configuracoes' },
]

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <div className="sidebar__brand-mark">HH</div>

        <div>
          <strong>Haras Hollanda</strong>
          <span>Gestão equestre</span>
        </div>
      </div>

      <nav className="sidebar__nav">
        {menuItems.map(({ label, icon: Icon, path }) => (
  <NavLink
    key={label}
    to={path}
    end={path === '/'}
    className={({ isActive }: { isActive: boolean }) =>
  `sidebar__item ${
    isActive ? 'sidebar__item--active' : ''
  }`
}
  >
    <Icon size={18} strokeWidth={1.8} />
    <span>{label}</span>
  </NavLink>
))}
      </nav>

      <div className="sidebar__footer">
        <UserRound size={16} />

        <div>
          <strong>1 administrador</strong>
          <span>23 baias</span>
        </div>
      </div>
    </aside>
  )
}