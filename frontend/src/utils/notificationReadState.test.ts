import { beforeEach, describe, expect, it } from 'vitest';
import {
  loadReadNotificationIds,
  normalizeReadIds,
  notificationReadKey,
  saveReadNotificationIds,
} from './notificationReadState';

describe('notificationReadState', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('genera una clave aislada por usuario', () => {
    expect(notificationReadKey(7)).toBe('gestoracad:notificaciones-leidas:7');
    expect(notificationReadKey(7)).not.toBe(notificationReadKey(8));
  });

  it('normaliza duplicados y valores vacíos', () => {
    expect(normalizeReadIds(['a', 'a', '', 'b', 'b'])).toEqual(['a', 'b']);
  });

  it('persiste y recupera los identificadores leídos', () => {
    saveReadNotificationIds(7, ['periodo-2026-i', 'auditoria-2026-10-28', 'periodo-2026-i']);

    expect(loadReadNotificationIds(7)).toEqual(['periodo-2026-i', 'auditoria-2026-10-28']);
    expect(loadReadNotificationIds(8)).toEqual([]);
  });

  it('tolera almacenamiento corrupto o no disponible', () => {
    window.localStorage.setItem(notificationReadKey(7), '{no-es-json');
    expect(loadReadNotificationIds(7)).toEqual([]);

    const storage = {
      getItem: () => {
        throw new Error('bloqueado');
      },
      setItem: () => {
        throw new Error('bloqueado');
      },
    } as unknown as Storage;

    expect(loadReadNotificationIds(7, storage)).toEqual([]);
    expect(() => saveReadNotificationIds(7, ['a'], storage)).not.toThrow();
  });
});
