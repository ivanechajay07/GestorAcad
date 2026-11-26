import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { NotificationBell } from './NotificationBell';
import type { AppNotification } from '../services/notificationService';

const mocks = vi.hoisted(() => ({
  useNotifications: vi.fn(),
}));

vi.mock('../hooks/useNotifications', () => ({
  useNotifications: mocks.useNotifications,
}));

const notifications: AppNotification[] = [
  {
    id: 'periodo-2026-i',
    tipo: 'info',
    titulo: 'Periodo 2026-I activo',
    detalle: 'El periodo académico vigente se encuentra configurado en el sistema.',
    enlace: '/university',
    fecha: '2026-10-28T16:00:00',
  },
];

const renderBell = async (root: Root) => {
  await act(async () => {
    root.render(
      <MemoryRouter>
        <NotificationBell />
      </MemoryRouter>
    );
  });
};

describe('NotificationBell', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    mocks.useNotifications.mockReturnValue({
      notifications,
      loading: false,
      error: null,
      readIds: [],
      lastUpdated: new Date('2026-10-28T16:00:00'),
      unreadCount: 1,
      reload: vi.fn(),
      markAsRead: vi.fn(),
      markAllAsRead: vi.fn(),
    });
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    vi.clearAllMocks();
  });

  it('muestra el contador real, abre el panel y permite cerrar con Escape', async () => {
    const state = mocks.useNotifications();
    await renderBell(root);

    const trigger = container.querySelector<HTMLButtonElement>('button[title="Notificaciones"]');
    expect(trigger?.getAttribute('aria-label')).toBe('Notificaciones, 1 sin leer');
    expect(container.querySelector('.notif-dot')?.textContent).toBe('1');

    await act(async () => {
      trigger?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(state.reload).toHaveBeenCalledTimes(1);
    expect(container.querySelector('[role="dialog"]')).not.toBeNull();
    expect(container.textContent).toContain('Periodo 2026-I activo');
    expect(container.textContent).toContain('Marcar todas');

    await act(async () => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });

    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  it('oculta el contador y muestra el estado al día cuando no hay pendientes', async () => {
    mocks.useNotifications.mockReturnValue({
      notifications,
      loading: false,
      error: null,
      readIds: ['periodo-2026-i'],
      lastUpdated: new Date('2026-10-28T16:00:00'),
      unreadCount: 0,
      reload: vi.fn(),
      markAsRead: vi.fn(),
      markAllAsRead: vi.fn(),
    });
    await renderBell(root);

    const trigger = container.querySelector<HTMLButtonElement>('button[title="Notificaciones"]');
    expect(trigger?.getAttribute('aria-label')).toBe('Notificaciones');
    expect(container.querySelector('.notif-dot')).toBeNull();

    await act(async () => {
      trigger?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(container.textContent).toContain('Todo al día');
    expect(container.textContent).not.toContain('Marcar todas');
  });
});
