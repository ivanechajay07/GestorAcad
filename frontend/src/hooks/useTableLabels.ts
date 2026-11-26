import { useEffect } from 'react';

/**
 * Añade `data-label` a las celdas de las tablas marcadas con `data-table--stack`
 * para que en móvil puedan mostrarse como tarjetas con su encabezado.
 */
const decorateTables = () => {
  document.querySelectorAll<HTMLTableElement>('table.data-table--stack').forEach((table) => {
    const headers = Array.from(table.querySelectorAll('thead th')).map((th) =>
      (th.textContent ?? '').trim()
    );
    table.querySelectorAll('tbody tr').forEach((row) => {
      Array.from(row.children).forEach((cell, index) => {
        if (!(cell instanceof HTMLTableCellElement) || cell.hasAttribute('colspan')) return;
        const label = headers[index];
        if (label) cell.dataset.label = label;
      });
    });
  });
};

export const useTableLabels = () => {
  useEffect(() => {
    let frame = 0;
    const schedule = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(decorateTables);
    };

    schedule();
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frame);
    };
  }, []);
};
