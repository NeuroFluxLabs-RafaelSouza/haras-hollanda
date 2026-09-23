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
  UsersRound,
  X,
} from 'lucide-react'

import { HorseshoeIcon } from './HorseshoeIcon.tsx'

import './MobileBottomNav.css'

type MobileBottomNavProps = {
  footerAction?: ReactNode
}

const primaryItems = [
  {
    label: 'Início',
    icon: Home,
    path: '/',
  },
  {
    label: 'Cavalos',
    icon: HorseshoeIcon,
    path: '/cavalos',
  },
  {
    label: 'Financeiro',
    icon: CircleDollarSign,
    path: '/financeiro',
  },
  {
    label: 'Agenda',
    icon: CalendarDays,
    path: '/agenda',
  },
]

const secondaryItems = [
  {
    label: 'Baias',
    icon: Grid2X2,
    path: '/baias',
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
    label: 'Configurações',
    icon: Settings,
    path: '/configuracoes',
  },
]

function isPathActive(
  pathname: string,
  path: string,
) {
  if (path === '/') {
    return pathname === '/'
  }

  return (
    pathname === path ||
    pathname.startsWith(`${path}/`)
  )
}

export function MobileBottomNav({
  footerAction,
}: MobileBottomNavProps) {
  const location = useLocation()

  const [isMenuOpen, setIsMenuOpen] = useState(
    false,
  )

  const isSecondaryRouteActive = secondaryItems.some(
    ({ path }) =>
      isPathActive(
        location.pathname,
        path,
      ),
  )

  useEffect(() => {
    setIsMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!isMenuOpen) {
      return
    }

    const previousOverflow = document.body.style.overflow

    document.body.style.overflow = 'hidden'

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsMenuOpen(false)
      }
    }

    window.addEventListener(
      'keydown',
      handleKeyDown,
    )

    return () => {
      document.body.style.overflow = previousOverflow

      window.removeEventListener(
        'keydown',
        handleKeyDown,
      )
    }
  }, [isMenuOpen])

  return (
    <>
      <button
        type="button"
        className={`mobile-nav__backdrop ${
          isMenuOpen
            ? 'mobile-nav__backdrop--visible'
            : ''
        }`}
        aria-label="Fechar menu"
        tabIndex={isMenuOpen ? 0 : -1}
        onClick={() => setIsMenuOpen(false)}
      />

      <section
        id="mobile-app-menu"
        className={`mobile-nav__sheet ${
          isMenuOpen
            ? 'mobile-nav__sheet--open'
            : ''
        }`}
        aria-hidden={!isMenuOpen}
        aria-label="Menu do Haras Hollanda"
      >
        <div className="mobile-nav__sheet-header">
          <div>
            <strong>Menu</strong>
            <span>Haras Hollanda</span>
          </div>

          <button
            type="button"
            className="mobile-nav__close"
            aria-label="Fechar menu"
            onClick={() => setIsMenuOpen(false)}
          >
            <X
              size={20}
              strokeWidth={1.8}
            />
          </button>
        </div>

        <nav className="mobile-nav__sheet-grid">
          {secondaryItems.map(({
            label,
            icon: Icon,
            path,
          }) => (
            <NavLink
              key={label}
              to={path}
              className={({ isActive }) =>
                `mobile-nav__sheet-item ${
                  isActive
                    ? 'mobile-nav__sheet-item--active'
                    : ''
                }`
              }
            >
              <span className="mobile-nav__sheet-icon">
                <Icon
                  size={21}
                  strokeWidth={1.8}
                />
              </span>

              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {footerAction ? (
          <div className="mobile-nav__sheet-footer">
            {footerAction}
          </div>
        ) : null}
      </section>

      <nav
        className="mobile-nav"
        aria-label="Navegação principal"
      >
        {primaryItems.map(({
          label,
          icon: Icon,
          path,
        }) => (
          <NavLink
            key={label}
            to={path}
            end={path === '/'}
            className={({ isActive }) =>
              `mobile-nav__item ${
                isActive
                  ? 'mobile-nav__item--active'
                  : ''
              }`
            }
          >
            <Icon
              size={21}
              strokeWidth={1.8}
            />

            <span>{label}</span>
          </NavLink>
        ))}

        <button
          type="button"
          className={`mobile-nav__item mobile-nav__menu-button ${
            isMenuOpen ||
            isSecondaryRouteActive
              ? 'mobile-nav__item--active'
              : ''
          }`}
          aria-controls="mobile-app-menu"
          aria-expanded={isMenuOpen}
          onClick={() =>
            setIsMenuOpen((current) => !current)
          }
        >
          <Menu
            size={21}
            strokeWidth={1.8}
          />

          <span>Menu</span>
        </button>
      </nav>
    </>
  )
}
