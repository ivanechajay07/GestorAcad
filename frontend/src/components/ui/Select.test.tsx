import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Select } from './Select';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  vi.useFakeTimers();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.useRealTimers();
});

const typeInSearch = (value: string) => {
  const input = document.querySelector<HTMLInputElement>('.searchable-select__search input');
  if (!input) throw new Error('No se abrió el buscador');
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
  return input;
};

const openTrigger = () => {
  const trigger = container.querySelector<HTMLButtonElement>('.searchable-select__trigger');
  if (!trigger) throw new Error('No se encontró el selector');
  act(() => trigger.click());
  act(() => vi.advanceTimersByTime(50));
  return trigger;
};

describe('Select', () => {
  it('renderiza el valor y conserva las opciones en el select nativo', () => {
    act(() => root.render(
      <div className="field">
        <label className="field-label">Facultad</label>
        <Select value="1" onChange={vi.fn()}>
          <option value="">— Seleccione —</option>
          <option value="1">Ingeniería</option>
          <option value="2">Derecho</option>
        </Select>
      </div>
    ));

    const trigger = container.querySelector('.searchable-select__trigger');
    expect(trigger?.textContent).toContain('Ingeniería');
    expect(trigger?.getAttribute('aria-label')).toBe('Facultad: Ingeniería');

    const native = container.querySelector('select');
    expect(native?.value).toBe('1');
    expect(native?.options).toHaveLength(3);
    expect(native?.getAttribute('aria-hidden')).toBe('true');
  });

  it('filtra las opciones y emite el cambio con el valor seleccionado', () => {
    const onChange = vi.fn();
    act(() => root.render(
      <Select value="" onChange={onChange} placeholder="Elegir carrera">
        <option value="">Elegir carrera</option>
        <option value="1">Ingeniería Civil</option>
        <option value="2">Ingeniería de Sistemas</option>
        <option value="3" disabled>Derecho</option>
      </Select>
    ));

    openTrigger();
    act(() => typeInSearch('sistemas'));

    const options = Array.from(document.querySelectorAll<HTMLButtonElement>('.searchable-select__option'));
    expect(options).toHaveLength(1);
    expect(options[0].textContent).toContain('Ingeniería de Sistemas');

    act(() => options[0].click());
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].target.value).toBe('2');
    expect(document.querySelector('.searchable-select__popover')).toBeNull();
  });

  it('permite elegir con el teclado desde el buscador', () => {
    const onChange = vi.fn();
    act(() => root.render(
      <Select value="" onChange={onChange}>
        <option value="">—</option>
        <option value="10">Matemática I</option>
        <option value="11">Comunicación I</option>
      </Select>
    ));

    openTrigger();
    const input = typeInSearch('comunicación');
    act(() => {
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].target.value).toBe('11');
  });
});
