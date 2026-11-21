import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  BellOff,
  CheckCheck,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  Info,
  RefreshCw,
  X,
} from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import type { AppNotification, NotificationTone } from '../services/notificationService';
import { formatRelativeTime } from '../utils/dashboardFormatters';

const TONE_ICONS: Record<NotificationTone, React.ReactNode> = {
  advertencia: <CircleAlert size={17} aria-hidden="true" />,
  exito: <CircleCheck size={17} aria-hidden="true" />,
  info: <Info size={17} aria-hidden="true" />,
};

const TONE_LABELS: Record<NotificationTone, string> = {
  advertencia: 'Alerta',
  exito: 'Logro',
  info: 'Información',
};

type NotificationFilter = 'all' | 'unread';

const notificationClassName = (notification: AppNotification, unread: boolean): string =>
  `notif-item notif-item--${notification.tipo}${unread ? ' notif-item--unread' : ''}`;

/**
 * Campana de avisos del encabezado.
 * <p>
 * Consume avisos agregados filtrados por permisos, muestra el número real de
 * pendientes, permite marcar avisos como leídos y ofrece cierre con Escape,
 * clic fuera, navegación con flechas y retorno de foco al botón.
 */
export const NotificationBell: React.FC = () => {
  const {
    notifications,
    loading,
    error,
    readIds,
    lastUpdated,
    unreadCount,
    reload,
    markAsRead,
    markAllAsRead,
  } = useNotifications();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<NotificationFilter>('all');
  const [now, setNow] = useState<number>(() => Date.now());
  const panelId = useId().replace(/:/g, '');
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const closePanel = useCallback((restoreFocus = true) => {
    setOpen(false);
    if (restoreFocus) {
      window.setTimeout(() => triggerRef.current?.focus(), 0);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        closePanel(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closePanel(true);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    closeButtonRef.current?.focus();
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, closePanel]);

  useEffect(() => {
    if (!open) return;
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, [open]);

  const handlePanelKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    const items = Array.from(
      panelRef.current?.querySelectorAll<HTMLElement>('[data-notif-item]') ?? []
    );
    if (items.length === 0) return;
    event.preventDefault();
    const currentIndex = items.indexOf(document.activeElement as HTMLElement);
    let nextIndex = 0;
    if (event.key === 'End') nextIndex = items.length - 1;
    else if (event.key === 'ArrowDown') nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % items.length;
    else if (event.key === 'ArrowUp') nextIndex = currentIndex <= 0 ? items.length - 1 : currentIndex - 1;
    items[nextIndex]?.focus();
  };

  const handleToggle = () => {
    if (!open) reload();
    setOpen((value) => !value);
  };

  const handleNotificationClick = (notification: AppNotification) => {
    markAsRead(notification.id);
    if (notification.enlace) closePanel(true);
  };

  const filteredNotifications = useMemo(
    () => (filter === 'unread' ? notifications.filter((item) => !readIds.includes(item.id)) : notifications),
    [filter, notifications, readIds]
  );

  const renderNotification = (notification: AppNotification) => {
    const unread = !readIds.includes(notification.id);
    const content = (
      <>
        <span className="notif-item__icon">{TONE_ICONS[notification.tipo] ?? TONE_ICONS.info}</span>
        <span className="notif-item__content">
          <span className="notif-item__title">
            {notification.titulo}
            {unread && (
              <span className="notif-item__unread">
                <span className="sr-only">Sin leer</span>
              </span>
            )}
          </span>
          <span className="notif-item__detail">{notification.detalle}</span>
          <span className="notif-item__meta">
            <span className={`notif-item__type notif-item__type--${notification.tipo}`}>
              {TONE_LABELS[notification.tipo] ?? TONE_LABELS.info}
            </span>
            <time dateTime={notification.fecha}>
              {formatRelativeTime(notification.fecha, new Date(now))}
            </time>
          </span>
        </span>
        {notification.enlace && <ChevronRight size={15} className="notif-item__arrow" aria-hidden="true" />}
      </>
    );

    if (notification.enlace) {
      return (
        <Link
          key={notification.id}
          to={notification.enlace}
          className={notificationClassName(notification, unread)}
          data-notif-item
          onClick={() => handleNotificationClick(notification)}
        >
          {content}
        </Link>
      );
    }

    return (
      <button
        key={notification.id}
        type="button"
        className={notificationClassName(notification, unread)}
        data-notif-item
        onClick={() => handleNotificationClick(notification)}
      >
        {content}
      </button>
    );
  };

  return (
    <div className="notif-root" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className={`icon-button notif-trigger${open ? ' is-open' : ''}`}
        title="Notificaciones"
        aria-label={unreadCount > 0 ? `Notificaciones, ${unreadCount} sin leer` : 'Notificaciones'}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={handleToggle}
      >
        <Bell size={18} aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="notif-dot" aria-hidden="true">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          id={panelId}
          ref={panelRef}
          className="glass-panel animate-fade-in notif-panel"
          role="dialog"
          aria-labelledby={`${panelId}-title`}
          onKeyDown={handlePanelKeyDown}
        >
          <div className="notif-panel__head">
            <div className="notif-panel__heading">
              <span className="notif-panel__badge" aria-hidden="true">
                <Bell size={17} />
              </span>
              <div className="notif-panel__heading-text">
                <div className="notif-panel__title-row">
                  <h4 id={`${panelId}-title`} className="notif-panel__title">Notificaciones</h4>
                  {unreadCount > 0 && (
                    <span className="notif-panel__unread-count" aria-label={`${unreadCount} sin leer`}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </div>
                <p className="notif-panel__subtitle">
                  {unreadCount > 0 ? `${unreadCount} sin leer` : 'Todo al día'}
                </p>
              </div>
            </div>
            <div className="notif-panel__actions">
              {unreadCount > 0 && (
                <button
                  type="button"
                  className="notif-panel__action notif-panel__action--primary"
                  onClick={markAllAsRead}
                  aria-label="Marcar todas las notificaciones como leídas"
                >
                  <CheckCheck size={14} aria-hidden="true" />
                  <span>Marcar todas</span>
                </button>
              )}
              <button
                ref={closeButtonRef}
                type="button"
                className="icon-button notif-panel__close"
                onClick={() => closePanel(true)}
                aria-label="Cerrar notificaciones"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="notif-panel__toolbar" role="group" aria-label="Filtrar notificaciones">
            <div className="notif-filter">
              <button
                type="button"
                aria-pressed={filter === 'all'}
                onClick={() => setFilter('all')}
              >
                Todas
                <span className="notif-filter__count">{notifications.length}</span>
              </button>
              <button
                type="button"
                aria-pressed={filter === 'unread'}
                onClick={() => setFilter('unread')}
              >
                Sin leer
                <span className="notif-filter__count">{unreadCount}</span>
              </button>
            </div>
          </div>

          <div className="notif-panel__body">
            {loading && notifications.length === 0 ? (
              <div className="notif-loading" role="status">
                <span className="notif-skeleton" />
                <span className="notif-skeleton" />
                <span className="notif-skeleton" />
                <span className="sr-only">Cargando avisos…</span>
              </div>
            ) : error && notifications.length === 0 ? (
              <div className="notif-empty" role="alert">
                <CircleAlert size={22} aria-hidden="true" />
                <strong>No se pudieron cargar los avisos</strong>
                <span>{error}</span>
                <button type="button" className="notif-panel__action" onClick={reload}>
                  Reintentar
                </button>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="notif-empty">
                <BellOff size={22} aria-hidden="true" />
                <strong>{filter === 'unread' ? 'No tienes avisos sin leer' : 'Sin avisos pendientes'}</strong>
                <span>
                  {filter === 'unread'
                    ? 'Has revisado todos los avisos disponibles.'
                    : 'No hay novedades institucionales para tu perfil.'}
                </span>
                {filter === 'unread' && (
                  <button type="button" className="notif-panel__action" onClick={() => setFilter('all')}>
                    Ver todas
                  </button>
                )}
              </div>
            ) : (
              filteredNotifications.map(renderNotification)
            )}
          </div>

          <div className="notif-panel__foot">
            <span className="notif-panel__updated">
              <span className={`notif-panel__status-dot${loading ? ' is-loading' : ''}`} aria-hidden="true" />
              {lastUpdated
                ? `Actualizado ${formatRelativeTime(lastUpdated.toISOString(), new Date(now))}`
                : 'Sin actualizar'}
            </span>
            <button type="button" className="notif-panel__action" onClick={reload} disabled={loading}>
              <RefreshCw size={13} className={loading ? 'notif-spin' : ''} aria-hidden="true" />
              {loading ? 'Actualizando…' : 'Actualizar'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
