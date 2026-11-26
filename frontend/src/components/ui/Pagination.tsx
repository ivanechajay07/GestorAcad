import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onChange: (page: number) => void;
  itemLabel?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  page,
  pageSize,
  total,
  onChange,
  itemLabel = 'registros',
}) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (total === 0) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const buildPages = (): (number | '...')[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | '...')[] = [1];
    if (page > 3) pages.push('...');
    for (let p = Math.max(2, page - 1); p <= Math.min(totalPages - 1, page + 1); p++) {
      pages.push(p);
    }
    if (page < totalPages - 2) pages.push('...');
    pages.push(totalPages);
    return pages;
  };

  const navButton = (disabled: boolean): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-light)',
    background: 'var(--bg-surface-elevated)',
    color: disabled ? 'var(--text-muted)' : 'var(--text-main)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
  });

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        flexWrap: 'wrap',
        marginTop: '16px',
        paddingTop: '14px',
        borderTop: '1px solid var(--border-light)',
      }}
    >
      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
        Mostrando <strong style={{ color: 'var(--text-secondary)' }}>{from}–{to}</strong> de{' '}
        <strong style={{ color: 'var(--text-secondary)' }}>{total}</strong> {itemLabel}
      </span>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <button
          type="button"
          aria-label="Página anterior"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          style={navButton(page <= 1)}
        >
          <ChevronLeft size={16} />
        </button>

        {buildPages().map((p, index) =>
          p === '...' ? (
            <span key={`gap-${index}`} style={{ padding: '0 4px', color: 'var(--text-muted)' }}>
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onChange(p)}
              style={{
                minWidth: 32,
                height: 32,
                padding: '0 8px',
                borderRadius: 'var(--radius-sm)',
                border: p === page ? '1px solid var(--primary)' : '1px solid var(--border-light)',
                background: p === page ? 'var(--primary)' : 'var(--bg-surface-elevated)',
                color: p === page ? 'var(--primary-contrast)' : 'var(--text-main)',
                cursor: 'pointer',
                fontSize: 'var(--text-sm)',
                fontWeight: 600,
              }}
            >
              {p}
            </button>
          )
        )}

        <button
          type="button"
          aria-label="Página siguiente"
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
          style={navButton(page >= totalPages)}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};
