import {
  useEffect,
  useState,
  type ReactNode,
} from 'react'

import {
  NavLink,
  useLocation,
} from 'react-router-dom'

import {
  CalendarDays,
  CircleDollarSign,
  Grid2X2,
  Home,
  Menu,
  Package,
  Settings,
  Stethoscope,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react'

import {
  APP_SETTINGS_UPDATED_EVENT,
  getAppSettings,
  getHarasLogoUrl,
} from '../../features/settings/settingsService.ts'

import './Sidebar.css'

type SidebarProps = {
  footerAction?: ReactNode
}

const DEFAULT_HARAS_NAME = 'Haras Hollanda'
const COMPACT_NAV_MEDIA_QUERY = '(max-width: 1100px)'

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

function getHarasInitials(harasName: string) {
  const words = harasName
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (words.length === 0) {
    return 'HH'
  }

  if (words.length === 1) {
    return words[0]
      .slice(0, 2)
      .toUpperCase()
  }

  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase()
}

export function Sidebar({
  footerAction,
}: SidebarProps) {
  const location = useLocation()

  const [harasName, setHarasName] = useState(
    DEFAULT_HARAS_NAME,
  )

  const [logoUrl, setLogoUrl] = useState<string | null>(
    null,
  )

  const [isMobileOpen, setIsMobileOpen] = useState(
    false,
  )

  useEffect(() => {
    let isMounted = true

    async function loadIdentity() {
      try {
        const settings = await getAppSettings()
        const currentLogoUrl = await getHarasLogoUrl(
          settings.logoPath,
        )

        if (!isMounted) {
          return
        }

        setHarasName(settings.harasName)
        setLogoUrl(currentLogoUrl)
      } catch {
        if (!isMounted) {
          return
        }

        setHarasName(DEFAULT_HARAS_NAME)
        setLogoUrl(null)
      }
    }

    function handleSettingsUpdated() {
      loadIdentity()
    }

    loadIdentity()

    window.addEventListener(
      APP_SETTINGS_UPDATED_EVENT,
      handleSettingsUpdated,
    )

    return () => {
      isMounted = false

      window.removeEventListener(
        APP_SETTINGS_UPDATED_EVENT,
        handleSettingsUpdated,
      )
    }
  }, [])

  useEffect(() => {
    setIsMobileOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!isMobileOpen) {
      return
    }

    const previousOverflow = document.body.style.overflow

    document.body.style.overflow = 'hidden'

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsMobileOpen(false)
      }
    }

    function handleViewportChange() {
      if (!window.matchMedia(COMPACT_NAV_MEDIA_QUERY).matches) {
        setIsMobileOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('resize', handleViewportChange)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('resize', handleViewportChange)
    }
  }, [isMobileOpen])

  const harasInitials = getHarasInitials(harasName)

  return (
    <>
      <button
        type="button"
        className={`sidebar-toggle ${
          isMobileOpen
            ? 'sidebar-toggle--open'
            : ''
        }`}
        aria-label="Abrir menu de navegação"
        aria-controls="app-sidebar"
        aria-expanded={isMobileOpen}
        onClick={() => setIsMobileOpen(true)}
      >
        <Menu
          size={22}
          strokeWidth={1.8}
        />
      </button>

      <button
        type="button"
        className={`sidebar-backdrop ${
          isMobileOpen
            ? 'sidebar-backdrop--visible'
            : ''
        }`}
        aria-label="Fechar menu de navegação"
        tabIndex={isMobileOpen ? 0 : -1}
        onClick={() => setIsMobileOpen(false)}
      />

      <aside
        id="app-sidebar"
        className={`sidebar ${
          isMobileOpen
            ? 'sidebar--open'
            : ''
        }`}
      >
        <div className="sidebar__top">
          <div className="sidebar__brand">
            <div className="sidebar__brand-mark">
              {logoUrl ? (
                <img
                  className="sidebar__brand-logo"
                  src={logoUrl}
                  alt={`Logo de ${harasName}`}
                />
              ) : (
                harasInitials
              )}
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

          <button
            type="button"
            className="sidebar__close"
            aria-label="Fechar menu"
            onClick={() => setIsMobileOpen(false)}
          >
            <X
              size={20}
              strokeWidth={1.8}
            />
          </button>
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
                end={path === '/'}
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
                  strokeWidth={1.8}
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
            <UserRound size={16} />

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
    </>
  )
}
