import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Search } from 'lucide-react';

export interface SearchableSelectOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

interface SearchableSelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  invalid?: boolean;
  ariaLabel?: string;
}

const normalize = (value: string): string =>
  value
    .toLocaleLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const POPOVER_MAX_HEIGHT = 300;

/**
 * Selector accesible con búsqueda para listas largas.
 * Mantiene el aspecto de un campo de formulario y se abre en un portal para
 * no quedar recortado dentro de modales o paneles con scroll.
 */
export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  id,
  value,
  onChange,
  options,
  placeholder = 'Seleccionar…',
  searchPlaceholder = 'Buscar…',
  emptyMessage = 'Sin coincidencias.',
  disabled = false,
  invalid = false,
  ariaLabel,
}) => {
  const generatedId = useId().replace(/:/g, '');
  const inputId = id ?? `searchable-${generatedId}`;
  const listId = `${inputId}-list`;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 280 });

  const selected = options.find((option) => option.value === value);

  const filtered = useMemo(() => {
    const term = normalize(query.trim());
    if (!term) return options;
    return options.filter((option) =>
      normalize(`${option.label} ${option.description ?? ''}`).includes(term)
    );
  }, [options, query]);

  const close = (restoreFocus = false) => {
    setOpen(false);
    setQuery('');
    if (restoreFocus) window.setTimeout(() => triggerRef.current?.focus(), 0);
  };

  const openPopover = () => {
    if (disabled) return;
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const width = Math.min(Math.max(rect.width, 240), window.innerWidth - 16);
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));
    const openUp = rect.bottom + POPOVER_MAX_HEIGHT > window.innerHeight && rect.top > POPOVER_MAX_HEIGHT;
    const top = openUp
      ? Math.max(8, rect.top - POPOVER_MAX_HEIGHT - 6)
      : Math.min(rect.bottom + 6, window.innerHeight - 80);

    setPosition({ top, left, width });
    setQuery('');
    setActiveIndex(0);
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => searchRef.current?.focus(), 30);

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (popoverRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      close(false);
    };
    const handleWindowChange = () => close(false);
    const handleScroll = (event: Event) => {
      const target = event.target as Node | null;
      if (target && popoverRef.current?.contains(target)) return;
      close(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('resize', handleWindowChange);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('resize', handleWindowChange);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const selectOption = (option: SearchableSelectOption) => {
    if (option.disabled) return;
    onChange(option.value);
    close(true);
  };

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      close(true);
      return;
    }
    if (event.key === 'Tab') {
      close(false);
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      if (filtered.length === 0) return;
      const enabledIndexes = filtered
        .map((option, index) => (option.disabled ? -1 : index))
        .filter((index) => index >= 0);
      if (enabledIndexes.length === 0) return;

      if (event.key === 'Home') {
        setActiveIndex(enabledIndexes[0]);
        return;
      }
      if (event.key === 'End') {
        setActiveIndex(enabledIndexes[enabledIndexes.length - 1]);
        return;
      }

      const current = enabledIndexes.indexOf(activeIndex);
      const next = event.key === 'ArrowDown'
        ? enabledIndexes[(current + 1 + enabledIndexes.length) % enabledIndexes.length]
        : enabledIndexes[(current - 1 + enabledIndexes.length) % enabledIndexes.length];
      setActiveIndex(next);
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      const option = filtered[activeIndex];
      if (option) selectOption(option);
    }
  };

  const activeOption = filtered[activeIndex];

  return (
    <div className="searchable-select">
      <button
        ref={triggerRef}
        id={inputId}
        type="button"
        className={`searchable-select__trigger${invalid ? ' is-invalid' : ''}`}
        disabled={disabled}
        onClick={() => (open ? close(false) : openPopover())}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={ariaLabel}
        aria-invalid={invalid || undefined}
      >
        <span className={`searchable-select__value${selected ? '' : ' is-placeholder'}`}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={16} className="searchable-select__chevron" aria-hidden="true" />
      </button>

      {open && typeof document !== 'undefined' && createPortal(
        <div
          ref={popoverRef}
          className="searchable-select__popover"
          style={{ top: position.top, left: position.left, width: position.width }}
        >
          <div className="searchable-select__search">
            <Search size={15} aria-hidden="true" />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder={searchPlaceholder}
              role="combobox"
              aria-autocomplete="list"
              aria-expanded="true"
              aria-controls={listId}
              aria-activedescendant={activeOption ? `${listId}-${activeIndex}` : undefined}
              aria-label={searchPlaceholder}
              autoComplete="off"
            />
          </div>

          <div id={listId} className="searchable-select__list" role="listbox" aria-label={ariaLabel ?? 'Opciones'}>
            {filtered.map((option, index) => (
              <button
                key={option.value}
                id={`${listId}-${index}`}
                type="button"
                role="option"
                aria-selected={option.value === value}
                disabled={option.disabled}
                className={`searchable-select__option${index === activeIndex ? ' is-active' : ''}`}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectOption(option)}
              >
                <span>{option.label}</span>
                {option.description && <small>{option.description}</small>}
                {option.value === value && <Check size={14} aria-hidden="true" />}
              </button>
            ))}
            {filtered.length === 0 && <p className="searchable-select__empty">{emptyMessage}</p>}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
