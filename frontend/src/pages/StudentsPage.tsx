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

import { studentService } from '../services/studentService';
import { reportService } from '../services/reportService';

import type { StudentAdmissionDto, StudentDto } from '../services/studentService';

import { userService } from '../services/userService';

import type { UserResponse } from '../services/userService';

import { universityService } from '../services/universityService';

import type { CareerDto, FacultyDto } from '../services/universityService';

import { careersForFaculty, facultyNameForCareer, normalizeCatalogName } from '../utils/studentCatalog';

import { getApiErrorMessage, getApiFieldErrors } from '../utils/apiErrors';

import { defaultListViewMode } from '../utils/viewMode';

import { readImageAsDataUrl } from '../utils/imageUpload';

import { isPasswordSecure } from '../utils/passwordPolicy';

import {

  Users,

  Search,

  Plus,

  Mail,

  Pencil,

  Trash2,

  RefreshCw,

  FileText,

  ImagePlus,

  Power,

  GraduationCap as DegreeIcon,

  Download,

  Award,

  Building2,

  CalendarDays,

  CheckCircle2,

  Hash,

  Layers,

  MapPin,

  Percent,

  Phone,

  UserRound,

} from 'lucide-react';



const CONDITIONS: { value: string; label: string }[] = [

  { value: 'REGULAR', label: 'Regular' },

  { value: 'TERCIO_SUPERIOR', label: 'Tercio Superior' },

  { value: 'DECIMO_SUPERIOR', label: 'Décimo Superior' },

  { value: 'OBSERVADO', label: 'Observado' },

  { value: 'EGRESADO', label: 'Egresado' },

];



const ENROLLMENT_STATUS: { value: string; label: string }[] = [

  { value: 'MATRICULADO', label: 'Matriculado' },

  { value: 'PENDIENTE', label: 'Pendiente' },

  { value: 'RESERVA', label: 'Reserva' },

  { value: 'SUSPENDIDO', label: 'Suspendido' },

];



const GENDERS: { value: string; label: string }[] = [

  { value: 'MASCULINO', label: 'Masculino' },

  { value: 'FEMENINO', label: 'Femenino' },

  { value: 'OTRO', label: 'Otro' },

];



const STUDENT_FORM_STEPS = [

  { title: 'Datos personales', description: 'Identidad y contacto' },

  { title: 'Información académica', description: 'Carrera, ciclo y condición' },

  { title: 'Acceso y confirmación', description: 'Cuenta y resumen' },

];



const MODALITIES: { value: string; label: string }[] = [

  { value: 'ORDINARIO', label: 'Ordinario' },

  { value: 'TRASLADO_EXTERNO', label: 'Traslado Externo' },

  { value: 'TRASLADO_INTERNO', label: 'Traslado Interno' },

  { value: 'TITULADO', label: 'Titulado / Graduado' },

  { value: 'VICTIMA_VIOLENCIA', label: 'Víctima de Violencia' },

  { value: 'DEPORTISTA_CALIFICADO', label: 'Deportista Calificado' },

  { value: 'OTRO', label: 'Otro' },

];



const ADMISSION_STATUS: { value: string; label: string }[] = [

  { value: 'ADMITIDO', label: 'Admitido' },

  { value: 'MATRICULADO', label: 'Matriculado' },

  { value: 'RETIRADO', label: 'Retirado' },

];



const CONDITION_LABEL = (value?: string) =>

  CONDITIONS.find((c) => c.value === value)?.label ?? value ?? '—';



const formatAdmissionDate = (value?: string): string => {

  if (!value) return '';

  const [year, month, day] = value.split('-');

  if (!year || !month || !day) return value;

  return `${day}/${month}/${year}`;

};



const conditionVariant = (value?: string): 'success' | 'danger' | 'primary' | 'outline' => {

  if (value === 'TERCIO_SUPERIOR' || value === 'DECIMO_SUPERIOR') return 'success';

  if (value === 'OBSERVADO') return 'danger';

  if (value === 'EGRESADO') return 'outline';

  return 'primary';

};



const enrollmentVariant = (value?: string): 'success' | 'danger' | 'warning' | 'outline' => {

  if (value === 'MATRICULADO') return 'success';

  if (value === 'PENDIENTE') return 'warning';

  if (value === 'SUSPENDIDO') return 'danger';

  return 'outline';

};



const inputStyle = formControlStyle;



const errMsg = (err: unknown, fallback: string): string => getApiErrorMessage(err, fallback);



const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;



/** Campo del DTO -> paso del asistente, para saltar al primer error del servidor. */

