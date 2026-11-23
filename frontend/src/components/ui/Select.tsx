import React, { useCallback, useMemo, useState } from 'react';
import { SearchableSelect } from './SearchableSelect';
import type { SearchableSelectOption } from './SearchableSelect';

type NativeSelectProps = Omit<
  React.SelectHTMLAttributes<HTMLSelectElement>,
  'children' | 'defaultValue' | 'multiple' | 'onChange' | 'size' | 'value'
>;

export interface SelectProps extends NativeSelectProps {
  value?: string | number | null;
  onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  children: React.ReactNode;
  invalid?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
}

const textFromChildren = (children: React.ReactNode): string => {
  let text = '';
  React.Children.forEach(children, (child) => {
    if (typeof child === 'string' || typeof child === 'number') {
      text += child;
      return;
    }
    if (React.isValidElement(child)) {
      text += textFromChildren((child.props as { children?: React.ReactNode }).children);
    }
  });
  return text.replace(/\s+/g, ' ').trim();
};

const collectOptions = (children: React.ReactNode, options: SearchableSelectOption[]): void => {
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    if (child.type === 'option') {
      const props = child.props as React.OptionHTMLAttributes<HTMLOptionElement>;
      const label = textFromChildren(props.children) || String(props.value ?? '');
      options.push({
        value: String(props.value ?? label),
        label,
        disabled: props.disabled,
      });
      return;
    }
    if (child.type === React.Fragment) {
      collectOptions((child.props as { children?: React.ReactNode }).children, options);
    }
  });
};

const LAYOUT_STYLE_KEYS = new Set([
  'width', 'minWidth', 'maxWidth', 'flex', 'flexBasis', 'flexGrow', 'flexShrink',
  'margin', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
  'alignSelf', 'gridArea', 'gridColumn', 'order',
]);

/**
 * Selector con búsqueda compatible con la API de un `<select>` nativo.
 * Conserva un select oculto para la validación del formulario y muestra un
 * control accesible con búsqueda para listas largas.
 */
export const Select: React.FC<SelectProps> = ({
  id,
  className,
  style,
  value,
  onChange,
  children,
  disabled = false,
  required = false,
  name,
  invalid = false,
  placeholder = 'Seleccionar…',
  searchPlaceholder = 'Buscar…',
  emptyMessage = 'Sin coincidencias.',
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  ...nativeProps
}) => {
  const options = useMemo(() => {
    const collected: SearchableSelectOption[] = [];
    collectOptions(children, collected);
    return collected;
  }, [children]);

  const stringValue = value == null ? '' : String(value);
  const selected = options.find((option) => option.value === stringValue);
  const isFieldSelect = className?.includes('field-select') ?? false;

  // Reutiliza el rótulo visible del campo para nombrar el control accesible.
  const [fieldLabel, setFieldLabel] = useState('');
  const attachWrapper = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    const holder = node.parentElement;
    const direct = holder?.querySelector<HTMLElement>(':scope > .field-label');
    const previous = node.previousElementSibling;
    const sibling = previous instanceof HTMLElement
      && (previous instanceof HTMLLabelElement || previous.classList.contains('field-label'))
      ? previous
      : null;
    const label = direct ?? sibling;
    setFieldLabel(label ? (label.textContent ?? '').trim() : '');
  }, []);

  // Las propiedades de maquetación deben vivir en el contenedor y el resto del
  // estilo en el control visible, para conservar el diseño de cada formulario.
  const layoutStyle: React.CSSProperties = {};
  const triggerStyle: React.CSSProperties = {};
  Object.entries(style ?? {}).forEach(([key, val]) => {
    if (LAYOUT_STYLE_KEYS.has(key)) {
      (layoutStyle as Record<string, unknown>)[key] = val;
    } else {
      (triggerStyle as Record<string, unknown>)[key] = val;
    }
  });

  const emitChange = (next: string) => {
    if (!onChange) return;
    const target = { value: next, name } as HTMLSelectElement;
    const event = {
      target,
      currentTarget: target,
    } as unknown as React.ChangeEvent<HTMLSelectElement>;
    onChange(event);
  };

  return (
    <div ref={attachWrapper} className={`searchable-select-native${isFieldSelect ? ' searchable-select-native--field' : ''}`} style={layoutStyle}>
      <SearchableSelect
        id={id}
        value={stringValue}
        onChange={emitChange}
        options={options}
        disabled={disabled}
        invalid={invalid}
        ariaLabel={ariaLabel ?? (fieldLabel || undefined)}
        ariaDescribedBy={ariaDescribedBy}
        triggerClassName={className}
        triggerStyle={triggerStyle}
        placeholder={placeholder}
        searchPlaceholder={searchPlaceholder}
        emptyMessage={emptyMessage}
      />
      <select
        {...nativeProps}
        autoFocus={false}
        name={name}
        value={stringValue}
        onChange={(event) => emitChange(event.target.value)}
        disabled={disabled}
        required={required}
        tabIndex={-1}
        aria-hidden="true"
        className="searchable-select-native__control"
      >
        {children}
      </select>
      {required && (
        <span className="sr-only">
          {selected ? '' : 'Este campo es obligatorio.'}
        </span>
      )}
    </div>
  );
};
