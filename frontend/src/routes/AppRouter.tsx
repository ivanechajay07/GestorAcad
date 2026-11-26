import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

const DashboardPage = lazy(() => import('../pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const AssistantPage = lazy(() => import('../pages/AssistantPage').then((m) => ({ default: m.AssistantPage })));
const UniversityPage = lazy(() => import('../pages/UniversityPage').then((m) => ({ default: m.UniversityPage })));
const AcademicPage = lazy(() => import('../pages/AcademicPage').then((m) => ({ default: m.AcademicPage })));
const EvaluationPage = lazy(() => import('../pages/EvaluationPage').then((m) => ({ default: m.EvaluationPage })));
const StudentPortalPage = lazy(() => import('../pages/StudentPortalPage').then((m) => ({ default: m.StudentPortalPage })));
const TeacherPortalPage = lazy(() => import('../pages/TeacherPortalPage').then((m) => ({ default: m.TeacherPortalPage })));
const TeacherSectionPage = lazy(() => import('../pages/TeacherSectionPage').then((m) => ({ default: m.TeacherSectionPage })));
const TeachersPage = lazy(() => import('../pages/TeachersPage').then((m) => ({ default: m.TeachersPage })));
const StudentsPage = lazy(() => import('../pages/StudentsPage').then((m) => ({ default: m.StudentsPage })));
const UsersPage = lazy(() => import('../pages/UsersPage').then((m) => ({ default: m.UsersPage })));
const RolesPage = lazy(() => import('../pages/RolesPage').then((m) => ({ default: m.RolesPage })));
const AuditPage = lazy(() => import('../pages/AuditPage').then((m) => ({ default: m.AuditPage })));
const ProfilePage = lazy(() => import('../pages/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const LoginPage = lazy(() => import('../pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));

const RouteFallback: React.FC = () => (
  <div style={{ minHeight: '40vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <LoadingSpinner message="Cargando módulo..." />
  </div>
);

const guarded = (
  element: React.ReactElement,
  permission?: string,
  anyPermission?: string[]
): React.ReactElement => (
  <ProtectedRoute requiredPermission={permission} requiredAnyPermission={anyPermission}>
    {element}
  </ProtectedRoute>
);

const guardedRole = (element: React.ReactElement, role: 'UNIVERSIDAD' | 'DOCENTE' | 'ESTUDIANTE'): React.ReactElement => (
  <ProtectedRoute allowedRoles={[role]}>{element}</ProtectedRoute>
);

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          {/* Ruta pública de autenticación */}
          <Route path="/login" element={<LoginPage />} />

          {/* Rutas protegidas con Layout Principal */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="my-progress" element={guardedRole(<StudentPortalPage />, 'ESTUDIANTE')} />
            <Route path="my-sections" element={guardedRole(<TeacherPortalPage />, 'DOCENTE')} />
            <Route path="my-sections/:id" element={guardedRole(<TeacherSectionPage />, 'DOCENTE')} />
            <Route path="assistant" element={<AssistantPage />} />

            {/* Módulos Académicos */}
            <Route path="university" element={guarded(<UniversityPage />, 'UNIVERSIDAD_VIEW')} />
            <Route
              path="academic"
              element={guarded(<AcademicPage />, undefined, ['PERIODO_VIEW', 'CURSO_VIEW', 'PLAN_VIEW', 'SECCION_VIEW', 'MATRICULA_VIEW'])}
            />
            <Route
              path="evaluation"
              element={guarded(<EvaluationPage />, undefined, ['EVALUACION_VIEW', 'NOTA_VIEW', 'ASISTENCIA_VIEW', 'ACTA_VIEW'])}
            />
            <Route path="teachers" element={guarded(<TeachersPage />, 'DOCENTE_VIEW')} />
            <Route path="students" element={guarded(<StudentsPage />, 'ESTUDIANTE_VIEW')} />

            {/* Administración y Seguridad */}
            <Route path="users" element={guarded(<UsersPage />, 'USUARIO_VIEW')} />
            <Route path="roles" element={guarded(<RolesPage />, 'ROL_VIEW')} />
            <Route path="audit" element={guarded(<AuditPage />, 'AUDITORIA_VIEW')} />
            <Route path="profile" element={<ProfilePage />} />

            <Route path="*" element={<NotFoundPage />} />
          </Route>

          {/* Captura de rutas no coincidentes */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};
