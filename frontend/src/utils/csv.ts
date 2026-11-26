type CsvCell = string | number | null | undefined;

/** Construye el contenido CSV escapando comillas y separadores. */
export const toCsv = (rows: CsvCell[][]): string =>
  rows
    .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\r\n');

/** Descarga una matriz de datos como CSV UTF-8. */
export const downloadCsv = (filename: string, rows: CsvCell[][]): void => {
  const blob = new Blob([`\uFEFF${toCsv(rows)}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
};
