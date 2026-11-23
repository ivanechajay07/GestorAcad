import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Select } from '../components/ui/Select';
import { Card } from '../components/ui/Card';

import { Badge } from '../components/ui/Badge';

import { Button } from '../components/ui/Button';

import { LoadingSpinner } from '../components/ui/LoadingSpinner';

import { Modal } from '../components/ui/Modal';

import { PageHeader } from '../components/ui/PageHeader';
import { FormSummary } from '../components/ui/FormSummary';
import { DatePicker } from '../components/ui/DatePicker';

import { Pagination } from '../components/ui/Pagination';

import { formControlStyle } from '../components/ui/formStyles';

import { Toolbar } from '../components/ui/Toolbar';

import { ViewToggle } from '../components/ui/ViewToggle';

import { ActionMenu } from '../components/ui/ActionMenu';

import { useAuth } from '../contexts/AuthContext';

import { useConfirm } from '../contexts/ConfirmContext';

import { useToast } from '../contexts/ToastContext';

import { teacherService } from '../services/teacherService';
import { reportService } from '../services/reportService';

import type {

  TeacherAssignmentDto,

  TeacherDto,

  TeacherSpecialtyDto,

} from '../services/teacherService';

import { userService } from '../services/userService';

import type { UserResponse } from '../services/userService';

import { universityService } from '../services/universityService';

import type { FacultyDto } from '../services/universityService';

import { getApiErrorMessage, getApiFieldErrors } from '../utils/apiErrors';

import { defaultListViewMode } from '../utils/viewMode';

import { readImageAsDataUrl } from '../utils/imageUpload';

import { isPasswordSecure } from '../utils/passwordPolicy';

import {

  BookOpen,

  Building2,

  CalendarDays,

  Clock,

  FileText,

  GraduationCap,

  GraduationCap as DegreeIcon,

  Hash,

  ImagePlus,

  Layers,

  Download,

  Mail,

  MapPin,

  Pencil,

  Phone,

  Plus,

  Power,

  RefreshCw,

  Search,

  Trash2,

  UserRound,

} from 'lucide-react';



const CATEGORIES: { value: string; label: string }[] = [

  { value: 'PRINCIPAL', label: 'Profesor Principal' },

  { value: 'ASOCIADO', label: 'Profesor Asociado' },

  { value: 'AUXILIAR', label: 'Profesor Auxiliar' },

  { value: 'CONTRATADO', label: 'Profesor Contratado' },

];



const DEDICATIONS: { value: string; label: string }[] = [

  { value: 'TIEMPO_COMPLETO', label: 'Tiempo Completo' },

  { value: 'TIEMPO_PARCIAL', label: 'Tiempo Parcial' },

  { value: 'DEDICACION_EXCLUSIVA', label: 'Dedicación Exclusiva' },

];



const TEACHER_FORM_STEPS = [

  { title: 'Identidad y contacto', description: 'Datos personales y canales' },

  { title: 'Trayectoria académica', description: 'Cargo, grado y facultad' },

  { title: 'Acceso y confirmación', description: 'Cuenta y resumen' },

];



const LEVELS: { value: string; label: string }[] = [

  { value: 'BACHILLER', label: 'Bachiller' },

  { value: 'ESPECIALIDAD', label: 'Especialidad' },

  { value: 'MAESTRIA', label: 'Maestría' },

  { value: 'DOCTORADO', label: 'Doctorado' },

  { value: 'DIPLOMADO', label: 'Diplomado' },

];



const ASSIGNMENT_STATUS: { value: string; label: string }[] = [

  { value: 'ASIGNADA', label: 'Asignada' },

  { value: 'EN_CURSO', label: 'En curso' },

  { value: 'CONCLUIDA', label: 'Concluida' },

  { value: 'RETIRADA', label: 'Retirada' },

];



const CATEGORY_LABEL = (value?: string) =>

  CATEGORIES.find((c) => c.value === value)?.label ?? value ?? '—';



const inputStyle = formControlStyle;



const errMsg = (err: unknown, fallback: string): string => getApiErrorMessage(err, fallback);



const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;



/** Campo del DTO -> paso del asistente, para saltar al primer error del servidor. */

const TEACHER_FIELD_STEPS: Record<string, number> = {

  code: 0,

  documentId: 0,

  firstName: 0,

  lastName: 0,

  email: 0,

  phone: 0,

  address: 0,

  category: 1,

  dedication: 1,

  academicDegree: 1,

  professionalTitle: 1,

  faculty: 1,

  department: 1,

  mainSpecialty: 1,

  hireDate: 1,

  userId: 2,

};



const Field: React.FC<{

  label: string;

  children: React.ReactNode;

  hint?: string;

  icon?: React.ReactNode;

  error?: string;

}> = ({ label, children, hint, icon, error }) => (

  <label className={`field${error ? ' field--invalid' : ''}`}>

    <span className="field-label">

      {icon && <span className="field-label__icon" aria-hidden="true">{icon}</span>}

      {label}

    </span>

    {children}

    {error && <span className="field-error" role="alert">{error}</span>}

    {hint && <span className="field-hint">{hint}</span>}

  </label>

);



const emptyTeacher = (): TeacherDto => ({

  code: '',

  firstName: '',

  lastName: '',

  category: 'CONTRATADO',

  dedication: 'TIEMPO_COMPLETO',

  avatar: '',

});



