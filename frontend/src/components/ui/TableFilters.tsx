import React from 'react';
import { Filter } from 'lucide-react';

export interface TableFilterDef {
  key: string;
  label: string;
  placeholder?: string;
  type?: 'text' | 'select';
  options?: { value: string; label: string }[];
}

interface TableFiltersProps {
  filters: TableFilterDef[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  trailing?: number;
}

const control = (
  filter: TableFilterDef,
  values: Record<string, string>,
  onChange: (key: string, value: string) => void,
) => {
  const value = values[filter.key] ?? '';
  if (filter.type === 'select') {
    return (
      <select
        className="table-filter-control table-filter-control--select"
        aria-label={`Filtrar por ${filter.label}`}
        value={value}
        onChange={(event) => onChange(filter.key, event.target.value)}
      >
        <option value="ALL">Todos</option>
        {filter.options?.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    );
  }
  return (
    <span className="table-filter-control">
      <Filter size={11} aria-hidden="true" />
      <input
        type="search"
        aria-label={`Filtrar por ${filter.label}`}
        placeholder={filter.placeholder ?? `Filtrar ${filter.label.toLowerCase()}`}
        value={value}
        onChange={(event) => onChange(filter.key, event.target.value)}
      />
    </span>
  );
};

/** Fila de filtros alineada bajo las cabeceras de una tabla de escritorio. */
export const TableFilterRow: React.FC<TableFiltersProps> = ({ filters, values, onChange, trailing = 1 }) => (
  <tr className="table-filter-row">
    {filters.map((filter) => (
      <th key={filter.key} scope="col">
        {control(filter, values, onChange)}
      </th>
    ))}
    {Array.from({ length: trailing }).map((_, index) => (
      <th key={`empty-${index}`} scope="col" aria-hidden="true" />
    ))}
  </tr>
);

/** Panel plegable de filtros para tablas apiladas en móvil. */
export const TableFilterMobile: React.FC<TableFiltersProps> = ({ filters, values, onChange }) => (
  <details className="table-filter-mobile">
    <summary>
      <Filter size={14} aria-hidden="true" />
      Filtros de tabla
    </summary>
    <div className="table-filter-mobile__grid">
      {filters.map((filter) => (
        <label key={filter.key}>
          <span>{filter.label}</span>
          {control(filter, values, onChange)}
        </label>
      ))}
    </div>
  </details>
);

export const matchesFilter = (value: unknown, filter: string): boolean => {
  const query = filter.trim().toLocaleLowerCase();
  if (!query) return true;
  return String(value ?? '').toLocaleLowerCase().includes(query);
};

export const filterByKey = (filters: TableFilterDef[], key: string): TableFilterDef | undefined =>
  filters.find((filter) => filter.key === key);

export interface TableHeaderColumn {
  key: string;
  label: React.ReactNode;
  filter?: TableFilterDef;
  align?: 'left' | 'center' | 'right';
}

interface TableHeaderProps {
  columns: TableHeaderColumn[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
}

/** Cabecera de tabla con el filtro integrado en cada columna. */
export const TableHeader: React.FC<TableHeaderProps> = ({ columns, values, onChange }) => (
  <thead>
    <tr>
      {columns.map((column) => (
        <th key={column.key} scope="col" style={column.align ? { textAlign: column.align } : undefined}>
          <span className="table-th__label">{column.label}</span>
          {column.filter && (
            <span className="table-th__filter">
              {control(
                column.filter.type === 'select'
                  ? column.filter
                  : { ...column.filter, placeholder: 'Filtrar' },
                values,
                onChange,
              )}
            </span>
          )}
        </th>
      ))}
    </tr>
  </thead>
);

