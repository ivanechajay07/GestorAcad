import React, { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CalendarDays, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface DatePickerProps {
  value?: string;
  onChange: (value: string) => void;
  id?: string;
  ariaLabel?: string;
  disabled?: boolean;
  required?: boolean;
  min?: string;
  max?: string;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
}

const WEEKDAYS = ['lu', 'ma', 'mi', 'ju', 'vi', 'sá', 'do'];
const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

const pad = (value: number): string => String(value).padStart(2, '0');

const toISO = (date: Date): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const parseISO = (value?: string): Date | null => {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
};

const isSameDay = (a: Date | null, b: Date | null): boolean =>
  Boolean(a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate());

const startOfMonth = (date: Date): Date => new Date(date.getFullYear(), date.getMonth(), 1);

const addDays = (date: Date, days: number): Date => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const addMonths = (date: Date, months: number): Date =>
  new Date(date.getFullYear(), date.getMonth() + months, 1);

const formatDisplay = (value?: string): string => {
  const date = parseISO(value);
  return date ? `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}` : '';
};

const formatLong = (date: Date): string =>
  date.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

const parseDraft = (raw: string): string | null => {
  const value = raw.trim();
  if (!value) return '';
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(value);
  const dmy = /^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/.exec(value);
  let year = 0;
  let month = 0;
  let day = 0;
  if (iso) {
    year = Number(iso[1]);
    month = Number(iso[2]);
    day = Number(iso[3]);
  } else if (dmy) {
    day = Number(dmy[1]);
    month = Number(dmy[2]);
    year = Number(dmy[3]);
    if (year < 100) year += year > 40 ? 1900 : 2000;
  } else {
    return null;
  }
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return toISO(date);
};

/**
 * Selector de fecha con calendario propio.
 * Mantiene el valor en formato ISO (YYYY-MM-DD), permite escribir dd/mm/aaaa
 * y ofrece navegacion completa con teclado.
 */
export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  id,
  ariaLabel,
  disabled = false,
  required = false,
  min,
  max,
  placeholder = 'dd/mm/aaaa',
  className = '',
  style,
}) => {
  const generatedId = useId().replace(/:/g, '');
  const inputId = id ?? `date-${generatedId}`;
  const popoverId = `date-popover-${generatedId}`;
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const selected = parseISO(value);
  const today = new Date();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(() => formatDisplay(value));
  const [viewDate, setViewDate] = useState<Date>(() => startOfMonth(selected ?? today));
  const [focusedDate, setFocusedDate] = useState<Date>(selected ?? today);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  const minDate = parseISO(min);
  const maxDate = parseISO(max);

  useEffect(() => {
    if (!open) setDraft(formatDisplay(value));
  }, [value, open]);

  const place = useCallback(() => {
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect) return;
    const width = Math.min(304, window.innerWidth - 24);
    const height = 350;
    const left = Math.min(Math.max(12, rect.left), window.innerWidth - width - 12);
    let top = rect.bottom + 8;
    if (top + height > window.innerHeight - 12) {
      top = Math.max(12, rect.top - height - 8);
    }
    setCoords({ top, left });
  }, []);

  const openPicker = useCallback(() => {
    if (disabled) return;
    place();
    setViewDate(startOfMonth(selected ?? new Date()));
    setFocusedDate(selected ?? new Date());
    setOpen(true);
  }, [disabled, place, selected]);

  const closePicker = useCallback((restoreFocus = true) => {
    setOpen(false);
    if (restoreFocus) {
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, []);

  useLayoutEffect(() => {
    if (open) place();
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || popoverRef.current?.contains(target)) return;
      setOpen(false);
    };
    const handleResize = () => place();
    let scrollFrame = 0;
    const handleScroll = () => {
      window.cancelAnimationFrame(scrollFrame);
      scrollFrame = window.requestAnimationFrame(place);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);
    return () => {
      window.cancelAnimationFrame(scrollFrame);
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [open, place, closePicker]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {
      const target = gridRef.current?.querySelector<HTMLElement>('.date-picker__day.is-selected')
        ?? gridRef.current?.querySelector<HTMLElement>('.date-picker__day.is-today')
        ?? gridRef.current?.querySelector<HTMLElement>('.date-picker__day:not(:disabled)');
      target?.focus();
    }, 40);
    return () => window.clearTimeout(timer);
  }, [open]);

  const commitDraft = (): boolean => {
    if (draft.trim() === '') {
      if (required) {
        setDraft(formatDisplay(value));
        return false;
      }
      onChange('');
      return true;
    }
    const parsed = parseDraft(draft);
    if (!parsed) {
      setDraft(formatDisplay(value));
      return false;
    }
    const date = parseISO(parsed);
    if (date && minDate && date < minDate) {
      setDraft(formatDisplay(value));
      return false;
    }
    if (date && maxDate && date > maxDate) {
      setDraft(formatDisplay(value));
      return false;
    }
    onChange(parsed);
    setDraft(formatDisplay(parsed));
    return true;
  };

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      openPicker();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (commitDraft()) closePicker(false);
    } else if (event.key === 'Escape' && open) {
      event.preventDefault();
      event.stopPropagation();
      closePicker(true);
    }
  };

  const selectDate = (date: Date) => {
    onChange(toISO(date));
    setDraft(formatDisplay(toISO(date)));
    setFocusedDate(date);
    setOpen(false);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  };

  const moveFocus = (days: number) => {
    const base = focusedDate ?? selected ?? new Date();
    let next = addDays(base, days);
    if (minDate && next < minDate) next = minDate;
    if (maxDate && next > maxDate) next = maxDate;
    setFocusedDate(next);
    setViewDate(startOfMonth(next));
    window.setTimeout(() => {
      gridRef.current
        ?.querySelector<HTMLElement>(`[data-date="${toISO(next)}"]`)
        ?.focus();
    }, 0);
  };

  const handleGridKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'ArrowLeft') moveFocus(-1);
    else if (event.key === 'ArrowRight') moveFocus(1);
    else if (event.key === 'ArrowUp') moveFocus(-7);
    else if (event.key === 'ArrowDown') moveFocus(7);
    else if (event.key === 'Home') moveFocus(-((focusedDate ?? today).getDay() + 6) % 7);
    else if (event.key === 'End') moveFocus(6 - (((focusedDate ?? today).getDay() + 6) % 7));
    else if (event.key === 'PageUp') setViewDate((current) => addMonths(current, -1));
    else if (event.key === 'PageDown') setViewDate((current) => addMonths(current, 1));
  };

  const handlePopoverKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      closePicker(true);
      return;
    }
    if (event.key !== 'Tab') return;
    const focusables = Array.from(
      popoverRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled)') ?? []
    );
    if (focusables.length === 0) return;
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

  const monthStart = startOfMonth(viewDate);
  const offset = (monthStart.getDay() + 6) % 7;
  const gridStart = addDays(monthStart, -offset);
  const days = Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));

  return (
    <div className={`date-picker ${className}`.trim()} ref={rootRef}>
      <div className="date-picker__control">
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          className="date-picker__input"
          value={draft}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          aria-label={ariaLabel}
          autoComplete="off"
          inputMode="numeric"
          style={{ ...style, paddingRight: 40 }}
          onChange={(event) => setDraft(event.target.value)}
          onFocus={() => setDraft(formatDisplay(value))}
          onBlur={() => {
            if (!open) commitDraft();
          }}
          onKeyDown={handleInputKeyDown}
        />
        <button
          ref={triggerRef}
          type="button"
          className="date-picker__toggle"
          onClick={() => (open ? closePicker(false) : openPicker())}
          disabled={disabled}
          aria-label={open ? 'Cerrar calendario' : 'Abrir calendario'}
          aria-expanded={open}
          aria-controls={open ? popoverId : undefined}
        >
          <CalendarDays size={16} aria-hidden="true" />
        </button>
      </div>

      {open && typeof document !== 'undefined' && createPortal(
        <div
          ref={popoverRef}
          id={popoverId}
          className="date-picker__popover"
          style={{ top: coords.top, left: coords.left }}
          role="dialog"
          aria-modal="false"
          aria-label="Seleccionar fecha"
          onKeyDown={handlePopoverKeyDown}
        >
          <div className="date-picker__head">
            <div className="date-picker__nav">
              <button type="button" aria-label="Año anterior" onClick={() => setViewDate((current) => addMonths(current, -12))}>
                <ChevronsLeft size={15} />
              </button>
              <button type="button" aria-label="Mes anterior" onClick={() => setViewDate((current) => addMonths(current, -1))}>
                <ChevronLeft size={15} />
              </button>
            </div>
            <strong aria-live="polite">
              {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
            </strong>
            <div className="date-picker__nav">
              <button type="button" aria-label="Mes siguiente" onClick={() => setViewDate((current) => addMonths(current, 1))}>
                <ChevronRight size={15} />
              </button>
              <button type="button" aria-label="Año siguiente" onClick={() => setViewDate((current) => addMonths(current, 12))}>
                <ChevronsRight size={15} />
              </button>
            </div>
          </div>

          <div className="date-picker__weekdays" aria-hidden="true">
            {WEEKDAYS.map((day) => <span key={day}>{day}</span>)}
          </div>

          <div className="date-picker__grid" ref={gridRef} onKeyDown={handleGridKeyDown}>
            {days.map((date) => {
              const iso = toISO(date);
              const outside = date.getMonth() !== viewDate.getMonth();
              const isSelected = isSameDay(date, selected);
              const isToday = isSameDay(date, today);
              const outOfRange = Boolean((minDate && date < minDate) || (maxDate && date > maxDate));
              return (
                <button
                  key={iso}
                  type="button"
                  data-date={iso}
                  className={[
                    'date-picker__day',
                    outside ? 'is-outside' : '',
                    isSelected ? 'is-selected' : '',
                    isToday ? 'is-today' : '',
                  ].filter(Boolean).join(' ')}
                  disabled={outOfRange}
                  tabIndex={isSelected || (!selected && isToday) ? 0 : -1}
                  aria-label={formatLong(date)}
                  aria-current={isToday ? 'date' : undefined}
                  onFocus={() => setFocusedDate(date)}
                  onClick={() => selectDate(date)}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          <div className="date-picker__footer">
            <button
              type="button"
              className="date-picker__action"
              onClick={() => {
                if (required) return;
                onChange('');
                setDraft('');
                setOpen(false);
                window.setTimeout(() => inputRef.current?.focus(), 0);
              }}
              disabled={required}
            >
              Borrar
            </button>
            <button
              type="button"
              className="date-picker__action date-picker__action--primary"
              onClick={() => selectDate(new Date())}
            >
              Hoy
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
