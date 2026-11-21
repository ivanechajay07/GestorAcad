import React, { useMemo, useState } from 'react';
import { Check, ChevronDown, Layers, Search, X } from 'lucide-react';
import type { PermissionData } from '../../services/roleService';
import { formatModuleName, formatPermissionName, normalizeText, pluralize } from '../../utils/roleFormatters';

interface PermissionPickerProps {
  permissions: PermissionData[];
  selectedIds: Set<number>;
  onToggle: (id: number) => void;
  onToggleModule: (module: string) => void;
  onSelectAll: () => void;
  onClear: () => void;
}

/**
 * Selector de permisos agrupado por módulo.
 * Presenta búsqueda, progreso, módulos plegables y permisos compactos.
 */
export const PermissionPicker: React.FC<PermissionPickerProps> = ({
  permissions,
  selectedIds,
  onToggle,
  onToggleModule,
  onSelectAll,
  onClear,
}) => {
  const [query, setQuery] = useState('');
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const byModule = useMemo(() => {
    const map = new Map<string, PermissionData[]>();
    permissions.forEach((permission) => {
      map.set(permission.module, [...(map.get(permission.module) ?? []), permission]);
    });
    return map;
  }, [permissions]);

  const filtered = useMemo(() => {
    const term = normalizeText(query);
    if (!term) return permissions;
    return permissions.filter(
      (permission) =>
        normalizeText(permission.name).includes(term) ||
        normalizeText(formatPermissionName(permission.name)).includes(term) ||
        normalizeText(permission.description).includes(term)
    );
  }, [permissions, query]);

  const groups = useMemo(
    () =>
      Array.from(new Set(filtered.map((permission) => permission.module)))
        .map((module) => ({
          module,
          label: formatModuleName(module),
          items: filtered
            .filter((permission) => permission.module === module)
            .sort((a, b) => formatPermissionName(a.name).localeCompare(formatPermissionName(b.name), 'es')),
          allIds: (byModule.get(module) ?? []).map((permission) => permission.id),
        }))
        .sort((a, b) => a.label.localeCompare(b.label, 'es')),
    [filtered, byModule]
  );

  const toggleCollapsed = (module: string) => {
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(module)) next.delete(module);
      else next.add(module);
      return next;
    });
  };

  const progress = permissions.length === 0
    ? 0
    : Math.round((selectedIds.size / permissions.length) * 100);

  return (
    <div className="permission-picker">
      <div className="permission-picker__toolbar">
        <div className="permission-search">
          <Search size={15} aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar permiso por nombre, código o descripción"
            aria-label="Buscar permiso"
          />
          {query && (
            <button
              type="button"
              className="permission-search__clear"
              onClick={() => setQuery('')}
              aria-label="Limpiar búsqueda"
            >
              <X size={13} aria-hidden="true" />
            </button>
          )}
        </div>
        <div className="permission-picker__actions">
          <button type="button" className="permission-action" onClick={onSelectAll}>
            <Check size={13} aria-hidden="true" /> Seleccionar todos
          </button>
          <button
            type="button"
            className="permission-action permission-action--ghost"
            onClick={onClear}
            disabled={selectedIds.size === 0}
          >
            Limpiar
          </button>
        </div>
      </div>

      <div className="permission-summary">
        <div className="permission-summary__text" role="status" aria-live="polite">
          <strong>{selectedIds.size}</strong>
          <span> de {pluralize(permissions.length, 'permiso', 'permisos')} seleccionados</span>
        </div>
        <div
          className="permission-progress"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          aria-label={`${progress}% de permisos seleccionados`}
        >
          <span style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="permission-picker__groups">
        {groups.length === 0 && (
          <p className="permission-empty">
            No hay permisos que coincidan con «{query}». Prueba con otro término.
          </p>
        )}

        {groups.map((group) => {
          const selectedInModule = group.allIds.filter((id) => selectedIds.has(id)).length;
          const allSelected = group.allIds.length > 0 && selectedInModule === group.allIds.length;
          const open = !collapsed.has(group.module);

          return (
            <section key={group.module} className="permission-module">
              <header className="permission-module__head">
                <button
                  type="button"
                  className="permission-module__toggle"
                  aria-expanded={open}
                  onClick={() => toggleCollapsed(group.module)}
                >
                  <ChevronDown size={14} className={open ? 'is-open' : ''} aria-hidden="true" />
                  <Layers size={14} className="permission-module__icon" aria-hidden="true" />
                  <span className="permission-module__name">{group.label}</span>
                  <span
                    className={`permission-module__count${selectedInModule === 0 ? '' : allSelected ? ' is-complete' : ' is-partial'}`}
                  >
                    {selectedInModule}/{group.allIds.length}
                  </span>
                </button>
                <button
                  type="button"
                  className={`permission-module__select${allSelected ? ' is-selected' : ''}`}
                  onClick={() => onToggleModule(group.module)}
                >
                  {allSelected ? 'Quitar módulo' : 'Seleccionar módulo'}
                </button>
              </header>

              {open && (
                <div className="permission-module__items" role="group" aria-label={`Permisos de ${group.label}`}>
                  {group.items.map((permission) => {
                    const checked = selectedIds.has(permission.id);
                    return (
                      <label
                        key={permission.id}
                        className={`permission-item${checked ? ' is-checked' : ''}`}
                        title={permission.description}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => onToggle(permission.id)}
                        />
                        <span className="permission-item__text">
                          <strong>{formatPermissionName(permission.name)}</strong>
                          <code>{permission.name}</code>
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
};