const STUDENT_FIELD_STEPS: Record<string, number> = {

  code: 0,

  documentId: 0,

  firstName: 0,

  lastName: 0,

  birthDate: 0,

  gender: 0,

  email: 0,

  phone: 0,

  address: 0,

  faculty: 1,

  career: 1,

  currentCycle: 1,

  approvedCredits: 1,

  weightedAverage: 1,

  condition: 1,

  enrollmentStatus: 1,

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



const emptyStudent = (): StudentDto => ({

  code: '',

  firstName: '',

  lastName: '',

  condition: 'REGULAR',

  enrollmentStatus: 'MATRICULADO',

  currentCycle: 1,

  approvedCredits: 0,

  weightedAverage: 0,

  avatar: '',

});



export const StudentsPage: React.FC = () => {

  const { hasPermission } = useAuth();

  const { confirm } = useConfirm();

  const toast = useToast();
  const canExport = hasPermission('ESTUDIANTE_EXPORT');
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const filename = await reportService.exportStudents();
      toast.success(`Exportación generada: ${filename}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo generar la exportación');
    } finally {
      setExporting(false);
    }
  };



  const [students, setStudents] = useState<StudentDto[]>([]);

  const [loading, setLoading] = useState(true);



  const [faculties, setFaculties] = useState<FacultyDto[]>([]);

  const [careerCatalog, setCareerCatalog] = useState<CareerDto[]>([]);

  const [catalogLoading, setCatalogLoading] = useState(false);



  const [searchQuery, setSearchQuery] = useState('');

  const [selectedCareer, setSelectedCareer] = useState('ALL');

  const [selectedCondition, setSelectedCondition] = useState('ALL');

  const [viewMode, setViewMode] = useState<'cards' | 'table'>(defaultListViewMode);

  const [page, setPage] = useState(1);

  const PAGE_SIZE = 8;



  const [studentModal, setStudentModal] = useState(false);

  const [studentStep, setStudentStep] = useState(0);

  const [studentForm, setStudentForm] = useState<StudentDto>(emptyStudent());

  const studentFormRef = useRef<HTMLFormElement>(null);

  const studentStepRef = useRef<HTMLDivElement>(null);

  const [linkableUsers, setLinkableUsers] = useState<UserResponse[]>([]);

  const canLinkAccounts = hasPermission('ESTUDIANTE_EDIT') && hasPermission('USUARIO_VIEW');

  const canCreateAccounts = hasPermission('USUARIO_CREATE');

  const [accountMode, setAccountMode] = useState<'link' | 'create'>('link');

  const [accountForm, setAccountForm] = useState({ username: '', email: '', password: '' });

  const [formError, setFormError] = useState<string | null>(null);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [isSubmitting, setIsSubmitting] = useState(false);



  const [manageStudent, setManageStudent] = useState<StudentDto | null>(null);

  const [admissions, setAdmissions] = useState<StudentAdmissionDto[]>([]);

  const [admissionForm, setAdmissionForm] = useState<StudentAdmissionDto | null>(null);

  const admissionFormRef = useRef<HTMLFormElement>(null);

  const admissionFormOpen = admissionForm !== null;

  useEffect(() => {

    if (!admissionFormOpen) return;

    const timer = window.setTimeout(() => {

      const panel = admissionFormRef.current;

      panel?.scrollIntoView({ behavior: 'smooth', block: 'center' });

      panel?.querySelector<HTMLElement>('input:not([type="hidden"]), select, textarea')?.focus({ preventScroll: true });

    }, 80);

    return () => window.clearTimeout(timer);

  }, [admissionFormOpen, admissionForm?.id]);

  const [manageError, setManageError] = useState<string | null>(null);

  const [manageLoading, setManageLoading] = useState(false);



  const canCreate = hasPermission('ESTUDIANTE_CREATE');

  const canEdit = hasPermission('ESTUDIANTE_EDIT');

  const canDelete = hasPermission('ESTUDIANTE_DELETE');

  const canManageAdmission = hasPermission('ADMISION_CREATE');



  const reload = useCallback(async () => {

    setLoading(true);

    setCatalogLoading(true);

    const catalogTasks: Promise<unknown>[] = [];

    if (hasPermission('FACULTAD_VIEW')) {

      catalogTasks.push(universityService.getFaculties().then((res) => setFaculties(res.data)));

    }

    if (hasPermission('CARRERA_VIEW')) {

      catalogTasks.push(universityService.getCareers().then((res) => setCareerCatalog(res.data)));

    }

    try {

      const [studentsResult] = await Promise.allSettled([

        studentService.getStudents(),

        ...catalogTasks,

      ]);

      if (studentsResult.status === 'fulfilled') {

        setStudents(studentsResult.value.data);

      } else {

        toast.error(errMsg(studentsResult.reason, 'No se pudo cargar el padrón estudiantil'));

      }

    } finally {

      setLoading(false);

      setCatalogLoading(false);

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

            (item) => item.active && item.roles.includes('ROLE_ESTUDIANTE')

          )

        );

      })

      .catch(() => undefined);

  }, [canLinkAccounts]);



  useEffect(() => {

    setPage(1);

  }, [searchQuery, selectedCareer, selectedCondition, viewMode]);



  const flashSuccess = (message: string) => toast.success(message);



  const careers = useMemo(

    () => Array.from(new Set(students.map((s) => s.career).filter(Boolean))) as string[],

    [students]

  );



  const facultyOptions = useMemo(

    () => faculties.filter((f) => f.active !== false || f.name === studentForm.faculty),

    [faculties, studentForm.faculty]

  );



  const availableCareers = useMemo(() => {

    const list = careersForFaculty(careerCatalog, studentForm.faculty);

    return list.filter((c) => c.active !== false || c.name === studentForm.career);

  }, [careerCatalog, studentForm.faculty, studentForm.career]);



  const filteredStudents = useMemo(

    () =>

      students.filter((s) => {

        const term = searchQuery.toLowerCase();

        const matchesSearch =

          !term ||

          `${s.firstName} ${s.lastName}`.toLowerCase().includes(term) ||

          s.code.toLowerCase().includes(term) ||

          (s.documentId ?? '').includes(term) ||

          (s.email ?? '').toLowerCase().includes(term);

        const matchesCareer = selectedCareer === 'ALL' || s.career === selectedCareer;

        const matchesCondition = selectedCondition === 'ALL' || s.condition === selectedCondition;

        return matchesSearch && matchesCareer && matchesCondition;

      }),

    [students, searchQuery, selectedCareer, selectedCondition]

  );



  /* ---------------------------- Estudiantes ---------------------------- */

  const openStudentModal = (student?: StudentDto) => {

    setFormError(null);

    setFieldErrors({});

    setStudentStep(0);

    if (student) {

      const faculty = student.faculty || facultyNameForCareer(careerCatalog, student.career) || '';

      setStudentForm({ ...student, faculty });

    } else {

      setStudentForm(emptyStudent());

    }

    const availableLinks = linkableUsers.filter(
      (candidate) => !students.some((item) => item.userId === candidate.id && item.id !== student?.id)
    );

    const shouldCreate = !student?.userId && availableLinks.length === 0 && canCreateAccounts;

    setAccountMode(shouldCreate ? 'create' : 'link');

    const suggestedUsername = student?.code
      ? `estudiante.${student.code.toLowerCase().replace(/[^a-z0-9._-]+/g, '')}`
      : '';

    setAccountForm({
      username: shouldCreate ? suggestedUsername : '',
      email: student?.email ?? '',
      password: '',
    });

    setStudentModal(true);

  };



  const focusStudentStep = () => {

    window.setTimeout(() => {

      studentStepRef.current?.focus({ preventScroll: true });

      studentStepRef.current?.scrollTo({ top: 0 });

    }, 0);

  };



  const validateStudentStep = (step: number): Record<string, string> => {

    const errors: Record<string, string> = {};

    const code = studentForm.code.trim();

    const firstName = studentForm.firstName.trim();

    const lastName = studentForm.lastName.trim();

    const documentId = studentForm.documentId?.trim() ?? '';

    const email = studentForm.email?.trim() ?? '';

    const phone = studentForm.phone?.trim() ?? '';

    const address = studentForm.address?.trim() ?? '';



    if (step === 0) {

      if (!code) errors.code = 'El código de matrícula es obligatorio.';

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

      if (!studentForm.career?.trim()) errors.career = 'Selecciona una carrera.';

      if (!studentForm.faculty?.trim()) errors.faculty = 'La carrera debe tener una facultad asociada.';

      if ((studentForm.faculty ?? '').length > 200) errors.faculty = 'La facultad no puede exceder 200 caracteres.';

      if ((studentForm.career ?? '').length > 200) errors.career = 'La carrera no puede exceder 200 caracteres.';

      if (studentForm.currentCycle != null && (studentForm.currentCycle < 1 || studentForm.currentCycle > 20)) {

        errors.currentCycle = 'El ciclo debe estar entre 1 y 20.';

      }

      if (studentForm.approvedCredits != null && studentForm.approvedCredits < 0) {

        errors.approvedCredits = 'Los créditos aprobados no pueden ser negativos.';

      }

      if (studentForm.weightedAverage != null && (studentForm.weightedAverage < 0 || studentForm.weightedAverage > 20)) {

        errors.weightedAverage = 'El promedio debe estar entre 0 y 20.';

      }

    }



    if (step === 2) {

      const wantsCreate = canCreateAccounts && !studentForm.userId && (!canLinkAccounts || accountMode === 'create');

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

      } else if (canLinkAccounts && !studentForm.userId) {

        errors.userId = 'Selecciona la cuenta de usuario del estudiante.';

      }

    }

    return errors;

  };



  const goStudentStep = (target: number) => {

    const next = Math.max(0, Math.min(STUDENT_FORM_STEPS.length - 1, target));

    if (next > studentStep) {

      for (let step = studentStep; step < next; step += 1) {

        const errors = validateStudentStep(step);

        if (Object.keys(errors).length > 0) {

          setStudentStep(step);

          setFieldErrors(errors);

          setFormError(Object.values(errors)[0]);

          focusStudentStep();

          return;

        }

      }

    }

    setFieldErrors({});

    setFormError(null);

    setStudentStep(next);

    focusStudentStep();

  };



  const handleFacultyChange = (facultyName: string) => {

    setStudentForm((prev) => {

      const career = careerCatalog.find(

        (c) => normalizeCatalogName(c.name) === normalizeCatalogName(prev.career)

      );

      const belongsToFaculty =

        !facultyName ||

        !career ||

        normalizeCatalogName(career.facultyName) === normalizeCatalogName(facultyName);

      return {

        ...prev,

        faculty: facultyName,

        career: belongsToFaculty ? prev.career : '',

      };

    });

  };



  const handleCareerChange = (careerName: string) => {

    setStudentForm((prev) => ({

      ...prev,

      career: careerName,

      faculty: facultyNameForCareer(careerCatalog, careerName) ?? prev.faculty ?? '',

    }));

  };



  const handleSaveStudent = async (e: React.FormEvent) => {

    e.preventDefault();

    if (studentStep < STUDENT_FORM_STEPS.length - 1) {

      goStudentStep(studentStep + 1);

      return;

    }

    for (let step = 0; step < STUDENT_FORM_STEPS.length; step += 1) {

      const errors = validateStudentStep(step);

      if (Object.keys(errors).length > 0) {

        setStudentStep(step);

        setFieldErrors(errors);

        setFormError(Object.values(errors)[0]);

        focusStudentStep();

        return;

      }

    }

    setIsSubmitting(true);

    setFormError(null);

    setFieldErrors({});

    let createdAccountId: number | null = null;

    try {

      const wantsCreate = canCreateAccounts && !studentForm.userId && (!canLinkAccounts || accountMode === 'create');

      let payload = { ...studentForm };

      if (wantsCreate) {

        const account = await userService.createUser({

          username: accountForm.username.trim(),

          email: accountForm.email.trim(),

          password: accountForm.password,

          firstName: studentForm.firstName.trim(),

          lastName: studentForm.lastName.trim(),

          phone: studentForm.phone,

          department: studentForm.faculty || studentForm.career,

          avatar: studentForm.avatar,

          roles: ['ROLE_ESTUDIANTE'],

        });

        createdAccountId = account.data.id;

        payload = { ...payload, userId: account.data.id };

      }

      if (studentForm.id) {

        await studentService.updateStudent(studentForm.id, payload);

      } else {

        await studentService.createStudent(payload);

      }

      setStudentModal(false);

      flashSuccess(studentForm.id ? 'Estudiante actualizado correctamente.' : 'Estudiante registrado correctamente.');

      await reload();

    } catch (err) {

      if (createdAccountId) {

        await userService.toggleStatus(createdAccountId, false).catch(() => undefined);

      }

      const apiErrors = getApiFieldErrors(err);

      setFieldErrors(apiErrors);

      const apiStep = Object.keys(apiErrors).reduce<number | null>((min, field) => {

        const step = STUDENT_FIELD_STEPS[field];

        if (step == null) return min;

        return min == null ? step : Math.min(min, step);

      }, null);

      if (apiStep != null) {

        setStudentStep(apiStep);

        focusStudentStep();

      }

      setFormError(errMsg(err, 'Error al guardar el estudiante'));

    } finally {

      setIsSubmitting(false);

    }

  };



  const handleDeleteStudent = async (student: StudentDto) => {

    if (!student.id) return;

    const confirmed = await confirm({

      title: 'Eliminar registro del estudiante',

      message: `¿Eliminar el registro de ${student.firstName} ${student.lastName}? Dejará de aparecer en el padrón activo.`,

      confirmLabel: 'Eliminar registro',

      variant: 'danger',

    });

    if (!confirmed) return;

    try {

      await studentService.deleteStudent(student.id);

      setStudents((prev) => prev.map((s) => (s.id === student.id ? { ...s, active: false } : s)));

      flashSuccess('Registro de estudiante eliminado.');

    } catch (err) {

      toast.error(errMsg(err, 'Error al eliminar el registro del estudiante'));

    }

  };



  const handleToggleStudent = async (student: StudentDto) => {

    if (!student.id) return;

    const next = student.active === false;

    if (!next) {

      const ok = await confirm({

        title: 'Deshabilitar estudiante',

        message: `¿Deshabilitar al estudiante ${student.firstName} ${student.lastName}? Su expediente quedará inactivo.`,

        confirmLabel: 'Deshabilitar',

        variant: 'danger',

      });

      if (!ok) return;

    }

    try {

      await studentService.toggleStudentStatus(student.id, next);

      setStudents((prev) => prev.map((s) => (s.id === student.id ? { ...s, active: next } : s)));

      flashSuccess(next ? 'Estudiante habilitado.' : 'Estudiante deshabilitado.');

    } catch (err) {

      toast.error(errMsg(err, 'Error al cambiar el estado del estudiante'));

    }

  };



  /* -------------------- Gestión (historial de ingreso) -------------------- */

  const openManage = async (student: StudentDto) => {

    if (!student.id) return;

    setManageStudent(student);

    setAdmissionForm(null);

    setManageError(null);

    setManageLoading(true);

    try {

      const res = await studentService.getAdmissions(student.id);

      setAdmissions(res.data);

    } catch (err) {

      setManageError(errMsg(err, 'No se pudo cargar el historial de ingreso'));

    } finally {

      setManageLoading(false);

    }

  };



  const handleSaveAdmission = async (e: React.FormEvent) => {

    e.preventDefault();

    if (!admissionForm || !manageStudent?.id) return;

    setIsSubmitting(true);

    setManageError(null);

    try {

      if (admissionForm.id) {

        await studentService.updateAdmission(admissionForm.id, admissionForm);

      } else {

        await studentService.createAdmission(manageStudent.id, admissionForm);

      }

      const res = await studentService.getAdmissions(manageStudent.id);

      setAdmissions(res.data);

      setAdmissionForm(null);

      flashSuccess('Historial de ingreso guardado correctamente.');

      await reload();

    } catch (err) {

      setManageError(errMsg(err, 'Error al guardar el historial de ingreso'));

    } finally {

      setIsSubmitting(false);

    }

  };



  const handleDeleteAdmission = async (admission: StudentAdmissionDto) => {

    if (!admission.id) return;

    const confirmed = await confirm({

      title: 'Eliminar registro de ingreso',

      message: `¿Eliminar el registro de ingreso del periodo "${admission.period}"?`,

      confirmLabel: 'Eliminar',

      variant: 'danger',

    });

    if (!confirmed) return;

    try {

      await studentService.deleteAdmission(admission.id);

      setAdmissions((prev) => prev.filter((a) => a.id !== admission.id));

      flashSuccess('Registro de ingreso eliminado.');

      await reload();

    } catch (err) {

      setManageError(errMsg(err, 'Error al eliminar el registro de ingreso'));

    }

  };



  const setStudentField = (field: keyof StudentDto, value: string | number | undefined) => {

    setStudentForm((prev) => ({ ...prev, [field]: value }));

    setFieldErrors((prev) => {

      if (!prev[field]) return prev;

      const next = { ...prev };

      delete next[field];

      return next;

    });

  };



  const handleStudentAvatarFile = async (event: React.ChangeEvent<HTMLInputElement>) => {

    const file = event.target.files?.[0];

    if (!file) return;

    try {

      const dataUrl = await readImageAsDataUrl(file);

      setStudentField('avatar', dataUrl);

    } catch (err) {

      setFieldErrors((prev) => ({ ...prev, avatar: errMsg(err, 'No se pudo cargar la imagen') }));

    } finally {

      event.target.value = '';

    }

  };



  const studentAccountMode = canCreateAccounts && !studentForm.userId

    && (!canLinkAccounts || accountMode === 'create')

    ? 'create'

    : 'link';



  const startStudentAccountCreation = () => {

    setAccountMode('create');

    setAccountForm((prev) => ({

      ...prev,

      username: prev.username || (studentForm.code

        ? `estudiante.${studentForm.code.toLowerCase().replace(/[^a-z0-9._-]+/g, '')}`

        : ''),

      email: prev.email || studentForm.email || '',

    }));

  };



  return (

    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      <PageHeader

        title="Padrón de Estudiantes & Expedientes Académicos"

        icon={<Users size={28} />}

        accent="var(--primary)"

        breadcrumbs={[{ label: 'Gestión Académica' }, { label: 'Padrón Estudiantil' }]}

        badges={

          <Badge variant="success" dot>Padrón General 2026-I</Badge>

        }

        actions={

          <>

            <Button variant="outline" leftIcon={<RefreshCw size={16} />} onClick={reload} isLoading={loading}>

              Actualizar

            </Button>

            {canCreate && (

              <Button variant="primary" leftIcon={<Plus size={16} />} onClick={() => openStudentModal()}>

                Registrar Estudiante

              </Button>

            )}

          </>

        }

        stats={[

          { label: 'Estudiantes', value: students.length },

          { label: 'Activos', value: students.filter((s) => s.active !== false).length },

          { label: 'Carreras', value: careers.length },

          { label: 'Prom. general', value: students.length > 0 ? (students.reduce((a, s) => a + (s.weightedAverage ?? 0), 0) / students.length).toFixed(2) : '—' },

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

            placeholder="Buscar por nombre, código, DNI o correo..."

            value={searchQuery}

            onChange={(e) => setSearchQuery(e.target.value)}

          />

        </div>



        <Select className="field-select" aria-label="Filtrar por carrera" value={selectedCareer} onChange={(e) => setSelectedCareer(e.target.value)}>

          <option value="ALL">Todas las Carreras</option>

          {careers.map((c) => (

            <option key={c} value={c}>{c}</option>

          ))}

        </Select>



        <Select className="field-select" aria-label="Filtrar por condición" value={selectedCondition} onChange={(e) => setSelectedCondition(e.target.value)}>

          <option value="ALL">Todas las Condiciones</option>

          {CONDITIONS.map((c) => (

            <option key={c.value} value={c.value}>{c.label}</option>

          ))}

        </Select>

      </Toolbar>



      {loading ? (

        <LoadingSpinner message="Consultando el padrón estudiantil en la base de datos..." />

      ) : (

        <>

          {/* Renderizado en Tarjetas */}

          {viewMode === 'cards' && (

            <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(340px, 100%), 1fr))', gap: '18px' }}>

              {filteredStudents.map((s) => (

                <Card key={s.id} interactive className="card-fill">

                  <div className="entity-card-v2">

                    <div className="entity-head">

                      <span className="entity-avatar">

                        {s.avatar

                          ? <img src={s.avatar} alt="" />

                          : (s.firstName?.[0]?.toUpperCase() || 'E')}

                      </span>

                      <div className="entity-id">

                        <h4>{s.firstName} {s.lastName}</h4>

                        <span className="entity-code">{s.code}</span>

                      </div>

                      <div className="entity-badges">

                        <Badge variant={conditionVariant(s.condition)} size="sm">{CONDITION_LABEL(s.condition)}</Badge>

                        <Badge variant={s.active === false ? 'danger' : enrollmentVariant(s.enrollmentStatus)} size="sm" dot>

                          {s.active === false ? 'Inactivo' : ENROLLMENT_STATUS.find((e) => e.value === s.enrollmentStatus)?.label ?? s.enrollmentStatus}

                        </Badge>

                      </div>

                    </div>



                    <div className="entity-info">

                      <div className="entity-row"><DegreeIcon size={15} /> {s.career || '—'}</div>

                      <div className="entity-row"><Building2 size={15} /> {s.faculty || '—'}</div>

                      <div className="entity-row"><Mail size={15} /> {s.email || 'Sin correo registrado'}</div>

                    </div>



                    <div className="entity-stats">

                      <div><span className="v">{(s.weightedAverage ?? 0).toFixed(2)}</span><span className="l">promedio</span></div>

                      <div><span className="v">{s.approvedCredits ?? 0}</span><span className="l">créditos</span></div>

                      <div><span className="v">{s.admissionCount ?? 0}</span><span className="l">ingresos</span></div>

                    </div>



                    <div className="entity-actions">

                      <button type="button" className="ghost-btn info" onClick={() => openManage(s)}>

                        <FileText size={14} /> Ficha

                      </button>

                      {canEdit && (

                        <button type="button" className="ghost-btn primary" onClick={() => openStudentModal(s)}>

                          <Pencil size={14} /> Editar

                        </button>

                      )}

                      <ActionMenu

                        label={`Más acciones para ${s.firstName} ${s.lastName}`}

                        items={[

                          {

                            label: s.active === false ? 'Habilitar' : 'Deshabilitar',

                            icon: <Power size={14} />,

                            onClick: () => handleToggleStudent(s),

                            hidden: !canEdit,

                          },

                          {

                            label: 'Eliminar registro',

                            icon: <Trash2 size={14} />,

                            onClick: () => handleDeleteStudent(s),

                            variant: 'danger',

                            hidden: !(canDelete && s.active !== false),

                          },

                        ]}

                      />

                    </div>

                  </div>

                </Card>

              ))}

              {filteredStudents.length === 0 && (

                <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-base)' }}>No se encontraron estudiantes con los filtros aplicados.</p>

              )}

            </div>

          )}



          {/* Renderizado en Tabla */}

          {viewMode === 'table' && (

            <Card>

              <p className="table-scroll-hint">Desliza para ver más columnas →</p>

              <div className="data-table-wrap">

                <table className="data-table data-table--stack table--students">
                  <colgroup>
                    <col style={{ width: '9%' }} />
                    <col style={{ width: '22%' }} />
                    <col style={{ width: '22%' }} />
                    <col style={{ width: '7%' }} />
                    <col style={{ width: '8%' }} />
                    <col style={{ width: '12%' }} />
                    <col style={{ width: '11%' }} />
                    <col style={{ width: '9%' }} />
                  </colgroup>

                  <thead>

                    <tr>

                      <th>Código</th>

                      <th>Estudiante</th>

                      <th>Carrera / Escuela</th>

                      <th>Ciclo</th>

                      <th>Promedio</th>

                      <th>Condición</th>

                      <th>Matrícula</th>

                      <th style={{ textAlign: 'center' }}>Acciones</th>

                    </tr>

                  </thead>

                  <tbody>

                    {filteredStudents.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((s) => (

                      <tr key={s.id}>

                        <td className="cell-strong cell-mono table-code">{s.code}</td>

                        <td className="cell-strong">
                          <div className="table-person">
                            <span className="table-avatar" aria-hidden="true">

                              {s.avatar

                                ? <img src={s.avatar} alt="" />

                                : (s.firstName?.[0] ?? '') + (s.lastName?.[0] ?? '')}

                            </span>
                            <div className="table-person__copy">
                              <span title={`${s.firstName} ${s.lastName}`}>{s.firstName} {s.lastName}</span>
                              <small>DNI: {s.documentId || '—'}</small>
                            </div>
                          </div>
                        </td>

                        <td title={s.career || undefined}>{s.career || '—'}</td>

                        <td><Badge variant="outline" size="sm">Ciclo {s.currentCycle ?? 1}</Badge></td>

                        <td style={{ fontWeight: 700, color: (s.weightedAverage ?? 0) >= 16 ? 'var(--accent-emerald)' : 'var(--text-main)' }}>

                          {(s.weightedAverage ?? 0).toFixed(2)}

                        </td>

                        <td>

                          <Badge variant={conditionVariant(s.condition)} size="sm">{CONDITION_LABEL(s.condition)}</Badge>

                        </td>

                        <td>

                          <Badge variant={s.active === false ? 'danger' : enrollmentVariant(s.enrollmentStatus)} size="sm">

                            {s.active === false ? 'Inactivo' : ENROLLMENT_STATUS.find((e) => e.value === s.enrollmentStatus)?.label ?? s.enrollmentStatus}

                          </Badge>

                        </td>

                        <td>

                          <div className="action-group">

                            <button type="button" className="action-btn info" title="Ver ficha" aria-label="Ver ficha" onClick={() => openManage(s)}>

                              <FileText size={15} />

                            </button>

                            {canEdit && (

                              <button type="button" className="action-btn primary" title="Editar" aria-label="Editar" onClick={() => openStudentModal(s)}>

                                <Pencil size={15} />

                              </button>

                            )}

                            <ActionMenu

                              className="action-menu__trigger--sm"

                              label={`Más acciones para ${s.firstName} ${s.lastName}`}

                              items={[

                                {

                                  label: s.active === false ? 'Habilitar' : 'Deshabilitar',

                                  icon: <Power size={14} />,

                                  onClick: () => handleToggleStudent(s),

                                  hidden: !canEdit,

                                },

                                {

                                  label: 'Eliminar registro',

                                  icon: <Trash2 size={14} />,

                                  onClick: () => handleDeleteStudent(s),

                                  variant: 'danger',

                                  hidden: !(canDelete && s.active !== false),

                                },

                              ]}

                            />

                          </div>

                        </td>

                      </tr>

                    ))}

                    {filteredStudents.length === 0 && (

                      <tr>

                        <td colSpan={8} style={{ color: 'var(--text-muted)' }}>No se encontraron estudiantes.</td>

                      </tr>

                    )}

                  </tbody>

                </table>

              </div>

              <Pagination page={page} pageSize={PAGE_SIZE} total={filteredStudents.length} onChange={setPage} itemLabel="estudiantes" />

            </Card>

          )}

        </>

      )}



      {/* Modal Estudiante */}

      {studentModal && (

        <Modal

          title={studentForm.id ? 'Editar Estudiante' : 'Registrar Estudiante'}

          icon={<Users size={20} color="var(--primary)" />}

          subtitle="Complete la información en tres pasos: identidad, datos académicos y acceso."

          maxWidth="780px"

          onClose={() => setStudentModal(false)}

        >

          {formError && <div role="alert" aria-live="polite" style={{ padding: '10px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--status-down-bg)', color: 'var(--status-down)', fontSize: 'var(--text-sm)', marginBottom: '12px' }}>{formError}</div>}

          <form

            ref={studentFormRef}

            onSubmit={handleSaveStudent}

            className="modal-step-form"

          >

            <FormSummary
              icon={<Users size={18} />}
              title={`${studentForm.firstName} ${studentForm.lastName}`.trim() || 'Nuevo estudiante'}
              subtitle={studentForm.code || 'Expediente académico'}
              meta={[
                studentForm.career || 'Carrera por definir',
                studentForm.code || studentForm.firstName
                  ? `Ciclo ${studentForm.currentCycle ?? 1}`
                  : 'Ciclo por definir',
              ]}
              progress={Math.round(([studentForm.code, studentForm.firstName, studentForm.lastName, studentForm.career].filter((value) => String(value ?? '').trim()).length / 4) * 100)}
              progressLabel="4 campos clave"
            />

            <div className="institution-stepper modal-form-stepper" aria-label="Pasos del formulario de estudiante">

              {STUDENT_FORM_STEPS.map((step, index) => (

                <button

                  key={step.title}

                  type="button"

                  className={`institution-step${studentStep === index ? ' is-active' : ''}${index < studentStep ? ' is-complete' : ''}`}

                  aria-current={studentStep === index ? 'step' : undefined}

                  onClick={() => goStudentStep(index)}

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

              key={studentStep}
              ref={studentStepRef}

              className="modal-step-panel"

              tabIndex={-1}

              aria-label={`${STUDENT_FORM_STEPS[studentStep].title} del formulario de estudiante`}

            >

              {studentStep === 0 && (

                <>

                  <h4 className="modal-step-title"><Users size={15} /> Datos personales</h4>

                  <div className="avatar-upload">
                    <span className="avatar-upload__preview">
                      {studentForm.avatar
                        ? <img src={studentForm.avatar} alt="Vista previa del avatar del estudiante" />
                        : <span>{(studentForm.firstName?.[0] ?? '') + (studentForm.lastName?.[0] ?? '') || 'E'}</span>}
                    </span>
                    <div className="avatar-upload__copy">
                      <strong>Foto del estudiante</strong>
                      <small>Se mostrará en su ficha, tarjeta y registro académico.</small>
                      <div className="avatar-upload__actions">
                        <label className="ghost-btn">
                          <ImagePlus size={15} />
                          {studentForm.avatar ? 'Cambiar foto' : 'Adjuntar foto'}
                          <input type="file" accept="image/*" onChange={handleStudentAvatarFile} style={{ display: 'none' }} />
                        </label>
                        {studentForm.avatar && (
                          <button type="button" className="link-action" onClick={() => setStudentField('avatar', '')}>
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

                    <Field label="Código de matrícula" icon={<Hash size={13} />} error={fieldErrors.code}>

                      <input style={inputStyle} required data-autofocus maxLength={20} value={studentForm.code} onChange={(e) => setStudentField('code', e.target.value)} placeholder="2026-010001" />

                    </Field>

                    <Field label="Documento de identidad (DNI)" icon={<FileText size={13} />} error={fieldErrors.documentId}>

                      <input style={inputStyle} maxLength={20} value={studentForm.documentId ?? ''} onChange={(e) => setStudentField('documentId', e.target.value)} placeholder="Ej. 71234567" inputMode="numeric" />

                    </Field>

                    <Field label="Nombres" icon={<UserRound size={13} />} error={fieldErrors.firstName}>

                      <input style={inputStyle} required maxLength={150} value={studentForm.firstName} onChange={(e) => setStudentField('firstName', e.target.value)} placeholder="Ej. María Fernanda" autoComplete="given-name" />

                    </Field>

                    <Field label="Apellidos" icon={<Users size={13} />} error={fieldErrors.lastName}>

                      <input style={inputStyle} required maxLength={150} value={studentForm.lastName} onChange={(e) => setStudentField('lastName', e.target.value)} placeholder="Ej. Pérez Gómez" autoComplete="family-name" />

                    </Field>

                    <Field label="Fecha de nacimiento" icon={<CalendarDays size={13} />} error={fieldErrors.birthDate}>

                      <DatePicker style={inputStyle} ariaLabel="Fecha de nacimiento" max={new Date().toISOString().slice(0, 10)} value={studentForm.birthDate ?? ''} onChange={(next) => setStudentField('birthDate', next)} />

                    </Field>

                    <Field label="Género" icon={<UserRound size={13} />} error={fieldErrors.gender}>

                      <Select style={inputStyle} value={studentForm.gender ?? ''} onChange={(e) => setStudentField('gender', e.target.value)}>

                        <option value="">—</option>

                        {GENDERS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}

                      </Select>

                    </Field>

                  </div>
                  </div>
                  <div className="modal-form-section">
                    <h5 className="modal-form-section__title">Contacto</h5>
                    <div className="modal-field-grid">
                    <Field label="Correo institucional" icon={<Mail size={13} />} error={fieldErrors.email}>

                      <input style={inputStyle} type="email" maxLength={100} value={studentForm.email ?? ''} onChange={(e) => setStudentField('email', e.target.value)} placeholder="Ej. nombre@gestoracad.edu" autoComplete="email" />

                    </Field>

                    <Field label="Teléfono" icon={<Phone size={13} />} error={fieldErrors.phone}>

                      <input style={inputStyle} type="tel" maxLength={25} value={studentForm.phone ?? ''} onChange={(e) => setStudentField('phone', e.target.value)} placeholder="Ej. +51 987 654 321" autoComplete="tel" />

                    </Field>

                  </div>

                  <Field label="Dirección" icon={<MapPin size={13} />} error={fieldErrors.address}>

                    <input style={inputStyle} maxLength={255} value={studentForm.address ?? ''} onChange={(e) => setStudentField('address', e.target.value)} placeholder="Ej. Av. Universitaria 1801, Lima" autoComplete="street-address" />

                  </Field>
                  </div>

                </>

              )}



              {studentStep === 1 && (

                <>

                  <h4 className="modal-step-title"><Layers size={15} /> Información académica</h4>

                  <div className="modal-field-grid">

                    <Field label="Facultad" icon={<Building2 size={13} />} error={fieldErrors.faculty}>

                      <Select

                        style={inputStyle}

                        aria-label="Facultad"

                        value={studentForm.faculty ?? ''}

                        onChange={(e) => handleFacultyChange(e.target.value)}

                        disabled={catalogLoading}

                      >

                        <option value="">— Seleccione una facultad —</option>

                        {facultyOptions.map((f) => (

                          <option key={f.id} value={f.name}>

                            {f.name}{f.active === false ? ' (inactiva)' : ''}

                          </option>

                        ))}

                      </Select>

                    </Field>

                    <Field label="Carrera / Escuela profesional" icon={<DegreeIcon size={13} />} error={fieldErrors.career}>

                      <Select

                        style={inputStyle}

                        aria-label="Carrera / Escuela profesional"

                        value={studentForm.career ?? ''}

                        onChange={(e) => handleCareerChange(e.target.value)}

                        disabled={catalogLoading || !studentForm.faculty}

                      >

                        <option value="">

                          {studentForm.faculty

                            ? '— Seleccione una carrera —'

                            : 'Seleccione primero la facultad'}

                        </option>

                        {availableCareers.map((c) => (

                          <option key={c.id} value={c.name}>

                            {c.name}{c.active === false ? ' (inactiva)' : ''}

                          </option>

                        ))}

                      </Select>

                    </Field>

                  </div>

                  <div className="modal-field-grid modal-field-grid--3">

                    <Field label="Ciclo actual" icon={<Layers size={13} />} error={fieldErrors.currentCycle}>

                      <input style={inputStyle} type="number" min={1} max={20} value={studentForm.currentCycle ?? ''} onChange={(e) => setStudentField('currentCycle', e.target.value === '' ? undefined : Number(e.target.value))} placeholder="1" />

                    </Field>

                    <Field label="Créditos aprobados" icon={<Award size={13} />} error={fieldErrors.approvedCredits}>

                      <input style={inputStyle} type="number" min={0} value={studentForm.approvedCredits ?? ''} onChange={(e) => setStudentField('approvedCredits', e.target.value === '' ? undefined : Number(e.target.value))} placeholder="0" />

                    </Field>

                    <Field label="Promedio ponderado" icon={<Percent size={13} />} hint="Escala de 0 a 20." error={fieldErrors.weightedAverage}>

                      <input style={inputStyle} type="number" min={0} max={20} step={0.01} value={studentForm.weightedAverage ?? ''} onChange={(e) => setStudentField('weightedAverage', e.target.value === '' ? undefined : Number(e.target.value))} placeholder="0.00" />

                    </Field>

                  </div>

                  <div className="modal-field-grid">

                    <Field label="Condición" icon={<DegreeIcon size={13} />} error={fieldErrors.condition}>

                      <Select style={inputStyle} value={studentForm.condition} onChange={(e) => setStudentField('condition', e.target.value)}>

                        {CONDITIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}

                      </Select>

                    </Field>

                    <Field label="Estado de matrícula" icon={<CheckCircle2 size={13} />} error={fieldErrors.enrollmentStatus}>

                      <Select style={inputStyle} value={studentForm.enrollmentStatus} onChange={(e) => setStudentField('enrollmentStatus', e.target.value)}>

                        {ENROLLMENT_STATUS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}

                      </Select>

                    </Field>

                  </div>

                  <p className="field-hint">

                    Las facultades y carreras provienen del catálogo registrado en el módulo Universidad.

                    Al elegir una carrera se completa automáticamente su facultad.

                    {facultyOptions.length === 0 && !catalogLoading && (

                      <> No hay facultades disponibles: regístralas primero en Universidad → Facultades.</>

                    )}

                  </p>

                </>

              )}



              {studentStep === 2 && (

                <>

                  <h4 className="modal-step-title"><UserRound size={15} /> Acceso y confirmación</h4>

                  {(canLinkAccounts || canCreateAccounts) && (
                    <>
                      {canCreateAccounts && !studentForm.userId && (
                        <div className="account-mode-switch" role="group" aria-label="Forma de acceso">
                          <button
                            type="button"
                            className={studentAccountMode === 'link' ? 'is-active' : ''}
                            onClick={() => setAccountMode('link')}
                          >
                            Vincular cuenta existente
                          </button>
                          <button
                            type="button"
                            className={studentAccountMode === 'create' ? 'is-active' : ''}
                            onClick={startStudentAccountCreation}
                          >
                            Crear cuenta nueva
                          </button>
                        </div>
                      )}

                      {studentAccountMode === 'link' ? (
                        <Field
                          label="Cuenta de acceso (obligatoria)"
                          icon={<UserRound size={13} />}
                          error={fieldErrors.userId}
                          hint={
                            linkableUsers.filter((candidate) => !students.some((item) => item.userId === candidate.id && item.id !== studentForm.id)).length === 0
                              ? 'No hay cuentas libres con rol ESTUDIANTE. Usa “Crear cuenta nueva”.'
                              : 'Permite que el estudiante consulte su avance y su historial en el portal.'
                          }
                        >
                          <Select
                            style={inputStyle}
                            value={studentForm.userId && studentForm.userId > 0 ? studentForm.userId : ''}
                            onChange={(e) => setStudentField('userId', e.target.value ? Number(e.target.value) : 0)}
                          >
                            <option value="">Selecciona una cuenta</option>
                            {linkableUsers
                              .filter((candidate) => !students.some((item) => item.userId === candidate.id && item.id !== studentForm.id))
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
                                placeholder="ej. estudiante.2026-030001"
                                autoComplete="username"
                              />
                            </Field>
                            <Field label="Correo de la cuenta" icon={<Mail size={13} />} error={fieldErrors.accountEmail}>
                              <input
                                style={inputStyle}
                                type="email"
                                value={accountForm.email}
                                onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })}
                                placeholder="estudiante@gestoracad.edu"
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
                            Se creará una cuenta activa con rol ESTUDIANTE y quedará vinculada a esta ficha. Guarda la contraseña.
                          </p>
                        </>
                      )}
                    </>
                  )}

                  <div className="form-review" aria-label="Resumen del estudiante">

                    <div><span>Código</span><strong>{studentForm.code || '—'}</strong></div>

                    <div><span>Estudiante</span><strong>{[studentForm.firstName, studentForm.lastName].filter(Boolean).join(' ') || '—'}</strong></div>

                    <div><span>Facultad</span><strong>{studentForm.faculty || '—'}</strong></div>

                    <div><span>Carrera</span><strong>{studentForm.career || '—'}</strong></div>

                    <div><span>Ciclo</span><strong>{studentForm.currentCycle ?? '—'}</strong></div>

                    <div><span>Condición</span><strong>{CONDITION_LABEL(studentForm.condition)}</strong></div>

                    <div><span>Matrícula</span><strong>{ENROLLMENT_STATUS.find((s) => s.value === studentForm.enrollmentStatus)?.label ?? studentForm.enrollmentStatus}</strong></div>

                    <div><span>Cuenta</span><strong>{studentForm.userId ? 'Vinculada' : studentAccountMode === 'create' ? 'Se creará cuenta nueva' : 'Sin vincular'}</strong></div>

                  </div>

                  <p className="field-hint">Revisa la información. Al guardar, el registro queda sujeto a las validaciones del servidor y a la auditoría.</p>

                </>

              )}

            </div>



            <div className="modal-step-footer">

              <span className="modal-step-indicator">Paso {studentStep + 1} de {STUDENT_FORM_STEPS.length}</span>

              <div className="modal-step-actions">

                <Button type="button" variant="secondary" onClick={() => setStudentModal(false)}>Cancelar</Button>

                {studentStep > 0 && (

                  <Button type="button" variant="secondary" onClick={() => goStudentStep(studentStep - 1)}>Anterior</Button>

                )}

                {studentStep < STUDENT_FORM_STEPS.length - 1 ? (

                  <Button type="button" onClick={() => goStudentStep(studentStep + 1)}>Siguiente</Button>

                ) : (

                  <Button type="submit" isLoading={isSubmitting}>{studentForm.id ? 'Guardar Cambios' : 'Registrar Estudiante'}</Button>

                )}

              </div>

            </div>

          </form>

        </Modal>

      )}



      {/* Modal de Gestión (Historial de ingreso) */}

      {manageStudent && (

        <Modal

          title={`Expediente: ${manageStudent.firstName} ${manageStudent.lastName}`}

          icon={<Award size={20} color="var(--accent-amber)" />}

          maxWidth="760px"

          onClose={() => setManageStudent(null)}

        >

          {manageError && <div style={{ padding: '10px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--status-down-bg)', color: 'var(--status-down)', fontSize: 'var(--text-sm)', marginBottom: '12px' }}>{manageError}</div>}



          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(130px, 100%), 1fr))', gap: '12px', padding: '14px', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)', marginBottom: '16px', fontSize: 'var(--text-sm)' }}>

            <div>

              <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>Código / DNI</span>

              <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{manageStudent.code} · {manageStudent.documentId || '—'}</div>

            </div>

            <div>

              <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>Carrera</span>

              <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{manageStudent.career || '—'}</div>

            </div>

            <div>

              <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>Promedio / Ciclo</span>

              <div style={{ fontWeight: 700, color: 'var(--accent-emerald)' }}>

                {(manageStudent.weightedAverage ?? 0).toFixed(2)} · Ciclo {manageStudent.currentCycle ?? 1}

              </div>

            </div>

          </div>



          <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>

            <FileText size={16} color="var(--accent-cyan)" /> Historial de Ingreso

          </h4>



          {manageLoading ? (

            <LoadingSpinner message="Cargando historial de ingreso..." />

          ) : (

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

              {canManageAdmission && (

                <div>

                  {admissionForm ? (

                    <form onSubmit={handleSaveAdmission} className="form-panel" ref={admissionFormRef}>

                      <div className="form-section">Datos del ingreso</div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: '12px' }}>

                        <Field label="Modalidad">

                          <Select style={inputStyle} value={admissionForm.modality} onChange={(e) => setAdmissionForm({ ...admissionForm, modality: e.target.value })}>

                            {MODALITIES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}

                          </Select>

                        </Field>

                        <Field label="Periodo">

                          <input style={inputStyle} required value={admissionForm.period} onChange={(e) => setAdmissionForm({ ...admissionForm, period: e.target.value })} placeholder="2026-I" />

                        </Field>

                        <Field label="Puntaje">

                          <input style={inputStyle} type="number" min={0} max={100} step={0.01} value={admissionForm.score ?? ''} onChange={(e) => setAdmissionForm({ ...admissionForm, score: e.target.value === '' ? undefined : Number(e.target.value) })} />

                        </Field>

                        <Field label="Fecha de admisión">

                          <DatePicker style={inputStyle} ariaLabel="Fecha de admisión" max={new Date().toISOString().slice(0, 10)} value={admissionForm.admissionDate ?? ''} onChange={(next) => setAdmissionForm({ ...admissionForm, admissionDate: next })} />

                        </Field>

                        <Field label="Estado">

                          <Select style={inputStyle} value={admissionForm.status} onChange={(e) => setAdmissionForm({ ...admissionForm, status: e.target.value })}>

                            {ADMISSION_STATUS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}

                          </Select>

                        </Field>

                        <Field label="Colegio de procedencia">

                          <input style={inputStyle} value={admissionForm.highSchool ?? ''} onChange={(e) => setAdmissionForm({ ...admissionForm, highSchool: e.target.value })} />

                        </Field>

                      </div>

                      <Field label="Observación">

                        <input style={inputStyle} value={admissionForm.observation ?? ''} onChange={(e) => setAdmissionForm({ ...admissionForm, observation: e.target.value })} />

                      </Field>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>

                        <Button type="button" variant="secondary" size="sm" onClick={() => setAdmissionForm(null)}>Cancelar</Button>

                        <Button type="submit" size="sm" isLoading={isSubmitting}>{admissionForm.id ? 'Actualizar' : 'Agregar'}</Button>

                      </div>

                    </form>

                  ) : (

                    <Button size="sm" leftIcon={<Plus size={15} />} onClick={() => setAdmissionForm({ modality: 'ORDINARIO', period: '2026-I', status: 'ADMITIDO' })}>

                      Agregar Registro de Ingreso

                    </Button>

                  )}

                </div>

              )}



              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>

                {admissions.map((a) => (

                  <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', padding: '10px 14px', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)' }}>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>

                      <DegreeIcon size={18} color="var(--accent-cyan)" />

                      <div>

                        <div style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text-main)' }}>

                          {MODALITIES.find((m) => m.value === a.modality)?.label ?? a.modality} · {a.period}

                        </div>

                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>

                          {ADMISSION_STATUS.find((s) => s.value === a.status)?.label ?? a.status}

                          {a.score != null ? ` · Puntaje ${Number(a.score).toFixed(2)}` : ''}

                          {a.highSchool ? ` · ${a.highSchool}` : ''}

                          {a.admissionDate ? ` · ${formatAdmissionDate(a.admissionDate)}` : ''}

                        </div>

                      </div>

                    </div>

                    {canManageAdmission && (

                      <div style={{ display: 'flex', gap: '10px' }}>

                        {hasPermission('ADMISION_EDIT') && (

                          <button type="button" className="ghost-btn primary" onClick={() => setAdmissionForm({ ...a })}>

                            <Pencil size={13} /> Editar

                          </button>

                        )}

                        {hasPermission('ADMISION_DELETE') && (

                          <button type="button" className="ghost-btn danger" onClick={() => handleDeleteAdmission(a)}>

                            <Trash2 size={13} /> Eliminar

                          </button>

                        )}

                      </div>

                    )}

                  </div>

                ))}

                {admissions.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-base)' }}>Sin registros de ingreso.</p>}

              </div>

            </div>

          )}

        </Modal>

      )}

    </div>

  );

};

