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
  { label: 'Início', icon: Home },
  { label: 'Cavalos', icon: Stethoscope },
  { label: 'Baias', icon: Grid2X2 },
  { label: 'Agenda', icon: CalendarDays },
  { label: 'Clientes', icon: UsersRound },
  { label: 'Estoque', icon: Package },
  { label: 'Financeiro', icon: CircleDollarSign },
  { label: 'Configurações', icon: Settings },
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
        {menuItems.map(({ label, icon: Icon }, index) => (
          <button
            key={label}
            className={`sidebar__item ${
              index === 0 ? 'sidebar__item--active' : ''
            }`}
            type="button"
          >
            <Icon size={18} strokeWidth={1.8} />
            <span>{label}</span>
          </button>
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