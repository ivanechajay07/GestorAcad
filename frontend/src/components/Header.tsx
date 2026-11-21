import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { NAV_SECTIONS } from '../config/navigation';
import { ThemeToggle } from './ui/ThemeToggle';
import { NotificationBell } from './NotificationBell';
import {
  Search,
  LogOut,
  ChevronDown,
  ChevronRight,
  Menu,
  UserRound,
  CornerDownLeft,
  Sun,
  Moon,
  Sparkles,
} from 'lucide-react';

interface HeaderProps {
  onToggleSidebar?: () => void;
}

const ROLE_LABELS: Record<string, string> = {
  ROLE_UNIVERSIDAD: 'Universidad',
  ROLE_DOCENTE: 'Docente',
  ROLE_ESTUDIANTE: 'Estudiante',
};

const normalize = (value: string): string =>
  value
    .toLocaleLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { user, roles, logout, hasPermission, hasAnyRole } = useAuth();
  const { mode, toggle: toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const paletteInputRef = useRef<HTMLInputElement>(null);
  const palettePanelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const userTriggerRef = useRef<HTMLButtonElement>(null);
  const userMenuFirstRef = useRef<HTMLAnchorElement>(null);

  const primaryRole = roles.find((role) => role === 'ROLE_UNIVERSIDAD') ?? roles[0];
  const roleLabel = ROLE_LABELS[primaryRole ?? ''] ?? 'Usuario';

  const accessibleItems = NAV_SECTIONS.flatMap((section) =>
    section.items
      .filter((item) => {
        if (item.permission && !hasPermission(item.permission)) return false;
        if (item.anyPermission && !item.anyPermission.some((permission) => hasPermission(permission))) {
          return false;
        }
        if (item.roles && !item.roles.some((role) => roles.includes(role))) return false;
        return true;
      })
      .map((item) => ({ ...item, section: section.title }))
  );

  const query = normalize(paletteQuery.trim());
  const results = accessibleItems.filter(
    (item) => !query || normalize(`${item.label} ${item.section}`).includes(query)
  );

  const closeAll = () => {
    setShowUserMenu(false);
  };

  const openPalette = () => {
    setPaletteQuery('');
    setPaletteOpen(true);
  };

  const closePalette = () => {
    setPaletteOpen(false);
    setPaletteQuery('');
    triggerRef.current?.focus();
  };

  const goTo = (to: string) => {
    setPaletteOpen(false);
    setPaletteQuery('');
    navigate(to);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLocaleLowerCase() === 'k') {
        event.preventDefault();
        setPaletteQuery('');
        setPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (!paletteOpen) return;
    const id = window.setTimeout(() => paletteInputRef.current?.focus(), 20);
    return () => window.clearTimeout(id);
  }, [paletteOpen]);

  useEffect(() => {
    setActiveIndex(0);
  }, [paletteQuery, paletteOpen]);

  useEffect(() => {
    if (!showUserMenu) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!userMenuRef.current?.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setShowUserMenu(false);
        userTriggerRef.current?.focus();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    const focusTimer = window.setTimeout(() => userMenuFirstRef.current?.focus(), 30);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showUserMenu]);

  const handleUserMenuKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    const items = Array.from(
      userMenuRef.current?.querySelectorAll<HTMLElement>(
        '[role="menuitem"], [role="menuitemcheckbox"]'
      ) ?? []
    );
    if (items.length === 0) return;
    event.preventDefault();
    const current = items.indexOf(document.activeElement as HTMLElement);
    let next = 0;
    if (event.key === 'End') next = items.length - 1;
    else if (event.key === 'ArrowDown') next = current < 0 ? 0 : (current + 1) % items.length;
    else if (event.key === 'ArrowUp') next = current <= 0 ? items.length - 1 : current - 1;
    items[next]?.focus();
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
      closeAll();
    }
  };

  const initials = user?.fullName
    ? user.fullName.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
    : 'U';

  const avatarNode = user?.avatar ? (
    <img src={user.avatar} alt={user.fullName} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
  ) : (
    initials
  );

  const handleDialogKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closePalette();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusables = palettePanelRef.current?.querySelectorAll<HTMLElement>('input, button');
    if (!focusables || focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const handlePaletteKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, Math.max(results.length - 1, 0)));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const target = results[activeIndex];
      if (target) goTo(target.to);
    }
  };

  return (
    <>
      <header className="app-header" style={{ backgroundColor: 'var(--header-bg)' }}>
        <div className="header-left">
          <button
            className="icon-button header-menu-btn"
            onClick={onToggleSidebar}
            title="Alternar menú lateral"
            aria-label="Alternar menú lateral"
          >
            <Menu size={20} />
          </button>

          <button
            ref={triggerRef}
            type="button"
            className="header-search-trigger"
            onClick={openPalette}
            aria-haspopup="dialog"
            aria-expanded={paletteOpen}
            aria-label="Buscar módulos o acciones Ctrl K"
            aria-keyshortcuts="Control+K Meta+K"
          >
            <Search size={16} aria-hidden="true" />
            <span>Buscar módulos o acciones</span>{' '}
            <kbd>Ctrl K</kbd>
          </button>
        </div>

        <div className="header-actions">
          <div className="header-utility-group">
            <ThemeToggle />
            <NotificationBell />
          </div>

          <div className="header-divider" />

          <div className="user-menu-root" ref={userMenuRef}>
            <button
              ref={userTriggerRef}
              className={`user-trigger${showUserMenu ? ' is-open' : ''}`}
              onClick={() => setShowUserMenu((value) => !value)}
              aria-expanded={showUserMenu}
              aria-haspopup="menu"
              aria-controls={showUserMenu ? 'user-account-menu' : undefined}
            >
              <span className="avatar user-avatar">
                {avatarNode}
                <span className="user-avatar__status" aria-hidden="true" />
              </span>
              <span className="user-meta">
                <strong>{user?.fullName || 'Usuario'}</strong>
                <small>
                  {roleLabel}
                  {user?.department ? ` · ${user.department}` : ''}
                </small>
              </span>
              <ChevronDown
                size={15}
                className={`user-trigger__chevron${showUserMenu ? ' is-open' : ''}`}
                aria-hidden="true"
              />
            </button>

            {showUserMenu && (
              <div
                id="user-account-menu"
                className="user-dropdown"
                role="menu"
                aria-label="Cuenta de usuario"
                onKeyDown={handleUserMenuKeyDown}
              >
                <div className="user-dropdown-head">
                  <span className="avatar user-avatar user-avatar--lg">
                    {avatarNode}
                    <span className="user-avatar__status" aria-hidden="true" />
                  </span>
                  <div className="user-dropdown-identity">
                    <strong>{user?.fullName || 'Usuario'}</strong>
                    <span className="user-dropdown-email">{user?.email}</span>
                    {user?.department && <span className="user-dropdown-dept">{user.department}</span>}
                    <span className="user-role-pill">{roleLabel}</span>
                  </div>
                </div>

                <div className="user-dropdown-content">
                  <div className="user-dropdown-quick">
                    <Link
                      ref={userMenuFirstRef}
                      to="/profile"
                      className="user-quick-card"
                      onClick={closeAll}
                      role="menuitem"
                    >
                      <span className="user-quick-card__icon" aria-hidden="true">
                        <UserRound size={17} />
                      </span>
                      <strong>Mi perfil</strong>
                      <small>Datos y contraseña</small>
                      <ChevronRight size={13} className="user-quick-card__chevron" aria-hidden="true" />
                    </Link>
                    <Link
                      to="/assistant"
                      className="user-quick-card"
                      onClick={closeAll}
                      role="menuitem"
                    >
                      <span className="user-quick-card__icon user-quick-card__icon--violet" aria-hidden="true">
                        <Sparkles size={17} />
                      </span>
                      <strong>Asistente</strong>
                      <small>Base de conocimiento</small>
                      <ChevronRight size={13} className="user-quick-card__chevron" aria-hidden="true" />
                    </Link>
                  </div>

                  <button
                    type="button"
                    className="user-pref-row"
                    onClick={toggleTheme}
                    role="menuitemcheckbox"
                    aria-checked={mode === 'dark'}
                  >
                    <span className="user-menu-icon" aria-hidden="true">
                      {mode === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                    </span>
                    <span className="user-menu-copy">
                      <strong>{mode === 'dark' ? 'Tema claro' : 'Tema oscuro'}</strong>
                      <small>Cambia la apariencia del panel</small>
                    </span>
                    <span className={`user-menu-switch${mode === 'dark' ? ' is-on' : ''}`} aria-hidden="true">
                      <span />
                    </span>
                  </button>

                  <div className="user-dropdown-divider" />

                  <button
                    type="button"
                    className="user-menu-item user-menu-item--danger user-logout"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    role="menuitem"
                  >
                    <span className="user-menu-icon" aria-hidden="true"><LogOut size={16} /></span>
                    <span className="user-menu-copy">
                      <strong>{isLoggingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}</strong>
                      <small>Finaliza tu sesión en este dispositivo</small>
                    </span>
                  </button>
                </div>

                <div className="user-dropdown-footer">
                  <span className="user-session-dot" aria-hidden="true" />
                  Sesión activa
                  <span className="user-dropdown-footer__role">{roleLabel}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {paletteOpen && (
        <div
          className="command-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closePalette();
          }}
        >
          <div
            ref={palettePanelRef}
            className="command-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Buscar en el sistema"
            onKeyDown={handleDialogKeyDown}
          >
            <div className="command-input-row">
              <Search size={18} aria-hidden="true" />
              <input
                ref={paletteInputRef}
                type="text"
                value={paletteQuery}
                onChange={(event) => setPaletteQuery(event.target.value)}
                onKeyDown={handlePaletteKeyDown}
                placeholder="Escribe un módulo o sección..."
                aria-label="Buscar módulos o acciones"
                role="combobox"
                aria-expanded="true"
                aria-controls="command-results"
                aria-activedescendant={results[activeIndex] ? `command-item-${activeIndex}` : undefined}
                autoComplete="off"
              />
              <kbd>Esc</kbd>
            </div>

            <div className="command-list" id="command-results" role="listbox" aria-label="Resultados de búsqueda">
              {results.map((item, index) => (
                <button
                  key={item.to}
                  id={`command-item-${index}`}
                  type="button"
                  role="option"
                  aria-selected={index === activeIndex}
                  className="command-item"
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => goTo(item.to)}
                >
                  <span className="command-item__icon" aria-hidden="true">{item.icon}</span>
                  <span className="command-item__label">{item.label}</span>
                  <span className="command-item__section">{item.section}</span>
                  {index === activeIndex && <CornerDownLeft size={14} aria-hidden="true" />}
                </button>
              ))}
              {results.length === 0 && (
                <p className="command-empty">No hay módulos que coincidan con “{paletteQuery.trim()}”.</p>
              )}
            </div>

            <div className="command-footer">
              <span><kbd>↑</kbd><kbd>↓</kbd> navegar</span>
              <span><kbd>Enter</kbd> abrir</span>
              <span><kbd>Esc</kbd> cerrar</span>
              {hasAnyRole('ROLE_UNIVERSIDAD', 'ROLE_DOCENTE', 'ROLE_ESTUDIANTE') && (
                <span style={{ marginLeft: 'auto' }}>{roles.length} rol(es) activos</span>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