export const TeachersPage: React.FC = () => {

  const { hasPermission } = useAuth();

  const { confirm } = useConfirm();

  const toast = useToast();
  const canExport = hasPermission('DOCENTE_EXPORT');
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const filename = await reportService.exportTeachers();
      toast.success(`Exportación generada: ${filename}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo generar la exportación');
    } finally {
      setExporting(false);
    }
  };



  const [teachers, setTeachers] = useState<TeacherDto[]>([]);

  const [facultyCatalog, setFacultyCatalog] = useState<FacultyDto[]>([]);

  const [loading, setLoading] = useState(true);



  const [searchQuery, setSearchQuery] = useState('');

  const [selectedFaculty, setSelectedFaculty] = useState('ALL');

  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const [viewMode, setViewMode] = useState<'cards' | 'table'>(defaultListViewMode);

  const [page, setPage] = useState(1);

  const PAGE_SIZE = 8;



  const [teacherModal, setTeacherModal] = useState(false);

  const [teacherStep, setTeacherStep] = useState(0);

  const [teacherForm, setTeacherForm] = useState<TeacherDto>(emptyTeacher());

  const teacherFormRef = useRef<HTMLFormElement>(null);

  const teacherStepRef = useRef<HTMLDivElement>(null);

  const [linkableUsers, setLinkableUsers] = useState<UserResponse[]>([]);

  const canLinkAccounts = hasPermission('DOCENTE_EDIT') && hasPermission('USUARIO_VIEW');

  const canCreateAccounts = hasPermission('USUARIO_CREATE');

  const [accountMode, setAccountMode] = useState<'link' | 'create'>('link');

  const [accountForm, setAccountForm] = useState({ username: '', email: '', password: '' });

  const [formError, setFormError] = useState<string | null>(null);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [isSubmitting, setIsSubmitting] = useState(false);



  const [manageTeacher, setManageTeacher] = useState<TeacherDto | null>(null);

  const [manageTab, setManageTab] = useState<'specialties' | 'assignments'>('specialties');

  const [specialties, setSpecialties] = useState<TeacherSpecialtyDto[]>([]);

  const [assignments, setAssignments] = useState<TeacherAssignmentDto[]>([]);

  const [specialtyForm, setSpecialtyForm] = useState<TeacherSpecialtyDto | null>(null);

  const [assignmentForm, setAssignmentForm] = useState<TeacherAssignmentDto | null>(null);

  const [manageError, setManageError] = useState<string | null>(null);

  const [manageLoading, setManageLoading] = useState(false);



  const canCreate = hasPermission('DOCENTE_CREATE');

  const canEdit = hasPermission('DOCENTE_EDIT');

  const canDelete = hasPermission('DOCENTE_DELETE');

  const canManageSpecialty = hasPermission('ESPECIALIDAD_CREATE');

  const canManageAssignment = hasPermission('ASIGNACION_CREATE');



  const reload = useCallback(async () => {

    setLoading(true);

    const catalogTasks: Promise<unknown>[] = [];

    if (hasPermission('FACULTAD_VIEW')) {

      catalogTasks.push(universityService.getFaculties().then((res) => setFacultyCatalog(res.data)));

    }

    try {

      const [teachersResult] = await Promise.allSettled([

        teacherService.getTeachers(),

        ...catalogTasks,

      ]);

      if (teachersResult.status === 'fulfilled') {

        setTeachers(teachersResult.value.data);

      } else {

        toast.error(errMsg(teachersResult.reason, 'No se pudo cargar el claustro docente'));

      }

    } finally {

      setLoading(false);

    }

  }, [hasPermission, toast]);



  useEffect(() => {

    reload();

  }, [reload]);



  useEffect(() => {

    if (!canLinkAccounts) return;

    userService

      .getAllUsers()

      .then((response) => {

        setLinkableUsers(

          response.data.filter(

            (item) => item.active && item.roles.includes('ROLE_DOCENTE')

          )

        );

      })

      .catch(() => undefined);

  }, [canLinkAccounts]);



  useEffect(() => {

    setPage(1);

  }, [searchQuery, selectedFaculty, selectedCategory, viewMode]);



  const flashSuccess = (message: string) => toast.success(message);



  const faculties = useMemo(() => {

    const names = new Set(facultyCatalog.map((f) => f.name));

    teachers.forEach((t) => {

      if (t.faculty) names.add(t.faculty);

    });

    return Array.from(names).sort((a, b) => a.localeCompare(b, 'es'));

  }, [facultyCatalog, teachers]);



  const facultyOptions = useMemo(() => {

    const options = facultyCatalog

      .filter((f) => f.active !== false || f.name === teacherForm.faculty)

      .map((f) => ({ name: f.name, active: f.active !== false }));

    if (teacherForm.faculty && !options.some((o) => o.name === teacherForm.faculty)) {

      options.unshift({ name: teacherForm.faculty, active: false });

    }

    return options;

  }, [facultyCatalog, teacherForm.faculty]);



  const filteredTeachers = useMemo(

    () =>

      teachers.filter((t) => {

        const term = searchQuery.toLowerCase();

        const matchesSearch =

          !term ||

          `${t.firstName} ${t.lastName}`.toLowerCase().includes(term) ||

          t.code.toLowerCase().includes(term) ||

          (t.department ?? '').toLowerCase().includes(term) ||

          (t.email ?? '').toLowerCase().includes(term);

        const matchesFaculty = selectedFaculty === 'ALL' || t.faculty === selectedFaculty;

        const matchesCategory = selectedCategory === 'ALL' || t.category === selectedCategory;

        return matchesSearch && matchesFaculty && matchesCategory;

      }),

    [teachers, searchQuery, selectedFaculty, selectedCategory]

  );



  /* ------------------------------ Docentes ------------------------------ */

  const openTeacherModal = (teacher?: TeacherDto) => {

    setFormError(null);

    setFieldErrors({});

    setTeacherStep(0);

    setTeacherForm(teacher ? { ...teacher } : emptyTeacher());

    const availableLinks = linkableUsers.filter(

      (candidate) => !teachers.some((item) => item.userId === candidate.id && item.id !== teacher?.id)

    );

    const shouldCreate = !teacher?.userId && availableLinks.length === 0 && canCreateAccounts;

    setAccountMode(shouldCreate ? 'create' : 'link');

    const suggestedUsername = teacher?.code

      ? `docente.${teacher.code.toLowerCase().replace(/[^a-z0-9._-]+/g, '')}`

      : '';

    setAccountForm({

      username: shouldCreate ? suggestedUsername : '',

      email: teacher?.email ?? '',

      password: '',

    });

    setTeacherModal(true);

  };



  const focusTeacherStep = () => {

    window.setTimeout(() => {

      teacherStepRef.current?.focus({ preventScroll: true });

      teacherStepRef.current?.scrollTo({ top: 0 });

    }, 0);

  };



  const validateTeacherStep = (step: number): Record<string, string> => {

    const errors: Record<string, string> = {};

    const code = teacherForm.code.trim();

    const firstName = teacherForm.firstName.trim();

    const lastName = teacherForm.lastName.trim();

    const documentId = teacherForm.documentId?.trim() ?? '';

    const email = teacherForm.email?.trim() ?? '';

    const phone = teacherForm.phone?.trim() ?? '';

    const address = teacherForm.address?.trim() ?? '';



    if (step === 0) {

      if (!code) errors.code = 'El código institucional es obligatorio.';

      else if (code.length > 20) errors.code = 'El código no puede exceder 20 caracteres.';

      if (!firstName) errors.firstName = 'Los nombres son obligatorios.';

      else if (firstName.length > 150) errors.firstName = 'Los nombres no pueden exceder 150 caracteres.';

      if (!lastName) errors.lastName = 'Los apellidos son obligatorios.';

      else if (lastName.length > 150) errors.lastName = 'Los apellidos no pueden exceder 150 caracteres.';

      if (documentId.length > 20) errors.documentId = 'El documento no puede exceder 20 caracteres.';

      if (email && !EMAIL_PATTERN.test(email)) errors.email = 'El correo institucional no es válido.';

      else if (email.length > 100) errors.email = 'El correo no puede exceder 100 caracteres.';

      if (phone.length > 25) errors.phone = 'El teléfono no puede exceder 25 caracteres.';

      if (address.length > 255) errors.address = 'La dirección no puede exceder 255 caracteres.';

    }



    if (step === 1) {

      if (!teacherForm.category?.trim()) errors.category = 'La categoría docente es obligatoria.';

      if (!teacherForm.dedication?.trim()) errors.dedication = 'La dedicación docente es obligatoria.';

      if (!teacherForm.faculty?.trim()) errors.faculty = 'Selecciona una facultad.';

      if ((teacherForm.academicDegree ?? '').length > 200) errors.academicDegree = 'El grado académico no puede exceder 200 caracteres.';

      if ((teacherForm.professionalTitle ?? '').length > 200) errors.professionalTitle = 'El título profesional no puede exceder 200 caracteres.';

      if ((teacherForm.faculty ?? '').length > 150) errors.faculty = 'La facultad no puede exceder 150 caracteres.';

      if ((teacherForm.department ?? '').length > 150) errors.department = 'El departamento no puede exceder 150 caracteres.';

      if ((teacherForm.mainSpecialty ?? '').length > 200) errors.mainSpecialty = 'La especialidad no puede exceder 200 caracteres.';

    }



    if (step === 2) {

      const wantsCreate = canCreateAccounts && !teacherForm.userId && (!canLinkAccounts || accountMode === 'create');

      if (wantsCreate) {

        if (!accountForm.username.trim()) {

          errors.accountUsername = 'El nombre de usuario es obligatorio.';

        } else if (accountForm.username.trim().length < 3) {

          errors.accountUsername = 'El usuario debe tener al menos 3 caracteres.';

        }

        if (!accountForm.email.trim()) {

          errors.accountEmail = 'El correo de la cuenta es obligatorio.';

        } else if (!EMAIL_PATTERN.test(accountForm.email.trim())) {

          errors.accountEmail = 'El correo de la cuenta no es válido.';

        }

        if (!isPasswordSecure(accountForm.password)) {

          errors.accountPassword = 'Usa al menos 8 caracteres con mayúscula, minúscula, número y símbolo.';

        }

      } else if (canLinkAccounts && !teacherForm.userId) {

        errors.userId = 'Selecciona la cuenta de usuario del docente.';

      }

    }

    return errors;

  };



  const goTeacherStep = (target: number) => {

    const next = Math.max(0, Math.min(TEACHER_FORM_STEPS.length - 1, target));

    if (next > teacherStep) {

      for (let step = teacherStep; step < next; step += 1) {

        const errors = validateTeacherStep(step);

        if (Object.keys(errors).length > 0) {

          setTeacherStep(step);

          setFieldErrors(errors);

          setFormError(Object.values(errors)[0]);

          focusTeacherStep();

          return;

        }

      }

    }

    setFieldErrors({});

    setFormError(null);

    setTeacherStep(next);

    focusTeacherStep();

  };



  const handleSaveTeacher = async (e: React.FormEvent) => {

    e.preventDefault();

    if (teacherStep < TEACHER_FORM_STEPS.length - 1) {

      goTeacherStep(teacherStep + 1);

      return;

    }

    for (let step = 0; step < TEACHER_FORM_STEPS.length; step += 1) {

      const errors = validateTeacherStep(step);

      if (Object.keys(errors).length > 0) {

        setTeacherStep(step);

        setFieldErrors(errors);

        setFormError(Object.values(errors)[0]);

        focusTeacherStep();

        return;

      }

    }

    setIsSubmitting(true);

    setFormError(null);

    setFieldErrors({});

    let createdAccountId: number | null = null;

    try {

      const wantsCreate = canCreateAccounts && !teacherForm.userId && (!canLinkAccounts || accountMode === 'create');

      let payload = { ...teacherForm };

      if (wantsCreate) {

        const account = await userService.createUser({

          username: accountForm.username.trim(),

          email: accountForm.email.trim(),

          password: accountForm.password,

          firstName: teacherForm.firstName.trim(),

          lastName: teacherForm.lastName.trim(),

          phone: teacherForm.phone,

          department: teacherForm.department || teacherForm.faculty,

          avatar: teacherForm.avatar,

          roles: ['ROLE_DOCENTE'],

        });

        createdAccountId = account.data.id;

        payload = { ...payload, userId: account.data.id };

      }

      if (teacherForm.id) {

        await teacherService.updateTeacher(teacherForm.id, payload);

      } else {

        await teacherService.createTeacher(payload);

      }

      setTeacherModal(false);

      flashSuccess(teacherForm.id ? 'Docente actualizado correctamente.' : 'Docente registrado correctamente.');

      await reload();

    } catch (err) {

      if (createdAccountId) {

        await userService.toggleStatus(createdAccountId, false).catch(() => undefined);

      }

      const apiErrors = getApiFieldErrors(err);

      setFieldErrors(apiErrors);

      const apiStep = Object.keys(apiErrors).reduce<number | null>((min, field) => {

        const step = TEACHER_FIELD_STEPS[field];

        if (step == null) return min;

        return min == null ? step : Math.min(min, step);

      }, null);

      if (apiStep != null) {

        setTeacherStep(apiStep);

        focusTeacherStep();

      }

      setFormError(errMsg(err, 'Error al guardar el docente'));

    } finally {

      setIsSubmitting(false);

    }

  };



  const handleDeleteTeacher = async (teacher: TeacherDto) => {

    if (!teacher.id) return;

    const confirmed = await confirm({

      title: 'Eliminar registro del docente',

      message: `¿Eliminar el registro de ${teacher.firstName} ${teacher.lastName}? Dejará de aparecer en el claustro activo.`,

      confirmLabel: 'Eliminar registro',

      variant: 'danger',

    });

    if (!confirmed) return;

    try {

      await teacherService.deleteTeacher(teacher.id);

      setTeachers((prev) => prev.map((t) => (t.id === teacher.id ? { ...t, active: false } : t)));

      flashSuccess('Registro de docente eliminado.');

    } catch (err) {

      toast.error(errMsg(err, 'Error al eliminar el registro del docente'));

    }

  };



  const handleToggleTeacher = async (teacher: TeacherDto) => {

    if (!teacher.id) return;

    const next = teacher.active === false;

    if (!next) {

      const ok = await confirm({

        title: 'Deshabilitar docente',

        message: `¿Deshabilitar al docente ${teacher.firstName} ${teacher.lastName}? No aparecerá como activo en el claustro.`,

        confirmLabel: 'Deshabilitar',

        variant: 'danger',

      });

      if (!ok) return;

    }

    try {

      await teacherService.toggleTeacherStatus(teacher.id, next);

      setTeachers((prev) => prev.map((t) => (t.id === teacher.id ? { ...t, active: next } : t)));

      flashSuccess(next ? 'Docente habilitado.' : 'Docente deshabilitado.');

    } catch (err) {

      toast.error(errMsg(err, 'Error al cambiar el estado del docente'));

    }

  };



  /* --------------------- Gestión (especialidades / carga) --------------------- */

  const openManage = async (teacher: TeacherDto) => {

    if (!teacher.id) return;

    setManageTeacher(teacher);

    setManageTab('specialties');

    setSpecialtyForm(null);

    setAssignmentForm(null);

    setManageError(null);

    setManageLoading(true);

    try {

      const [esp, asg] = await Promise.all([

        teacherService.getSpecialties(teacher.id),

        teacherService.getAssignments(teacher.id),

      ]);

      setSpecialties(esp.data);

      setAssignments(asg.data);

    } catch (err) {

      setManageError(errMsg(err, 'No se pudo cargar la información del docente'));

    } finally {

      setManageLoading(false);

    }

  };



  const handleSaveSpecialty = async (e: React.FormEvent) => {

    e.preventDefault();

    if (!specialtyForm || !manageTeacher?.id) return;

    setIsSubmitting(true);

    setManageError(null);

    try {

      if (specialtyForm.id) {

        await teacherService.updateSpecialty(specialtyForm.id, specialtyForm);

      } else {

        await teacherService.createSpecialty(manageTeacher.id, specialtyForm);

      }

      const res = await teacherService.getSpecialties(manageTeacher.id);

      setSpecialties(res.data);

      setSpecialtyForm(null);

      flashSuccess('Especialidad guardada correctamente.');

    } catch (err) {

      setManageError(errMsg(err, 'Error al guardar la especialidad'));

    } finally {

      setIsSubmitting(false);

    }

  };



  const handleDeleteSpecialty = async (specialty: TeacherSpecialtyDto) => {

    if (!specialty.id) return;

    const confirmed = await confirm({

      title: 'Eliminar especialidad',

      message: `¿Eliminar la especialidad "${specialty.name}"?`,

      confirmLabel: 'Eliminar',

      variant: 'danger',

    });

    if (!confirmed) return;

    try {

      await teacherService.deleteSpecialty(specialty.id);

      setSpecialties((prev) => prev.filter((s) => s.id !== specialty.id));

      flashSuccess('Especialidad eliminada.');

    } catch (err) {

      setManageError(errMsg(err, 'Error al eliminar la especialidad'));

    }

  };



  const handleSaveAssignment = async (e: React.FormEvent) => {

    e.preventDefault();

    if (!assignmentForm || !manageTeacher?.id) return;

    setIsSubmitting(true);

    setManageError(null);

    try {

      if (assignmentForm.id) {

        await teacherService.updateAssignment(assignmentForm.id, assignmentForm);

      } else {

        await teacherService.createAssignment(manageTeacher.id, assignmentForm);

      }

      const res = await teacherService.getAssignments(manageTeacher.id);

      setAssignments(res.data);

      setAssignmentForm(null);

      flashSuccess('Asignación lectiva guardada correctamente.');

      await reload();

    } catch (err) {

      setManageError(errMsg(err, 'Error al guardar la asignación lectiva'));

    } finally {

      setIsSubmitting(false);

    }

  };



  const handleDeleteAssignment = async (assignment: TeacherAssignmentDto) => {

    if (!assignment.id) return;

    const confirmed = await confirm({

      title: 'Eliminar asignación',

      message: `¿Eliminar la asignación "${assignment.course}"?`,

      confirmLabel: 'Eliminar',

      variant: 'danger',

    });

    if (!confirmed) return;

    try {

      await teacherService.deleteAssignment(assignment.id);

      setAssignments((prev) => prev.filter((a) => a.id !== assignment.id));

      flashSuccess('Asignación eliminada.');

      await reload();

    } catch (err) {

      setManageError(errMsg(err, 'Error al eliminar la asignación'));

    }

  };



  const setTeacherField = (field: keyof TeacherDto, value: string | number | undefined) => {

    setTeacherForm((prev) => ({ ...prev, [field]: value }));

    setFieldErrors((prev) => {

      if (!prev[field]) return prev;

      const next = { ...prev };

      delete next[field];

      return next;

    });

  };



  const handleTeacherAvatarFile = async (event: React.ChangeEvent<HTMLInputElement>) => {

    const file = event.target.files?.[0];

    if (!file) return;

    try {

      const dataUrl = await readImageAsDataUrl(file);

      setTeacherField('avatar', dataUrl);

    } catch (err) {

      setFieldErrors((prev) => ({ ...prev, avatar: errMsg(err, 'No se pudo cargar la imagen') }));

    } finally {

      event.target.value = '';

    }

  };



  const manageTabButton = (key: 'specialties' | 'assignments', label: string) => (

    <button

      type="button"

      onClick={() => {

        setManageTab(key);

        setSpecialtyForm(null);

        setAssignmentForm(null);

      }}

      className={`tab${manageTab === key ? ' active' : ''}`}

    >

      {label}

    </button>

  );



  const teacherAccountMode = canCreateAccounts && !teacherForm.userId

    && (!canLinkAccounts || accountMode === 'create')

    ? 'create'

    : 'link';



  const startTeacherAccountCreation = () => {

    setAccountMode('create');

    setAccountForm((prev) => ({

      ...prev,

      username: prev.username || (teacherForm.code

        ? `docente.${teacherForm.code.toLowerCase().replace(/[^a-z0-9._-]+/g, '')}`

        : ''),

      email: prev.email || teacherForm.email || '',

    }));

  };



  return (

    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      <PageHeader

        title="Directorio de Docentes & Carga Lectiva"

        icon={<GraduationCap size={28} />}

        accent="var(--primary)"

        breadcrumbs={[{ label: 'Gestión Académica' }, { label: 'Claustro Docente' }]}

        badges={

          <Badge variant="success" dot>Claustro Académico</Badge>

        }

        actions={

          <>

            <Button variant="outline" leftIcon={<RefreshCw size={16} />} onClick={reload} isLoading={loading}>

              Actualizar

            </Button>

            {canCreate && (

              <Button variant="primary" leftIcon={<Plus size={16} />} onClick={() => openTeacherModal()}>

                Registrar Docente

              </Button>

            )}

          </>

        }

        stats={[

          { label: 'Docentes', value: teachers.length },

          { label: 'Activos', value: teachers.filter((t) => t.active !== false).length },

          { label: 'Facultades', value: faculties.length },

          { label: 'Horas/sem', value: teachers.reduce((a, t) => a + (t.weeklyLoad ?? 0), 0) },

        ]}

      />



      {/* Controles y Filtros */}

      <Toolbar

        actions={

          <>

            {canExport && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleExport}
                isLoading={exporting}
                leftIcon={<Download size={15} />}
              >
                Exportar padrón
              </Button>
            )}

            <ViewToggle value={viewMode} onChange={setViewMode} />

          </>

        }

      >

        <div className="search-box">

          <Search size={16} color="var(--text-muted)" />

          <input

            type="text"

            placeholder="Buscar por nombre, código, departamento o correo..."

            value={searchQuery}

            onChange={(e) => setSearchQuery(e.target.value)}

          />

        </div>



        <Select className="field-select" aria-label="Filtrar por facultad" value={selectedFaculty} onChange={(e) => setSelectedFaculty(e.target.value)}>

          <option value="ALL">Todas las Facultades</option>

          {faculties.map((f) => (

            <option key={f} value={f}>{f}</option>

          ))}

        </Select>



        <Select className="field-select" aria-label="Filtrar por categoría" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>

          <option value="ALL">Todas las Categorías</option>

          {CATEGORIES.map((c) => (

            <option key={c.value} value={c.value}>{c.label}</option>

          ))}

        </Select>

      </Toolbar>



      {loading ? (

        <LoadingSpinner message="Consultando el claustro docente en la base de datos..." />

      ) : (

        <>

          {/* Renderizado en Tarjetas */}

          {viewMode === 'cards' && (

            <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(340px, 100%), 1fr))', gap: '18px' }}>

              {filteredTeachers.map((t) => (

                <Card key={t.id} interactive className="card-fill">

                  <div className="entity-card-v2">

                    <div className="entity-head">

                      <span className="entity-avatar">
                        {t.avatar
                          ? <img src={t.avatar} alt="" />
                          : (t.firstName?.[0]?.toUpperCase() || 'D')}
                      </span>

                      <div className="entity-id">

                        <h4>{t.firstName} {t.lastName}</h4>

                        <span className="entity-code">{t.code}</span>

                      </div>

                      <div className="entity-badges">

                        <Badge variant={t.category === 'PRINCIPAL' ? 'primary' : 'outline'} size="sm">{CATEGORY_LABEL(t.category)}</Badge>

                        <Badge variant={t.active === false ? 'danger' : 'success'} size="sm" dot>

                          {t.active === false ? 'Inactivo' : 'Activo'}

                        </Badge>

                      </div>

                    </div>



                    <div className="entity-info">

                      <div className="entity-row"><DegreeIcon size={15} /> {t.academicDegree || '—'}</div>

                      <div className="entity-row"><Building2 size={15} /> {t.faculty || '—'}</div>

                      <div className="entity-row"><Layers size={15} /> {t.department || '—'}</div>


                    </div>



                    <div className="entity-stats">

                      <div><span className="v">{t.weeklyLoad ?? 0}h</span><span className="l">carga/sem</span></div>

                      <div><span className="v">{t.assignmentCount ?? 0}</span><span className="l">cátedras</span></div>

                      <div><span className="v">{t.specialtyCount ?? 0}</span><span className="l">especialidades</span></div>

                    </div>



                    <div className="entity-actions">

                      <button type="button" className="ghost-btn info" onClick={() => openManage(t)}>

                        <BookOpen size={14} /> Gestionar

                      </button>

                      {canEdit && (

                        <button type="button" className="ghost-btn primary" onClick={() => openTeacherModal(t)}>

                          <Pencil size={14} /> Editar

                        </button>

                      )}

                      <ActionMenu

                        label={`Más acciones para ${t.firstName} ${t.lastName}`}

                        items={[

                          {

                            label: t.active === false ? 'Habilitar' : 'Deshabilitar',

                            icon: <Power size={14} />,

                            onClick: () => handleToggleTeacher(t),

                            hidden: !canEdit,

                          },

                          {

                            label: 'Eliminar registro',

                            icon: <Trash2 size={14} />,

                            onClick: () => handleDeleteTeacher(t),

                            variant: 'danger',

                            hidden: !(canDelete && t.active !== false),

                          },

                        ]}

                      />

                    </div>

                  </div>

                </Card>

              ))}

              {filteredTeachers.length === 0 && (

                <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-base)' }}>No se encontraron docentes con los filtros aplicados.</p>

              )}

            </div>

          )}



          {/* Renderizado en Tabla */}

          {viewMode === 'table' && (

            <Card>

              <p className="table-scroll-hint">Desliza para ver más columnas →</p>

              <div className="data-table-wrap">

                <table className="data-table data-table--stack table--teachers">
                  <colgroup>
                    <col style={{ width: '9%' }} />
                    <col style={{ width: '29%' }} />
                    <col style={{ width: '14%' }} />
                    <col style={{ width: '19%' }} />
                    <col style={{ width: '8%' }} />
                    <col style={{ width: '9%' }} />
                    <col style={{ width: '12%' }} />
                  </colgroup>

                  <thead>

                    <tr>

                      <th>Código</th>

                      <th>Docente</th>

                      <th>Categoría</th>

                      <th>Facultad</th>


                      <th>Horas</th>

                      <th>Estado</th>

                      <th style={{ textAlign: 'center' }}>Acciones</th>

                    </tr>

                  </thead>

                  <tbody>

                    {filteredTeachers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((t) => (

                      <tr key={t.id}>

                        <td className="cell-strong cell-mono table-code">{t.code}</td>

                        <td className="cell-strong">
                          <div className="table-person">
                            <span className="table-avatar" aria-hidden="true">
                              {t.avatar
                                ? <img src={t.avatar} alt="" />
                                : (t.firstName?.[0] ?? '') + (t.lastName?.[0] ?? '')}
                            </span>
                            <div className="table-person__copy">
                              <span title={`${t.firstName} ${t.lastName}`}>{t.firstName} {t.lastName}</span>
                              <small>{t.academicDegree || '—'}</small>
                            </div>
                          </div>
                        </td>

                        <td><Badge variant="outline" size="sm">{CATEGORY_LABEL(t.category)}</Badge></td>

                        <td title={t.faculty || undefined}>{t.faculty || '-'}</td>


                        <td style={{ fontWeight: 700, color: 'var(--accent-emerald)' }}>{t.weeklyLoad ?? 0} h</td>

                        <td>

                          <Badge variant={t.active === false ? 'danger' : 'success'} size="sm">{t.active === false ? 'Inactivo' : 'Activo'}</Badge>

                        </td>

                        <td>

                          <div className="action-group">

                            <button type="button" className="action-btn info" title="Gestionar" aria-label="Gestionar" onClick={() => openManage(t)}>

                              <BookOpen size={15} />

                            </button>

                            {canEdit && (

                              <button type="button" className="action-btn primary" title="Editar" aria-label="Editar" onClick={() => openTeacherModal(t)}>

                                <Pencil size={15} />

                              </button>

                            )}

                            <ActionMenu

                              className="action-menu__trigger--sm"

                              label={`Más acciones para ${t.firstName} ${t.lastName}`}

                              items={[

                                {

                                  label: t.active === false ? 'Habilitar' : 'Deshabilitar',

                                  icon: <Power size={14} />,

                                  onClick: () => handleToggleTeacher(t),

                                  hidden: !canEdit,

                                },

                                {

                                  label: 'Eliminar registro',

                                  icon: <Trash2 size={14} />,

                                  onClick: () => handleDeleteTeacher(t),

                                  variant: 'danger',

                                  hidden: !(canDelete && t.active !== false),

                                },

                              ]}

                            />

                          </div>

                        </td>

                      </tr>

                    ))}

                    {filteredTeachers.length === 0 && (

                      <tr>

                        <td colSpan={8} style={{ color: 'var(--text-muted)' }}>No se encontraron docentes.</td>

                      </tr>

                    )}

                  </tbody>

                </table>

              </div>

              <Pagination page={page} pageSize={PAGE_SIZE} total={filteredTeachers.length} onChange={setPage} itemLabel="docentes" />

            </Card>

          )}

        </>

      )}



      {/* Modal Docente */}

      {teacherModal && (

        <Modal

          title={teacherForm.id ? 'Editar Docente' : 'Registrar Docente'}

          subtitle="Registre los datos personales, académicos y de contacto del docente."

          icon={<GraduationCap size={20} color="var(--primary)" />}

          maxWidth="780px"

          onClose={() => setTeacherModal(false)}

        >

          {formError && <div role="alert" aria-live="polite" style={{ padding: '10px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--status-down-bg)', color: 'var(--status-down)', fontSize: 'var(--text-sm)', marginBottom: '12px' }}>{formError}</div>}

          <form

            ref={teacherFormRef}

            onSubmit={handleSaveTeacher}

            className="modal-step-form"

          >

            <FormSummary
              icon={<GraduationCap size={18} />}
              title={`${teacherForm.firstName} ${teacherForm.lastName}`.trim() || 'Nuevo docente'}
              subtitle={teacherForm.code || 'Ficha docente'}
              meta={[
                teacherForm.code || teacherForm.firstName ? teacherForm.category || 'Categoría por definir' : 'Categoría por definir',
                teacherForm.faculty || 'Facultad por definir',
              ]}
              progress={Math.round(([teacherForm.code, teacherForm.firstName, teacherForm.lastName, teacherForm.faculty].filter((value) => String(value ?? '').trim()).length / 4) * 100)}
              progressLabel="4 campos clave"
            />

            <div className="institution-stepper modal-form-stepper" aria-label="Pasos del formulario de docente">

              {TEACHER_FORM_STEPS.map((step, index) => (

                <button

                  key={step.title}

                  type="button"

                  className={`institution-step${teacherStep === index ? ' is-active' : ''}${index < teacherStep ? ' is-complete' : ''}`}

                  aria-current={teacherStep === index ? 'step' : undefined}

                  onClick={() => goTeacherStep(index)}

                >

                  <span className="institution-step__number">{index + 1}</span>

                  <span className="institution-step__copy">

                    <strong>{step.title}</strong>

                    <small>{step.description}</small>

                  </span>

                </button>

              ))}

            </div>



            <div

              key={teacherStep}
              ref={teacherStepRef}

              className="modal-step-panel"

              tabIndex={-1}

              aria-label={`${TEACHER_FORM_STEPS[teacherStep].title} del formulario de docente`}

            >

              {teacherStep === 0 && (

                <>

                  <h4 className="modal-step-title"><UserRound size={15} /> Identidad y contacto</h4>

                  <div className="avatar-upload">
                    <span className="avatar-upload__preview">
                      {teacherForm.avatar
                        ? <img src={teacherForm.avatar} alt="Vista previa del avatar del docente" />
                        : <span>{(teacherForm.firstName?.[0] ?? '') + (teacherForm.lastName?.[0] ?? '') || 'D'}</span>}
                    </span>
                    <div className="avatar-upload__copy">
                      <strong>Foto del docente</strong>
                      <small>Se mostrará en su ficha, tarjeta y registro académico.</small>
                      <div className="avatar-upload__actions">
                        <label className="ghost-btn">
                          <ImagePlus size={15} />
                          {teacherForm.avatar ? 'Cambiar foto' : 'Adjuntar foto'}
                          <input type="file" accept="image/*" onChange={handleTeacherAvatarFile} style={{ display: 'none' }} />
                        </label>
                        {teacherForm.avatar && (
                          <button type="button" className="link-action" onClick={() => setTeacherField('avatar', '')}>
                            Quitar foto
                          </button>
                        )}
                      </div>
                      {fieldErrors.avatar && <span className="field-error">{fieldErrors.avatar}</span>}
                    </div>
                  </div>

                  <div className="modal-form-section">
                    <h5 className="modal-form-section__title">Identificación</h5>
                  <div className="modal-field-grid">

                    <Field label="Código institucional" icon={<Hash size={13} />} error={fieldErrors.code}>

                      <input style={inputStyle} required data-autofocus maxLength={20} value={teacherForm.code} onChange={(e) => setTeacherField('code', e.target.value)} placeholder="DOC-202600" />

                    </Field>

                    <Field label="Documento de identidad" icon={<FileText size={13} />} error={fieldErrors.documentId}>

                      <input style={inputStyle} maxLength={20} value={teacherForm.documentId ?? ''} onChange={(e) => setTeacherField('documentId', e.target.value)} placeholder="Ej. 09876543" inputMode="numeric" />

                    </Field>

                    <Field label="Nombres" icon={<UserRound size={13} />} error={fieldErrors.firstName}>

                      <input style={inputStyle} required maxLength={150} value={teacherForm.firstName} onChange={(e) => setTeacherField('firstName', e.target.value)} placeholder="Ej. Carlos Alberto" autoComplete="given-name" />

                    </Field>

                    <Field label="Apellidos" icon={<UserRound size={13} />} error={fieldErrors.lastName}>

                      <input style={inputStyle} required maxLength={150} value={teacherForm.lastName} onChange={(e) => setTeacherField('lastName', e.target.value)} placeholder="Ej. Santana Ríos" autoComplete="family-name" />

                    </Field>

                  </div>
                  </div>
                  <div className="modal-form-section">
                    <h5 className="modal-form-section__title">Contacto</h5>
                    <div className="modal-field-grid">
                    <Field label="Correo institucional" icon={<Mail size={13} />} error={fieldErrors.email}>

                      <input style={inputStyle} type="email" maxLength={100} value={teacherForm.email ?? ''} onChange={(e) => setTeacherField('email', e.target.value)} placeholder="Ej. nombre@gestoracad.edu" autoComplete="email" />

                    </Field>

                    <Field label="Teléfono" icon={<Phone size={13} />} error={fieldErrors.phone}>

                      <input style={inputStyle} type="tel" maxLength={25} value={teacherForm.phone ?? ''} onChange={(e) => setTeacherField('phone', e.target.value)} placeholder="Ej. +51 987 654 321" autoComplete="tel" />

                    </Field>

                  </div>

                  <Field label="Dirección" icon={<MapPin size={13} />} error={fieldErrors.address}>

                    <input style={inputStyle} maxLength={255} value={teacherForm.address ?? ''} onChange={(e) => setTeacherField('address', e.target.value)} placeholder="Ej. Av. Universitaria 1801, Lima" autoComplete="street-address" />

                  </Field>
                  </div>

                </>

              )}



              {teacherStep === 1 && (

                <>

                  <h4 className="modal-step-title"><GraduationCap size={15} /> Trayectoria académica</h4>

                  <div className="modal-field-grid">

                    <Field label="Categoría" icon={<DegreeIcon size={13} />} error={fieldErrors.category}>

                      <Select style={inputStyle} value={teacherForm.category} onChange={(e) => setTeacherField('category', e.target.value)}>

                        {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}

                      </Select>

                    </Field>

                    <Field label="Dedicación" icon={<Clock size={13} />} error={fieldErrors.dedication}>

                      <Select style={inputStyle} value={teacherForm.dedication} onChange={(e) => setTeacherField('dedication', e.target.value)}>

                        {DEDICATIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}

                      </Select>

                    </Field>

                    <Field label="Grado académico" icon={<DegreeIcon size={13} />} error={fieldErrors.academicDegree}>

                      <input style={inputStyle} maxLength={200} value={teacherForm.academicDegree ?? ''} onChange={(e) => setTeacherField('academicDegree', e.target.value)} placeholder="Ej. Doctor en Ciencias (Ph.D.)" />

                    </Field>

                    <Field label="Título profesional" icon={<BookOpen size={13} />} error={fieldErrors.professionalTitle}>

                      <input style={inputStyle} maxLength={200} value={teacherForm.professionalTitle ?? ''} onChange={(e) => setTeacherField('professionalTitle', e.target.value)} placeholder="Ej. Licenciado en Matemática" />

                    </Field>

                    <Field label="Facultad" icon={<Building2 size={13} />} error={fieldErrors.faculty}>

                      <Select

                        style={inputStyle}

                        aria-label="Facultad"

                        value={teacherForm.faculty ?? ''}

                        onChange={(e) => setTeacherField('faculty', e.target.value)}

                      >

                        <option value="">— Seleccione una facultad —</option>

                        {facultyOptions.map((f) => (

                          <option key={f.name} value={f.name}>

                            {f.name}{f.active ? '' : ' (inactiva)'}

                          </option>

                        ))}

                      </Select>

                    </Field>

                    <Field label="Departamento académico" icon={<Layers size={13} />} error={fieldErrors.department}>

                      <input style={inputStyle} maxLength={150} value={teacherForm.department ?? ''} onChange={(e) => setTeacherField('department', e.target.value)} placeholder="Ej. Departamento de Ciencias Básicas" />

                    </Field>

                    <Field label="Especialidad principal" icon={<BookOpen size={13} />} error={fieldErrors.mainSpecialty}>

                      <input style={inputStyle} maxLength={200} value={teacherForm.mainSpecialty ?? ''} onChange={(e) => setTeacherField('mainSpecialty', e.target.value)} placeholder="Ej. Álgebra lineal y análisis numérico" />

                    </Field>

                    <Field label="Fecha de ingreso" icon={<CalendarDays size={13} />} error={fieldErrors.hireDate}>

                      <DatePicker style={inputStyle} ariaLabel="Fecha de contratación" max={new Date().toISOString().slice(0, 10)} value={teacherForm.hireDate ?? ''} onChange={(next) => setTeacherField('hireDate', next)} />

                    </Field>

                  </div>

                  <p className="field-hint">La facultad se toma del catálogo registrado en el módulo Universidad.</p>

                </>

              )}



              {teacherStep === 2 && (

                <>

                  <h4 className="modal-step-title"><UserRound size={15} /> Acceso y confirmación</h4>

                  {(canLinkAccounts || canCreateAccounts) && (
                    <>
                      {canCreateAccounts && !teacherForm.userId && (
                        <div className="account-mode-switch" role="group" aria-label="Forma de acceso">
                          <button
                            type="button"
                            className={teacherAccountMode === 'link' ? 'is-active' : ''}
                            onClick={() => setAccountMode('link')}
                          >
                            Vincular cuenta existente
                          </button>
                          <button
                            type="button"
                            className={teacherAccountMode === 'create' ? 'is-active' : ''}
                            onClick={startTeacherAccountCreation}
                          >
                            Crear cuenta nueva
                          </button>
                        </div>
                      )}

                      {teacherAccountMode === 'link' ? (
                        <Field
                          label="Cuenta de acceso (obligatoria)"
                          icon={<UserRound size={13} />}
                          error={fieldErrors.userId}
                          hint={
                            linkableUsers.filter((candidate) => !teachers.some((item) => item.userId === candidate.id && item.id !== teacherForm.id)).length === 0
                              ? 'No hay cuentas libres con rol DOCENTE. Usa “Crear cuenta nueva”.'
                              : 'Permite que el docente acceda a sus secciones, notas y actas en el portal.'
                          }
                        >
                          <Select
                            style={inputStyle}
                            value={teacherForm.userId && teacherForm.userId > 0 ? teacherForm.userId : ''}
                            onChange={(e) => setTeacherField('userId', e.target.value ? Number(e.target.value) : 0)}
                          >
                            <option value="">Selecciona una cuenta</option>
                            {linkableUsers
                              .filter((candidate) => !teachers.some((item) => item.userId === candidate.id && item.id !== teacherForm.id))
                              .map((candidate) => (
                                <option key={candidate.id} value={candidate.id}>
                                  {candidate.username} · {candidate.email}
                                </option>
                              ))}
                          </Select>
                        </Field>
                      ) : (
                        <>
                          <div className="modal-field-grid">
                            <Field label="Usuario de acceso" icon={<UserRound size={13} />} error={fieldErrors.accountUsername} hint="Se usará para ingresar al portal.">
                              <input
                                style={inputStyle}
                                value={accountForm.username}
                                onChange={(e) => setAccountForm({ ...accountForm, username: e.target.value })}
                                placeholder="ej. docente.doc-202601"
                                autoComplete="username"
                              />
                            </Field>
                            <Field label="Correo de la cuenta" icon={<Mail size={13} />} error={fieldErrors.accountEmail}>
                              <input
                                style={inputStyle}
                                type="email"
                                value={accountForm.email}
                                onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })}
                                placeholder="docente@gestoracad.edu"
                                autoComplete="email"
                              />
                            </Field>
                            <Field
                              label="Contraseña de acceso"
                              icon={<UserRound size={13} />}
                              error={fieldErrors.accountPassword}
                              hint="Mínimo 8 caracteres, mayúscula, minúscula, número y símbolo."
                            >
                              <input
                                style={inputStyle}
                                type="password"
                                value={accountForm.password}
                                onChange={(e) => setAccountForm({ ...accountForm, password: e.target.value })}
                                placeholder="Contraseña segura"
                                autoComplete="new-password"
                              />
                            </Field>
                          </div>
                          <p className="field-hint">
                            Se creará una cuenta activa con rol DOCENTE y quedará vinculada a esta ficha. Guarda la contraseña.
                          </p>
                        </>
                      )}
                    </>
                  )}

                  <div className="form-review" aria-label="Resumen del docente">

                    <div><span>Código</span><strong>{teacherForm.code || '—'}</strong></div>

                    <div><span>Docente</span><strong>{[teacherForm.firstName, teacherForm.lastName].filter(Boolean).join(' ') || '—'}</strong></div>

                    <div><span>Categoría</span><strong>{CATEGORY_LABEL(teacherForm.category)}</strong></div>

                    <div><span>Facultad</span><strong>{teacherForm.faculty || '—'}</strong></div>

                    <div><span>Correo</span><strong>{teacherForm.email || '—'}</strong></div>

                    <div><span>Cuenta</span><strong>{teacherForm.userId ? 'Vinculada' : teacherAccountMode === 'create' ? 'Se creará cuenta nueva' : 'Sin vincular'}</strong></div>

                  </div>

                  <p className="field-hint">Revisa la información. Al guardar, el registro queda sujeto a las validaciones del servidor y a la auditoría.</p>

                </>

              )}

            </div>



            <div className="modal-step-footer">

              <span className="modal-step-indicator">Paso {teacherStep + 1} de {TEACHER_FORM_STEPS.length}</span>

              <div className="modal-step-actions">

                <Button type="button" variant="secondary" onClick={() => setTeacherModal(false)}>Cancelar</Button>

                {teacherStep > 0 && (

                  <Button type="button" variant="secondary" onClick={() => goTeacherStep(teacherStep - 1)}>Anterior</Button>

                )}

                {teacherStep < TEACHER_FORM_STEPS.length - 1 ? (

                  <Button type="button" onClick={() => goTeacherStep(teacherStep + 1)}>Siguiente</Button>

                ) : (

                  <Button type="submit" isLoading={isSubmitting}>{teacherForm.id ? 'Guardar Cambios' : 'Registrar Docente'}</Button>

                )}

              </div>

            </div>

          </form>

        </Modal>

      )}



      {/* Modal de Gestión (Especialidades / Asignaciones) */}

      {manageTeacher && (

        <Modal

          title={`Gestión: ${manageTeacher.firstName} ${manageTeacher.lastName}`}

          icon={<BookOpen size={20} color="var(--accent-cyan)" />}

          maxWidth="760px"

          onClose={() => setManageTeacher(null)}

        >

          {manageError && <div style={{ padding: '10px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--status-down-bg)', color: 'var(--status-down)', fontSize: 'var(--text-sm)', marginBottom: '12px' }}>{manageError}</div>}



          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>

            {manageTabButton('specialties', 'Especialidades Académicas')}

            {manageTabButton('assignments', 'Asignaciones / Carga Lectiva')}

          </div>



          {manageLoading ? (

            <LoadingSpinner message="Cargando información del docente..." />

          ) : manageTab === 'specialties' ? (

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

              {canManageSpecialty && (

                <div>

                  {specialtyForm ? (

                    <form onSubmit={handleSaveSpecialty} className="form-panel">

                      <div className="form-section">Datos de la especialidad</div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: '12px' }}>

                        <Field label="Nombre de la especialidad">

                          <input style={inputStyle} required value={specialtyForm.name} onChange={(e) => setSpecialtyForm({ ...specialtyForm, name: e.target.value })} />

                        </Field>

                        <Field label="Área">

                          <input style={inputStyle} value={specialtyForm.area ?? ''} onChange={(e) => setSpecialtyForm({ ...specialtyForm, area: e.target.value })} />

                        </Field>

                        <Field label="Nivel">

                          <Select style={inputStyle} value={specialtyForm.level} onChange={(e) => setSpecialtyForm({ ...specialtyForm, level: e.target.value })}>

                            {LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}

                          </Select>

                        </Field>

                        <Field label="Año">

                          <input style={inputStyle} type="number" value={specialtyForm.year ?? ''} onChange={(e) => setSpecialtyForm({ ...specialtyForm, year: e.target.value === '' ? undefined : Number(e.target.value) })} />

                        </Field>

                      </div>

                      <Field label="Institución otorgante">

                        <input style={inputStyle} value={specialtyForm.institution ?? ''} onChange={(e) => setSpecialtyForm({ ...specialtyForm, institution: e.target.value })} />

                      </Field>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>

                        <Button type="button" variant="secondary" size="sm" onClick={() => setSpecialtyForm(null)}>Cancelar</Button>

                        <Button type="submit" size="sm" isLoading={isSubmitting}>{specialtyForm.id ? 'Actualizar' : 'Agregar'}</Button>

                      </div>

                    </form>

                  ) : (

                    <Button size="sm" leftIcon={<Plus size={15} />} onClick={() => setSpecialtyForm({ name: '', level: 'MAESTRIA' })}>

                      Agregar Especialidad

                    </Button>

                  )}

                </div>

              )}



              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>

                {specialties.map((s) => (

                  <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', padding: '10px 14px', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)' }}>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>

                      <DegreeIcon size={18} color="var(--accent-amber)" />

                      <div>

                        <div style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text-main)' }}>{s.name}</div>

                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>

                          {LEVELS.find((l) => l.value === s.level)?.label ?? s.level} · {s.institution || 'Sin institución'} {s.year ? `(${s.year})` : ''}

                        </div>

                      </div>

                    </div>

                    {canManageSpecialty && (

                      <div style={{ display: 'flex', gap: '10px' }}>

                        {hasPermission('ESPECIALIDAD_EDIT') && (

                          <button type="button" className="ghost-btn primary" onClick={() => setSpecialtyForm({ ...s })}>

                            <Pencil size={13} /> Editar

                          </button>

                        )}

                        {hasPermission('ESPECIALIDAD_DELETE') && (

                          <button type="button" className="ghost-btn danger" onClick={() => handleDeleteSpecialty(s)}>

                            <Trash2 size={13} /> Eliminar

                          </button>

                        )}

                      </div>

                    )}

                  </div>

                ))}

                {specialties.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-base)' }}>Sin especialidades registradas.</p>}

              </div>

            </div>

          ) : (

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

              {canManageAssignment && (

                <div>

                  {assignmentForm ? (

                    <form onSubmit={handleSaveAssignment} className="form-panel">

                      <div className="form-section">Datos de la asignación</div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: '12px' }}>

                        <Field label="Periodo">

                          <input style={inputStyle} required value={assignmentForm.period} onChange={(e) => setAssignmentForm({ ...assignmentForm, period: e.target.value })} placeholder="2026-I" />

                        </Field>

                        <Field label="Curso / Asignatura">

                          <input style={inputStyle} required value={assignmentForm.course} onChange={(e) => setAssignmentForm({ ...assignmentForm, course: e.target.value })} />

                        </Field>

                        <Field label="Código del curso">

                          <input style={inputStyle} value={assignmentForm.courseCode ?? ''} onChange={(e) => setAssignmentForm({ ...assignmentForm, courseCode: e.target.value })} />

                        </Field>

                        <Field label="Sección">

                          <input style={inputStyle} value={assignmentForm.section ?? ''} onChange={(e) => setAssignmentForm({ ...assignmentForm, section: e.target.value })} />

                        </Field>

                        <Field label="Créditos">

                          <input style={inputStyle} type="number" min={0} value={assignmentForm.credits ?? ''} onChange={(e) => setAssignmentForm({ ...assignmentForm, credits: e.target.value === '' ? undefined : Number(e.target.value) })} />

                        </Field>

                        <Field label="Estado">

                          <Select style={inputStyle} value={assignmentForm.status} onChange={(e) => setAssignmentForm({ ...assignmentForm, status: e.target.value })}>

                            {ASSIGNMENT_STATUS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}

                          </Select>

                        </Field>

                        <Field label="Horas teóricas">

                          <input style={inputStyle} type="number" min={0} value={assignmentForm.theoryHours ?? ''} onChange={(e) => setAssignmentForm({ ...assignmentForm, theoryHours: e.target.value === '' ? 0 : Number(e.target.value) })} />

                        </Field>

                        <Field label="Horas prácticas">

                          <input style={inputStyle} type="number" min={0} value={assignmentForm.practiceHours ?? ''} onChange={(e) => setAssignmentForm({ ...assignmentForm, practiceHours: e.target.value === '' ? 0 : Number(e.target.value) })} />

                        </Field>

                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>

                        <Button type="button" variant="secondary" size="sm" onClick={() => setAssignmentForm(null)}>Cancelar</Button>

                        <Button type="submit" size="sm" isLoading={isSubmitting}>{assignmentForm.id ? 'Actualizar' : 'Agregar'}</Button>

                      </div>

                    </form>

                  ) : (

                    <Button size="sm" leftIcon={<Plus size={15} />} onClick={() => setAssignmentForm({ period: '2026-I', course: '', status: 'ASIGNADA', theoryHours: 0, practiceHours: 0 })}>

                      Agregar Asignación

                    </Button>

                  )}

                </div>

              )}



              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>

                {assignments.map((a) => (

                  <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', padding: '10px 14px', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)' }}>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>

                      <Layers size={18} color="var(--accent-cyan)" />

                      <div>

                        <div style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text-main)' }}>

                          {a.course} {a.courseCode ? `(${a.courseCode})` : ''}

                        </div>

                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>

                          {a.period} · Sección {a.section || '—'} · {a.credits ?? 0} créditos · {a.totalHours ?? 0}h/sem · {ASSIGNMENT_STATUS.find((s) => s.value === a.status)?.label ?? a.status}

                        </div>

                      </div>

                    </div>

                    {canManageAssignment && (

                      <div style={{ display: 'flex', gap: '10px' }}>

                        {hasPermission('ASIGNACION_EDIT') && (

                          <button type="button" className="ghost-btn primary" onClick={() => setAssignmentForm({ ...a })}>

                            <Pencil size={13} /> Editar

                          </button>

                        )}

                        {hasPermission('ASIGNACION_DELETE') && (

                          <button type="button" className="ghost-btn danger" onClick={() => handleDeleteAssignment(a)}>

                            <Trash2 size={13} /> Eliminar

                          </button>

                        )}

                      </div>

                    )}

                  </div>

                ))}

                {assignments.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-base)' }}>Sin asignaciones lectivas registradas.</p>}

              </div>

            </div>

          )}

        </Modal>

      )}

    </div>

  );

};

