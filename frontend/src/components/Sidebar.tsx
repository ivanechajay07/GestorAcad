import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { universityService } from '../services/universityService';
import { NAV_SECTIONS } from '../config/navigation';
import { GraduationCap, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

interface SidebarProps {
  collapsed?: boolean;
  mobile?: boolean;
  open?: boolean;
  onClose?: () => void;
  onToggleCollapse?: () => void;
}

interface SidebarTooltip {
  label: string;
  top: number;
  left: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed = false,
  mobile = false,
  open = false,
  onClose,
  onToggleCollapse,
}) => {
  const { hasPermission, roles } = useAuth();
  const [closedSections, setClosedSections] = useState<Record<string, boolean>>({});
  const [uniName, setUniName] = useState('');
  const [tooltip, setTooltip] = useState<SidebarTooltip | null>(null);

  useEffect(() => {
    let mounted = true;
    universityService
      .getActiveUniversity()
      .then((res) => {
        if (mounted && res.success && res.data) {
          setUniName(res.data.name || res.data.shortName || '');
        }
      })
      .catch(() => undefined);
    return () => {
      mounted = false;
    };
  }, []);

  const hasAnyRole = (...allowed: string[]) => roles.some((r) => allowed.includes(r));

  const visibleSections = NAV_SECTIONS
    .map((sec) => ({
      ...sec,
      items: sec.items.filter((item) => {
        if (item.permission && !hasPermission(item.permission)) return false;
        if (item.anyPermission && !item.anyPermission.some((permission) => hasPermission(permission))) return false;
        if (item.roles && !hasAnyRole(...item.roles)) return false;
        return true;
      }),
    }))
    .filter((sec) => sec.items.length > 0);

  const filteredSections = visibleSections;

  const toggleSection = (title: string) => {
    setClosedSections((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  useEffect(() => {
    setTooltip(null);
  }, [collapsed, mobile]);

  const showTooltip = (target: HTMLElement, label: string) => {
    if (!collapsed || mobile) return;
    const rect = target.getBoundingClientRect();
    setTooltip({
      label,
      top: rect.top + rect.height / 2,
      left: rect.right + 12,
    });
  };

  const asideClass = [
    'app-sidebar',
    mobile ? 'app-sidebar--mobile' : '',
    mobile && open ? 'app-sidebar--open' : '',
    collapsed && !mobile ? 'app-sidebar--collapsed' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      {mobile && open && <div className="app-sidebar-backdrop" onClick={onClose} aria-hidden="true" />}
      <aside
        className={asideClass}
        style={mobile ? undefined : { width: collapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)' }}
        onScroll={() => setTooltip(null)}
      >
        <div className="sidebar-inner">
          {/* Marca institucional */}
          <div className="sidebar-brand">
            <span className="sidebar-brand-logo">
              <GraduationCap size={21} />
            </span>
            {(!collapsed || mobile) && (
              <div className="sidebar-brand-text">
                <strong>GESTOR ACADÉMICO <span>VIRTUAL</span></strong>
                <small title={uniName || 'Portal académico'}>{uniName || 'Portal académico'}</small>
              </div>
            )}
          </div>

          <div className="sidebar-nav">
            {filteredSections.map((sec) => {
              const isClosed = closedSections[sec.title];
              return (
                <div className="nav-section" key={sec.title}>
                  {!collapsed ? (
                    <button
                      type="button"
                      className="nav-section-title"
                      onClick={() => toggleSection(sec.title)}
                      aria-expanded={!isClosed}
                    >
                      <span>{sec.title}</span>
                      <ChevronDown size={14} className={`nav-chevron${isClosed ? ' closed' : ''}`} />
                    </button>
                  ) : (
                    <div className="nav-section-divider" />
                  )}
                  <nav className={`nav-list${isClosed ? ' is-collapsed' : ''}`}>
                    {sec.items.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        aria-label={collapsed && !mobile ? item.label : undefined}
                        onClick={mobile ? onClose : undefined}
                        onMouseEnter={(event) => showTooltip(event.currentTarget, item.label)}
                        onMouseLeave={() => setTooltip(null)}
                        onFocus={(event) => showTooltip(event.currentTarget, item.label)}
                        onBlur={() => setTooltip(null)}
                        className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                        style={{
                          justifyContent: collapsed && !mobile ? 'center' : 'space-between',
                          padding: collapsed && !mobile ? '11px' : '10px 12px',
                        }}
                      >
                        {({ isActive }) => (
                          <>
                            <span className="nav-icon">{item.icon}</span>
                            {(!collapsed || mobile) && <span className="nav-label">{item.label}</span>}
                            {(!collapsed || mobile) && item.badge && (
                              <span className={`nav-badge${isActive ? ' on-active' : ''}`}>{item.badge}</span>
                            )}
                          </>
                        )}
                      </NavLink>
                    ))}
                  </nav>
                </div>
              );
            })}
          </div>
        </div>

        {!mobile && onToggleCollapse && (
          <button
            type="button"
            className="sidebar-edge-toggle"
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expandir menú' : 'Contraer menú'}
            title={collapsed ? 'Expandir menú' : 'Contraer menú'}
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        )}
      </aside>

      {tooltip && typeof document !== 'undefined' && createPortal(
        <div
          className="nav-tooltip"
          role="tooltip"
          style={{ top: tooltip.top, left: tooltip.left }}
        >
          {tooltip.label}
        </div>,
        document.body
      )}
    </>
  );
};
