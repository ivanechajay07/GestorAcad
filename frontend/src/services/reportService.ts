import api from './api';

const filenameFrom = (disposition?: string, fallback = 'reporte.csv'): string => {
  if (!disposition) return fallback;
  const encoded = /filename\*=UTF-8''([^;]+)/i.exec(disposition);
  if (encoded?.[1]) {
    try {
      return decodeURIComponent(encoded[1]);
    } catch {
      return fallback;
    }
  }
  const plain = /filename="?([^";]+)"?/i.exec(disposition);
  return plain?.[1]?.trim() || fallback;
};

const saveBlob = (blob: Blob, filename: string): void => {
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

const downloadReport = async (path: string, fallback: string, accept = 'text/csv'): Promise<string> => {
  const response = await api.get<Blob>(path, {
    responseType: 'blob',
    headers: { Accept: accept },
  });
  const filename = filenameFrom(response.headers['content-disposition'], fallback);
  saveBlob(response.data, filename);
  return filename;
};

export const reportService = {
  exportStudents: (): Promise<string> => downloadReport('/v1/reports/students', 'estudiantes.csv'),
  exportTeachers: (): Promise<string> => downloadReport('/v1/reports/teachers', 'docentes.csv'),
  exportUsers: (): Promise<string> => downloadReport('/v1/reports/users', 'usuarios.csv'),
  exportActa: (sectionId: number): Promise<string> =>
    downloadReport(`/v1/reports/sections/${sectionId}/acta.pdf`, 'acta.pdf', 'application/pdf'),
  exportStudentConstancia: (sectionId: number): Promise<string> =>
    downloadReport(
      `/v1/portal/student/sections/${sectionId}/constancia.pdf`,
      'constancia.pdf',
      'application/pdf'
    ),
  exportStudentReport: (): Promise<string> =>
    downloadReport('/v1/portal/student/report.pdf', 'reporte-avance.pdf', 'application/pdf'),
};
