import React from 'react';
import {
  BookOpen,
  Building2,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Layers,
  LayoutDashboard,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  permission?: string;
  anyPermission?: string[];
  roles?: string[];
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

/**
 * Navegación única del sistema.
 * La usan el sidebar y el buscador global para no duplicar reglas de acceso.
 */
export const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Portal Académico',
    items: [
      { to: '/dashboard', label: 'Panel Institucional', icon: <LayoutDashboard size={18} /> },
      {
        to: '/my-progress',
        label: 'Mi avance académico',
        icon: <GraduationCap size={18} />,
        roles: ['ROLE_ESTUDIANTE'],
      },
      {
        to: '/my-sections',
        label: 'Mis secciones',
        icon: <BookOpen size={18} />,
        roles: ['ROLE_DOCENTE'],
      },
      { to: '/assistant', label: 'Asistente académico', icon: <Sparkles size={18} /> },
    ],
  },
  {
    title: 'Gestión Académica',
    items: [
      {
        to: '/university',
        label: 'Módulo Universidad',
        icon: <Building2 size={18} />,
        permission: 'UNIVERSIDAD_VIEW',
      },
      {
        to: '/academic',
        label: 'Estructura Académica',
        icon: <Layers size={18} />,
        anyPermission: ['PERIODO_VIEW', 'CURSO_VIEW', 'PLAN_VIEW', 'SECCION_VIEW', 'MATRICULA_VIEW'],
      },
      {
        to: '/evaluation',
        label: 'Evaluación Académica',
        icon: <ClipboardCheck size={18} />,
        anyPermission: ['EVALUACION_VIEW', 'NOTA_VIEW', 'ASISTENCIA_VIEW', 'ACTA_VIEW'],
      },
      {
        to: '/teachers',
        label: 'Claustro Docente',
        icon: <GraduationCap size={18} />,
        permission: 'DOCENTE_VIEW',
      },
      {
        to: '/students',
        label: 'Padrón Estudiantil',
        icon: <Users size={18} />,
        permission: 'ESTUDIANTE_VIEW',
      },
    ],
  },
  {
    title: 'Administración y Seguridad',
    items: [
      {
        to: '/users',
        label: 'Usuarios del Sistema',
        icon: <Users size={18} />,
        permission: 'USUARIO_VIEW',
      },
      {
        to: '/roles',
        label: 'Roles y Permisos',
        icon: <ShieldCheck size={18} />,
        permission: 'ROL_VIEW',
      },
      {
        to: '/audit',
        label: 'Bitácora de Auditoría',
        icon: <FileText size={18} />,
        permission: 'AUDITORIA_VIEW',
      },
    ],
  },
];
