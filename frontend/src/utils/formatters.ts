export const formatDateTime = (dateString?: string | Date): string => {
  if (!dateString) return 'N/A';
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

export const formatRoleLabel = (role?: string | null): string => {
  switch (role) {
    case 'UNIVERSIDAD':
      return 'Administración Universidad';
    case 'DOCENTE':
      return 'Cuerpo Docente';
    case 'ESTUDIANTE':
      return 'Comunidad Estudiantil';
    default:
      return 'Invitado';
  }
};
