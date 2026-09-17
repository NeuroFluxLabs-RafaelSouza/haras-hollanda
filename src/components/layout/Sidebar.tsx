import {
  useEffect,
  useState,
  type ReactNode,
} from 'react'

import {
  NavLink,
} from 'react-router-dom'

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

import {
  getAppSettings,
} from '../../features/settings/settingsService.ts'

import './Sidebar.css'

type SidebarProps = {
  footerAction?: ReactNode
}

const DEFAULT_HARAS_NAME =
  'Haras Hollanda'

const menuItems = [
  {
    label: 'Início',
    icon: Home,
    path: '/',
  },

  {
    label: 'Cavalos',
    icon: Stethoscope,
    path: '/cavalos',
  },

  {
    label: 'Baias',
    icon: Grid2X2,
    path: '/baias',
  },

  {
    label: 'Agenda',
    icon: CalendarDays,
    path: '/agenda',
  },

  {
    label: 'Clientes',
    icon: UsersRound,
    path: '/clientes',
  },

  {
    label: 'Estoque',
    icon: Package,
    path: '/estoque',
  },

  {
    label: 'Financeiro',
    icon: CircleDollarSign,
    path: '/financeiro',
  },

  {
    label: 'Configurações',
    icon: Settings,
    path: '/configuracoes',
  },
]

function getHarasInitials(
  harasName: string,
) {
  const words =
    harasName
      .trim()
      .split(/\s+/)
      .filter(Boolean)

  if (
    words.length ===
    0
  ) {
    return 'HH'
  }

  if (
    words.length ===
    1
  ) {
    return words[0]
      .slice(
        0,
        2,
      )
      .toUpperCase()
  }

  return `${words[0][0]}${
    words[
      words.length - 1
    ][0]
  }`.toUpperCase()
}

export function Sidebar({
  footerAction,
}: SidebarProps) {
  const [
    harasName,
    setHarasName,
  ] = useState(
    DEFAULT_HARAS_NAME,
  )

  useEffect(() => {
    let isMounted =
      true

    async function loadHarasName() {
      try {
        const settings =
          await getAppSettings()

        if (
          !isMounted
        ) {
          return
        }

        setHarasName(
          settings.harasName,
        )
      } catch {
        if (
          isMounted
        ) {
          setHarasName(
            DEFAULT_HARAS_NAME,
          )
        }
      }
    }

    loadHarasName()

    return () => {
      isMounted =
        false
    }
  }, [])

  const harasInitials =
    getHarasInitials(
      harasName,
    )

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <div className="sidebar__brand-mark">
          {harasInitials}
        </div>

        <div>
          <strong>
            {harasName}
          </strong>

          <span>
            Gestão equestre
          </span>
        </div>
      </div>

      <nav className="sidebar__nav">
        {menuItems.map(
          ({
            label,
            icon: Icon,
            path,
          }) => (
            <NavLink
              key={label}
              to={path}
              end={
                path ===
                '/'
              }
              className={({
                isActive,
              }: {
                isActive: boolean
              }) =>
                `sidebar__item ${
                  isActive
                    ? 'sidebar__item--active'
                    : ''
                }`
              }
            >
              <Icon
                size={18}
                strokeWidth={
                  1.8
                }
              />

              <span>
                {label}
              </span>
            </NavLink>
          ),
        )}
      </nav>

      <div className="sidebar__bottom">
        <div className="sidebar__footer">
          <UserRound
            size={16}
          />

          <div>
            <strong>
              1 administrador
            </strong>

            <span>
              23 baias
            </span>
          </div>
        </div>

        {footerAction}
      </div>
    </aside>
  )
}