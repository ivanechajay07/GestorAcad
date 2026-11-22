import React, { useCallback, useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Modal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { DatePicker } from '../components/ui/DatePicker';
import { SectionHeader } from '../components/ui/SectionHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { FormSummary } from '../components/ui/FormSummary';
import { formControlStyle, formLabelStyle } from '../components/ui/formStyles';
import { getApiErrorMessage } from '../utils/apiErrors';
import { useAuth } from '../contexts/AuthContext';
import { useConfirm } from '../contexts/ConfirmContext';
import { useToast } from '../contexts/ToastContext';
import { universityService } from '../services/universityService';
import type {
  AuthorityDto,
  CampusDto,
  CareerDto,
  FacultyDto,
  SystemParameterDto,
  UniversityDto,
} from '../services/universityService';
import {
  AlertCircle,
  AlignLeft,
  Award,
  BookOpen,
  Briefcase,
  Building2,
  Check,
  Calendar,
  CalendarDays,
  DoorOpen,
  FileText,
  FlaskConical,
  GraduationCap,
  Hash,
  Key,
  Layers,
  LayoutGrid,
  List,
  Mail,
  Map,
  MapPin,
  Navigation,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Save,
  School,
  Settings2,
  ShieldCheck,
  Trash2,
  Type,
  UserRound,
  Users,
} from 'lucide-react';

type TabKey = 'general' | 'campuses' | 'faculties' | 'careers' | 'authorities' | 'parameters';

const inputStyle = formControlStyle;
const labelStyle = formLabelStyle;

const humanize = (value?: string): string =>
  value
    ? value.replace(/_/g, ' ').toLowerCase().replace(/(^|\s)\S/g, (letter) => letter.toUpperCase())
    : '—';

const VALUE_TYPE_LABELS: Record<string, string> = {
  STRING: 'Texto',
  NUMBER: 'Número',
  BOOLEAN: 'Booleano',
  DATE: 'Fecha',
  JSON: 'JSON',
};

const CAMPUS_TYPES = [
  { value: 'CAMPUS', label: 'Campus' },
  { value: 'SEDE_PRINCIPAL', label: 'Sede principal' },
  { value: 'FILIAL', label: 'Filial' },
];

const UNIVERSITY_STEPS = [
  { title: 'Identidad', description: 'Datos oficiales' },
  { title: 'Licenciamiento', description: 'RUC y acreditación' },
  { title: 'Contacto', description: 'Ubicación y canales' },
];

const errMsg = (err: unknown, fallback: string): string => getApiErrorMessage(err, fallback);

const Field: React.FC<{
  label: string;
  children: React.ReactNode;
  hint?: string;
  icon?: React.ReactNode;
  className?: string;
}> = ({ label, children, hint, icon, className = '' }) => (
  <label className={`field ${className}`.trim()}>
    <span className="field-label">
      {icon && <span className="field-label__icon" aria-hidden="true">{icon}</span>}
      {label}
    </span>
    {children}
    {hint && <span className="field-hint">{hint}</span>}
  </label>
);

const FormError: React.FC<{ message: string | null }> = ({ message }) =>
  message ? (
    <div className="form-error-banner" role="alert">
      <AlertCircle size={16} aria-hidden="true" />
      <span>{message}</span>
    </div>
  ) : null;

export const UniversityPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const { confirm } = useConfirm();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<TabKey>('general');
  const [universityStep, setUniversityStep] = useState(0);

  const [university, setUniversity] = useState<UniversityDto | null>(null);
  const [campuses, setCampuses] = useState<CampusDto[]>([]);
  const [faculties, setFaculties] = useState<FacultyDto[]>([]);
  const [careers, setCareers] = useState<CareerDto[]>([]);
  const [authorities, setAuthorities] = useState<AuthorityDto[]>([]);
  const [parameters, setParameters] = useState<SystemParameterDto[]>([]);

  const [loading, setLoading] = useState(true);

  const [campusModal, setCampusModal] = useState(false);
  const [campusForm, setCampusForm] = useState<CampusDto>({
    name: '',
    code: '',
    campusType: 'CAMPUS',
  });

  const [facultyModal, setFacultyModal] = useState(false);
  const [facultyForm, setFacultyForm] = useState<FacultyDto>({
    name: '',
    description: '',
  });

  const [careerModal, setCareerModal] = useState(false);
  const [careerForm, setCareerForm] = useState<CareerDto>({
    name: '',
    description: '',
    facultyId: 0,
  });
  const [careerFilter, setCareerFilter] = useState<'ALL' | number>('ALL');

  const [authorityModal, setAuthorityModal] = useState(false);
  const [authorityForm, setAuthorityForm] = useState<AuthorityDto>({
    position: '',
    firstName: '',
    lastName: '',
  });

  const [parameterModal, setParameterModal] = useState(false);
  const [parameterForm, setParameterForm] = useState<SystemParameterDto>({
    key: '',
    value: '',
    valueType: 'STRING',
    module: 'SISTEMA',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const canEditUniversity = hasPermission('UNIVERSIDAD_EDIT');
  const canManageCampus = hasPermission('SEDE_CREATE');
  const canManageFaculty = hasPermission('FACULTAD_CREATE');
  const canManageCareer = hasPermission('CARRERA_CREATE');
  const canManageAuthority = hasPermission('AUTORIDAD_CREATE');
  const canManageParameter = hasPermission('PARAMETRO_EDIT');

  const reload = useCallback(async () => {
    setLoading(true);
        const tasks: Promise<void>[] = [];

    if (hasPermission('UNIVERSIDAD_VIEW')) {
      tasks.push(
        universityService
          .getActiveUniversity()
          .then((res) => setUniversity(res.data))
          .catch((err) => toast.error(errMsg(err, 'No se pudo cargar la información institucional')))
      );
    }
    if (hasPermission('SEDE_VIEW')) {
      tasks.push(
        universityService.getCampuses().then((res) => setCampuses(res.data)).catch(() => undefined)
      );
    }
    if (hasPermission('FACULTAD_VIEW')) {
      tasks.push(
        universityService.getFaculties().then((res) => setFaculties(res.data)).catch(() => undefined)
      );
    }
    if (hasPermission('CARRERA_VIEW')) {
      tasks.push(
        universityService.getCareers().then((res) => setCareers(res.data)).catch(() => undefined)
      );
    }
    if (hasPermission('AUTORIDAD_VIEW')) {
      tasks.push(
        universityService.getAuthorities().then((res) => setAuthorities(res.data)).catch(() => undefined)
      );
    }
    if (hasPermission('PARAMETRO_VIEW')) {
      tasks.push(
        universityService.getParameters().then((res) => setParameters(res.data)).catch(() => undefined)
      );
    }

    await Promise.allSettled(tasks);
    setLoading(false);
  }, [hasPermission, toast]);

  useEffect(() => {
    reload();
  }, [reload]);

  const flashSuccess = (message: string) => toast.success(message);

  /* ---------------------------- Universidad ---------------------------- */
  const handleSaveUniversity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!university) return;
    setIsSubmitting(true);
        try {
      const res = university?.id
        ? await universityService.updateUniversity(university.id, university)
        : await universityService.createUniversity(university);
      setUniversity(res.data);
      flashSuccess('Información institucional guardada correctamente.');
    } catch (err) {
      toast.error(errMsg(err, 'Error al guardar la información institucional'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const setUniField = (field: keyof UniversityDto, value: string) => {
    setUniversity((prev) => (prev ? ({ ...prev, [field]: value } as UniversityDto) : prev));
  };

  /* ------------------------------- Sedes ------------------------------- */
  const openCampusModal = (campus?: CampusDto) => {
    setFormError(null);
    setCampusForm(
      campus ?? {
        name: '',
        code: '',
        campusType: 'CAMPUS',
        universityId: university?.id,
      }
    );
    setCampusModal(true);
  };

  const handleSaveCampus = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);
    try {
      const payload = { ...campusForm, universityId: campusForm.universityId ?? university?.id };
      if (campusForm.id) {
        await universityService.updateCampus(campusForm.id, payload);
      } else {
        await universityService.createCampus(payload);
      }
      const res = await universityService.getCampuses();
      setCampuses(res.data);
      setCampusModal(false);
      flashSuccess('Sede guardada correctamente.');
    } catch (err) {
      setFormError(errMsg(err, 'Error al guardar la sede'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCampus = async (campus: CampusDto) => {
    if (!campus.id) return;
    const confirmed = await confirm({
      title: 'Desactivar sede',
      message: `¿Desactivar la sede "${campus.name}"?`,
      confirmLabel: 'Desactivar',
      variant: 'danger',
    });
    if (!confirmed) return;
    try {
      await universityService.deleteCampus(campus.id);
      setCampuses((prev) => prev.map((c) => (c.id === campus.id ? { ...c, active: false } : c)));
      flashSuccess('Sede desactivada.');
    } catch (err) {
      toast.error(errMsg(err, 'Error al desactivar la sede'));
    }
  };

  /* ---------------------------- Facultades ---------------------------- */
  const openFacultyModal = (faculty?: FacultyDto) => {
    setFormError(null);
    setFacultyForm(faculty ?? { name: '', description: '' });
    setFacultyModal(true);
  };

  const handleSaveFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);
    try {
      if (facultyForm.id) {
        await universityService.updateFaculty(facultyForm.id, facultyForm);
      } else {
        await universityService.createFaculty(facultyForm);
      }
      const res = await universityService.getFaculties();
      setFaculties(res.data);
      setFacultyModal(false);
      flashSuccess('Facultad guardada correctamente.');
    } catch (err) {
      setFormError(errMsg(err, 'Error al guardar la facultad'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteFaculty = async (faculty: FacultyDto) => {
    if (!faculty.id) return;
    const confirmed = await confirm({
      title: 'Desactivar facultad',
      message: `¿Desactivar la facultad "${faculty.name}"? Solo es posible si no tiene carreras, estudiantes ni docentes activos.`,
      confirmLabel: 'Desactivar',
      variant: 'danger',
    });
    if (!confirmed) return;
    try {
      await universityService.deleteFaculty(faculty.id);
      const [facultyRes, careerRes] = await Promise.all([
        universityService.getFaculties(),
        hasPermission('CARRERA_VIEW') ? universityService.getCareers() : Promise.resolve(null),
      ]);
      setFaculties(facultyRes.data);
      if (careerRes) setCareers(careerRes.data);
      flashSuccess('Facultad desactivada.');
    } catch (err) {
      toast.error(errMsg(err, 'Error al desactivar la facultad'));
    }
  };

  /* ------------------------------ Carreras ----------------------------- */
  const openCareerModal = (career?: CareerDto) => {
    setFormError(null);
    setCareerForm(
      career ?? {
        name: '',
        description: '',
        facultyId: typeof careerFilter === 'number' ? careerFilter : faculties[0]?.id ?? 0,
      }
    );
    setCareerModal(true);
  };

  const refreshCatalog = async () => {
    const [facultyRes, careerRes] = await Promise.all([
      universityService.getFaculties(),
      universityService.getCareers(),
    ]);
    setFaculties(facultyRes.data);
    setCareers(careerRes.data);
  };

  const handleSaveCareer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!careerForm.facultyId) {
      setFormError('Debes seleccionar la facultad a la que pertenece la carrera.');
      return;
    }
    setIsSubmitting(true);
    setFormError(null);
    try {
      if (careerForm.id) {
        await universityService.updateCareer(careerForm.id, careerForm);
      } else {
        await universityService.createCareer(careerForm);
      }
      await refreshCatalog();
      setCareerModal(false);
      flashSuccess('Carrera guardada correctamente.');
    } catch (err) {
      setFormError(errMsg(err, 'Error al guardar la carrera'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCareer = async (career: CareerDto) => {
    if (!career.id) return;
    const confirmed = await confirm({
      title: 'Desactivar carrera',
      message: `¿Desactivar la carrera "${career.name}"? Solo es posible si no tiene estudiantes activos.`,
      confirmLabel: 'Desactivar',
      variant: 'danger',
    });
    if (!confirmed) return;
    try {
      await universityService.deleteCareer(career.id);
      await refreshCatalog();
      flashSuccess('Carrera desactivada.');
    } catch (err) {
      toast.error(errMsg(err, 'Error al desactivar la carrera'));
    }
  };

  /* ---------------------------- Autoridades ---------------------------- */
  const openAuthorityModal = (authority?: AuthorityDto) => {
    setFormError(null);
    setAuthorityForm(authority ?? { position: '', firstName: '', lastName: '', universityId: university?.id });
    setAuthorityModal(true);
  };

  const handleSaveAuthority = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);
    try {
      const payload = { ...authorityForm, universityId: authorityForm.universityId ?? university?.id };
      if (authorityForm.id) {
        await universityService.updateAuthority(authorityForm.id, payload);
      } else {
        await universityService.createAuthority(payload);
      }
      const res = await universityService.getAuthorities();
      setAuthorities(res.data);
      setAuthorityModal(false);
      flashSuccess('Autoridad guardada correctamente.');
    } catch (err) {
      setFormError(errMsg(err, 'Error al guardar la autoridad'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAuthority = async (authority: AuthorityDto) => {
    if (!authority.id) return;
    const confirmed = await confirm({
      title: 'Desactivar autoridad',
      message: `¿Desactivar a ${authority.firstName} ${authority.lastName}?`,
      confirmLabel: 'Desactivar',
      variant: 'danger',
    });
    if (!confirmed) return;
    try {
      await universityService.deleteAuthority(authority.id);
      setAuthorities((prev) => prev.map((a) => (a.id === authority.id ? { ...a, active: false } : a)));
      flashSuccess('Autoridad desactivada.');
    } catch (err) {
      toast.error(errMsg(err, 'Error al desactivar la autoridad'));
    }
  };

  /* ----------------------------- Parámetros ---------------------------- */
  const openParameterModal = (parameter?: SystemParameterDto) => {
    setFormError(null);
    setParameterForm(parameter ?? { key: '', value: '', valueType: 'STRING', module: 'SISTEMA' });
    setParameterModal(true);
  };

  const handleSaveParameter = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);
    try {
      if (parameterForm.id) {
        await universityService.updateParameter(parameterForm.id, parameterForm);
      } else {
        await universityService.createParameter(parameterForm);
      }
      const res = await universityService.getParameters();
      setParameters(res.data);
      setParameterModal(false);
      flashSuccess('Parámetro guardado correctamente.');
    } catch (err) {
      setFormError(errMsg(err, 'Error al guardar el parámetro'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteParameter = async (parameter: SystemParameterDto) => {
    if (!parameter.id) return;
    const confirmed = await confirm({
      title: 'Desactivar parámetro',
      message: `¿Desactivar el parámetro "${parameter.key}"?`,
      confirmLabel: 'Desactivar',
      variant: 'danger',
    });
    if (!confirmed) return;
    try {
      await universityService.deleteParameter(parameter.id);
      setParameters((prev) => prev.map((p) => (p.id === parameter.id ? { ...p, active: false } : p)));
      flashSuccess('Parámetro desactivado.');
    } catch (err) {
      toast.error(errMsg(err, 'Error al desactivar el parámetro'));
    }
  };

  const visibleCareers = careerFilter === 'ALL'
    ? careers
    : careers.filter((c) => c.facultyId === careerFilter);

  const campusProgressFields = [
    campusForm.name,
    campusForm.code,
    campusForm.city,
    campusForm.address,
    campusForm.capacity,
  ].filter((value) => value !== undefined && value !== null && String(value).trim() !== '').length;
  const campusProgress = Math.round((campusProgressFields / 5) * 100);
  const campusTypeLabel = CAMPUS_TYPES.find((type) => type.value === campusForm.campusType)?.label ?? 'Campus';

  const tabButton = (key: TabKey, label: string, icon: React.ReactNode) => (
    <button
      key={key}
      type="button"
      role="tab"
      aria-selected={activeTab === key}
      onClick={() => setActiveTab(key)}
      className={`tab${activeTab === key ? ' active' : ''}`}
    >
      {icon} {label}
    </button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <PageHeader
        title={university ? `${university.name} (${university.shortName ?? '—'})` : 'Institución Matriz'}
        subtitle={university?.motto ? `“${university.motto}”` : 'Configure la información institucional'}
        icon={<Building2 size={28} />}
        accent="var(--primary)"
        breadcrumbs={[{ label: 'Portal Académico' }, { label: 'Módulo Universidad' }]}
        badges={
          <Badge variant={university?.active === false ? 'danger' : 'success'} dot>
            {university?.active === false ? 'INACTIVA' : 'ACTIVA'}
          </Badge>
        }
        actions={
          <Button variant="outline" leftIcon={<RefreshCw size={16} />} onClick={reload} isLoading={loading}>
            Actualizar
          </Button>
        }
        stats={[
          { label: 'Sedes', value: campuses.length },
          { label: 'Facultades', value: faculties.length },
          { label: 'Carreras', value: careers.length },
          { label: 'Autoridades', value: authorities.length },
        ]}
      />

      {/* Navegación por Pestañas */}
      <div className="tabs-bar">
        <div className="tabs-nav" role="tablist" aria-label="Secciones del módulo universidad">
          {tabButton('general', 'Información General', <Building2 size={15} />)}
          {tabButton('campuses', 'Sedes & Campus', <MapPin size={15} />)}
          {tabButton('faculties', 'Facultades', <School size={15} />)}
          {tabButton('careers', 'Carreras', <BookOpen size={15} />)}
          {tabButton('authorities', 'Gobierno Universitario', <Award size={15} />)}
          {hasPermission('PARAMETRO_VIEW') && tabButton('parameters', 'Parametrización Global', <Settings2 size={15} />)}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner message="Consultando módulo universidad en la base de datos..." />
      ) : (
        <>
          {/* ---------------------- Información General ---------------------- */}
          {activeTab === 'general' && (
            <form onSubmit={handleSaveUniversity} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <Card>
                <SectionHeader
                  compact
                  icon={<Building2 size={18} />}
                  eyebrow="Institución"
                  title="Datos institucionales y licenciamiento"
                  description="Información oficial, vigencia normativa y canales de contacto de la institución."
                  aside={
                    <Badge variant={canEditUniversity ? 'info' : 'outline'} dot>
                      {canEditUniversity ? 'Editable' : 'Solo lectura'}
                    </Badge>
                  }
                />

                <div className="institution-stepper university-stepper" aria-label="Pasos de configuración institucional">
                  {UNIVERSITY_STEPS.map((step, index) => (
                    <button
                      key={step.title}
                      type="button"
                      className={`institution-step${universityStep === index ? ' is-active' : ''}${index < universityStep ? ' is-complete' : ''}`}
                      aria-current={universityStep === index ? 'step' : undefined}
                      onClick={() => setUniversityStep(index)}
                    >
                      <span className="institution-step__number">{index + 1}</span>
                      <span className="institution-step__copy">
                        <strong>{step.title}</strong>
                        <small>{step.description}</small>
                      </span>
                    </button>
                  ))}
                </div>

                <div className="university-step-progress" aria-hidden="true">
                  <span style={{ width: `${((universityStep + 1) / UNIVERSITY_STEPS.length) * 100}%` }} />
                </div>

                <div className="institution-layout">
                  <div className={`institution-form university-step-${universityStep}`}>
                  <section className="institution-form__section" aria-labelledby="university-identity">
                    <h4 id="university-identity" className="institution-section__title">
                      <Building2 size={14} aria-hidden="true" /> Identidad institucional
                      <span className={`form-section__status${university?.name?.trim() && university?.shortName?.trim() ? ' is-done' : ''}`}>
                        {university?.name?.trim() && university?.shortName?.trim()
                          ? <><Check size={12} aria-hidden="true" /> Listo</>
                          : 'Pendiente'}
                      </span>
                    </h4>
                    <div className="institution-grid">
                      <Field label="Nombre oficial" className="field--span-2">
                        <input style={inputStyle} disabled={!canEditUniversity} value={university?.name ?? ''} onChange={(e) => setUniField('name', e.target.value)} required placeholder="Ej. Universidad Tecnológica del Perú" />
                      </Field>
                      <Field label="Nombre corto / Sigla">
                        <input style={inputStyle} disabled={!canEditUniversity} value={university?.shortName ?? ''} onChange={(e) => setUniField('shortName', e.target.value)} placeholder="Ej. UTP" />
                      </Field>
                      <Field label="Tipo de institución">
                        <select style={inputStyle} disabled={!canEditUniversity} value={university?.institutionType ?? 'PUBLICA'} onChange={(e) => setUniField('institutionType', e.target.value)}>
                          <option value="PUBLICA">Pública</option>
                          <option value="PRIVADA">Privada</option>
                          <option value="ASOCIATIVA">Asociativa</option>
                        </select>
                      </Field>
                      <Field label="Lema institucional" className="field--span-2">
                        <input style={inputStyle} disabled={!canEditUniversity} value={university?.motto ?? ''} onChange={(e) => setUniField('motto', e.target.value)} placeholder="Ej. Ciencia, Veritas et Progressus" />
                      </Field>
                    </div>
                  </section>

                  <section className="institution-form__section" aria-labelledby="university-licensing">
                    <h4 id="university-licensing" className="institution-section__title">
                      <ShieldCheck size={14} aria-hidden="true" /> Licenciamiento y acreditación
                      <span className={`form-section__status${university?.taxId?.trim() && university?.licensingStatus?.trim() ? ' is-done' : ''}`}>
                        {university?.taxId?.trim() && university?.licensingStatus?.trim()
                          ? <><Check size={12} aria-hidden="true" /> Listo</>
                          : 'Pendiente'}
                      </span>
                    </h4>
                    <div className="institution-grid">
                      <Field label="RUC" hint="Identificación tributaria de la institución.">
                        <input style={inputStyle} disabled={!canEditUniversity} maxLength={20} value={university?.taxId ?? ''} onChange={(e) => setUniField('taxId', e.target.value)} placeholder="Ej. 20462509236" inputMode="numeric" />
                      </Field>
                      <Field label="Resolución de licenciamiento">
                        <input style={inputStyle} disabled={!canEditUniversity} maxLength={255} value={university?.licensingResolution ?? ''} onChange={(e) => setUniField('licensingResolution', e.target.value)} placeholder="Ej. Res. CD N° 048-2022-SUNEDU" />
                      </Field>
                      <Field label="Estado de licenciamiento">
                        <select style={inputStyle} disabled={!canEditUniversity} value={university?.licensingStatus ?? 'EN_PROCESO'} onChange={(e) => setUniField('licensingStatus', e.target.value)}>
                          <option value="LICENCIADA">Licenciada</option>
                          <option value="EN_PROCESO">En proceso</option>
                          <option value="NO_LICENCIADA">No licenciada</option>
                          <option value="SUSPENDIDA">Suspendida</option>
                        </select>
                      </Field>
                      <Field label="Vigencia de acreditación">
                        <DatePicker style={inputStyle} ariaLabel="Vigencia de la acreditación" disabled={!canEditUniversity} value={university?.accreditationValidity ?? ''} onChange={(next) => setUniField('accreditationValidity', next)} />
                      </Field>
                      <Field label="Fecha de fundación">
                        <DatePicker style={inputStyle} ariaLabel="Fecha de fundación" disabled={!canEditUniversity} value={university?.foundationDate ?? ''} onChange={(next) => setUniField('foundationDate', next)} />
                      </Field>
                      <Field label="Última actualización">
                        <input
                          style={inputStyle}
                          readOnly
                          value={university?.updatedAt
                            ? new Date(university.updatedAt).toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' })
                            : '—'}
                        />
                      </Field>
                    </div>
                  </section>

                  <section className="institution-form__section" aria-labelledby="university-contact">
                    <h4 id="university-contact" className="institution-section__title">
                      <MapPin size={14} aria-hidden="true" /> Contacto y ubicación
                      <span className={`form-section__status${university?.address?.trim() && (university?.phone?.trim() || university?.email?.trim()) ? ' is-done' : ''}`}>
                        {university?.address?.trim() && (university?.phone?.trim() || university?.email?.trim())
                          ? <><Check size={12} aria-hidden="true" /> Listo</>
                          : 'Pendiente'}
                      </span>
                    </h4>
                    <div className="institution-grid">
                      <Field label="Dirección" className="field--span-2">
                        <input style={inputStyle} disabled={!canEditUniversity} value={university?.address ?? ''} onChange={(e) => setUniField('address', e.target.value)} placeholder="Ej. Av. Universitaria 1801, Lima" autoComplete="street-address" />
                      </Field>
                      <Field label="Teléfono">
                        <input style={inputStyle} type="tel" disabled={!canEditUniversity} value={university?.phone ?? ''} onChange={(e) => setUniField('phone', e.target.value)} placeholder="Ej. +51 1 456 7890" autoComplete="tel" />
                      </Field>
                      <Field label="Correo institucional">
                        <input style={inputStyle} type="email" disabled={!canEditUniversity} value={university?.email ?? ''} onChange={(e) => setUniField('email', e.target.value)} placeholder="Ej. informes@universidad.edu.pe" autoComplete="email" />
                      </Field>
                      <Field label="Sitio web" className="field--span-2">
                        <input style={inputStyle} type="url" disabled={!canEditUniversity} value={university?.website ?? ''} onChange={(e) => setUniField('website', e.target.value)} placeholder="Ej. https://www.universidad.edu.pe" />
                      </Field>
                    </div>
                  </section>
                </div>


                </div>

                <div className="institution-form__footer">
                  <span className="institution-form__note">
                    {canEditUniversity ? (
                      <>
                        <ShieldCheck size={14} aria-hidden="true" />
                        Los cambios quedan registrados en la auditoría institucional.
                      </>
                    ) : (
                      <>Vista de solo lectura.</>
                    )}
                  </span>
                  <span className="institution-form__step">
                    Paso {universityStep + 1} de {UNIVERSITY_STEPS.length} · {UNIVERSITY_STEPS[universityStep].title}
                  </span>
                  <div className="institution-form__actions">
                    {universityStep > 0 && (
                      <Button type="button" variant="secondary" onClick={() => setUniversityStep((current) => Math.max(0, current - 1))}>
                        Anterior
                      </Button>
                    )}
                    {universityStep < UNIVERSITY_STEPS.length - 1 ? (
                      <Button
                        type="button"
                        onClick={() => setUniversityStep((current) => Math.min(UNIVERSITY_STEPS.length - 1, current + 1))}
                        disabled={universityStep === 0 && !university?.name?.trim()}
                      >
                        Siguiente
                      </Button>
                    ) : canEditUniversity ? (
                      <Button type="submit" leftIcon={<Save size={16} />} isLoading={isSubmitting}>
                        Guardar información
                      </Button>
                    ) : null}
                  </div>
                </div>
              </Card>
            </form>
          )}

          {/* --------------------------- Sedes --------------------------- */}
          {activeTab === 'campuses' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <SectionHeader
                icon={<Building2 size={20} />}
                eyebrow="Infraestructura"
                title={`Sedes y campus (${campuses.length})`}
                description="Sedes, filiales y campus operativos de la institución."
                aside={
                  canManageCampus ? (
                    <Button size="sm" onClick={() => openCampusModal()} leftIcon={<Plus size={15} />}>
                      Nueva Sede
                    </Button>
                  ) : undefined
                }
              />
              <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))', gap: '16px' }}>
                {campuses.map((c) => (
                  <Card key={c.id} interactive className="card-fill">
                    <div className="entity-card-v2">
                      <div className="entity-head">
                        <span className="entity-avatar">
                          <Building2 size={20} />
                        </span>
                        <div className="entity-id">
                          <h4>{c.name}</h4>
                          <span className="entity-code">{c.code}</span>
                        </div>
                        <div className="entity-badges">
                          <Badge variant={c.active === false ? 'danger' : 'success'} size="sm" dot>
                            {c.active === false ? 'Inactiva' : 'Operativa'}
                          </Badge>
                        </div>
                      </div>

                      <div className="entity-info">
                        <div className="entity-row"><MapPin size={15} /> {c.address || 'Sin dirección registrada'}</div>
                        <div className="entity-row"><Building2 size={15} /> {c.campusType} · {c.city || '—'}</div>
                      </div>

                      <div className="entity-stats">
                        <div><span className="v">{c.pavilions ?? '—'}</span><span className="l">pabellones</span></div>
                        <div><span className="v">{c.laboratories ?? '—'}</span><span className="l">laboratorios</span></div>
                        <div><span className="v">{c.capacity ?? '—'}</span><span className="l">aforo</span></div>
                      </div>

                      {(hasPermission('SEDE_EDIT') || hasPermission('SEDE_DELETE')) && (
                        <div className="entity-actions">
                          {hasPermission('SEDE_EDIT') && (
                            <button type="button" className="ghost-btn primary" onClick={() => openCampusModal(c)}>
                              <Pencil size={14} /> Editar
                            </button>
                          )}
                          {hasPermission('SEDE_DELETE') && c.active !== false && (
                            <button type="button" className="ghost-btn danger" onClick={() => handleDeleteCampus(c)}>
                              <Trash2 size={14} /> Desactivar
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
                {campuses.length === 0 && (
                  <EmptyState
                    icon={<Building2 size={24} />}
                    title="Sin sedes registradas"
                    description="Registra la primera sede o campus para organizar la oferta académica."
                  />
                )}
              </div>
            </div>
          )}

          {/* -------------------------- Facultades -------------------------- */}
          {activeTab === 'faculties' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <SectionHeader
                icon={<School size={20} />}
                eyebrow="Organización académica"
                title={`Facultades (${faculties.length})`}
                description="Cada facultad agrupa carreras y es la adscripción de estudiantes y docentes."
                aside={
                  canManageFaculty ? (
                    <Button size="sm" onClick={() => openFacultyModal()} leftIcon={<Plus size={15} />}>
                      Nueva Facultad
                    </Button>
                  ) : undefined
                }
              />
              <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))', gap: '16px' }}>
                {faculties.map((f) => (
                  <Card key={f.id} interactive className="card-fill">
                    <div className="entity-card-v2">
                      <div className="entity-head">
                        <span className="entity-avatar">
                          <School size={20} />
                        </span>
                        <div className="entity-id">
                          <h4>{f.name}</h4>
                          <span className="entity-code">{f.careerCount ?? 0} carrera(s)</span>
                        </div>
                        <div className="entity-badges">
                          <Badge variant={f.active === false ? 'danger' : 'success'} size="sm" dot>
                            {f.active === false ? 'Inactiva' : 'Activa'}
                          </Badge>
                        </div>
                      </div>

                      <div className="entity-info">
                        <div className="entity-row">
                          <BookOpen size={15} /> {f.description || 'Sin descripción registrada'}
                        </div>
                      </div>

                      <div className="entity-stats">
                        <div><span className="v">{f.careerCount ?? 0}</span><span className="l">carreras</span></div>
                        <div><span className="v">{f.studentCount ?? 0}</span><span className="l">estudiantes</span></div>
                        <div><span className="v">{f.teacherCount ?? 0}</span><span className="l">docentes</span></div>
                      </div>

                      {(hasPermission('FACULTAD_EDIT') || hasPermission('FACULTAD_DELETE')) && (
                        <div className="entity-actions">
                          {hasPermission('FACULTAD_EDIT') && (
                            <button type="button" className="ghost-btn primary" onClick={() => openFacultyModal(f)}>
                              <Pencil size={14} /> Editar
                            </button>
                          )}
                          {hasPermission('FACULTAD_DELETE') && f.active !== false && (
                            <button type="button" className="ghost-btn danger" onClick={() => handleDeleteFaculty(f)}>
                              <Trash2 size={14} /> Desactivar
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
                {faculties.length === 0 && (
                  <EmptyState
                    icon={<School size={24} />}
                    title="Sin facultades registradas"
                    description="Crea la primera facultad para poder asociar carreras, estudiantes y docentes."
                  />
                )}
              </div>
            </div>
          )}

          {/* --------------------------- Carreras --------------------------- */}
          {activeTab === 'careers' && (
            <Card>
              <SectionHeader
                compact
                icon={<BookOpen size={18} />}
                eyebrow="Oferta académica"
                title={`Carreras profesionales (${careers.length})`}
                description="Programas profesionales adscritos a cada facultad."
                aside={
                  canManageCareer ? (
                    <Button
                      size="sm"
                      onClick={() => openCareerModal()}
                      leftIcon={<Plus size={15} />}
                      disabled={faculties.length === 0}
                    >
                      Nueva Carrera
                    </Button>
                  ) : undefined
                }
              />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', marginBottom: '14px' }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>Filtrar por facultad</label>
                <select
                  style={{ ...inputStyle, maxWidth: '320px' }}
                  value={careerFilter}
                  onChange={(e) => setCareerFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                >
                  <option value="ALL">Todas las facultades</option>
                  {faculties.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
                {faculties.length === 0 && (
                  <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
                    Registra una facultad antes de crear carreras.
                  </span>
                )}
              </div>

              <div className="data-table-wrap">
                <table className="data-table data-table--stack">
                  <colgroup>
                  <col style={{ width: '30%' }} />
                  <col style={{ width: '38%' }} />
                  <col style={{ width: '10%' }} />
                  <col style={{ width: '10%' }} />
                  <col style={{ width: '12%' }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>Carrera</th>
                      <th>Facultad</th>
                      <th>Estudiantes</th>
                      <th>Estado</th>
                      <th style={{ textAlign: 'center' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleCareers.map((c) => (
                      <tr key={c.id}>
                        <td className="cell-strong">
                          {c.name}
                          {c.description && (
                            <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)', fontWeight: 400 }}>
                              {c.description}
                            </div>
                          )}
                        </td>
                        <td>{c.facultyName ?? '—'}</td>
                        <td><Badge variant="role" size="sm">{c.studentCount ?? 0}</Badge></td>
                        <td>
                          <Badge variant={c.active === false ? 'danger' : 'success'} size="sm" dot>
                            {c.active === false ? 'Inactiva' : 'Activa'}
                          </Badge>
                        </td>
                        <td>
                          {(hasPermission('CARRERA_EDIT') || hasPermission('CARRERA_DELETE')) && (
                            <div className="action-group">
                              {hasPermission('CARRERA_EDIT') && (
                                <button type="button" className="action-btn primary" title="Editar" aria-label="Editar" onClick={() => openCareerModal(c)}>
                                  <Pencil size={15} />
                                </button>
                              )}
                              {hasPermission('CARRERA_DELETE') && c.active !== false && (
                                <button type="button" className="action-btn danger" title="Desactivar" aria-label="Desactivar" onClick={() => handleDeleteCareer(c)}>
                                  <Trash2 size={15} />
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                    {visibleCareers.length === 0 && (
                      <tr>
                        <td colSpan={5} style={{ color: 'var(--text-muted)' }}>
                          {careers.length === 0
                            ? 'No hay carreras registradas.'
                            : 'No hay carreras para la facultad seleccionada.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* ------------------------ Autoridades ------------------------ */}
          {activeTab === 'authorities' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <SectionHeader
                icon={<GraduationCap size={20} />}
                eyebrow="Gobierno"
                title={`Autoridades (${authorities.length})`}
                description="Autoridades rectorales y de gobierno universitario."
                aside={
                  canManageAuthority ? (
                    <Button size="sm" onClick={() => openAuthorityModal()} leftIcon={<Plus size={15} />}>
                      Nueva Autoridad
                    </Button>
                  ) : undefined
                }
              />
              <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))', gap: '16px' }}>
                {authorities.map((a) => (
                  <Card key={a.id} interactive className="card-fill">
                    <div className="entity-card-v2">
                      <div className="entity-head">
                        <span className="entity-avatar">
                          <GraduationCap size={20} />
                        </span>
                        <div className="entity-id">
                          <h4>{a.firstName} {a.lastName}</h4>
                          <span className="entity-code">{a.position}</span>
                        </div>
                        <div className="entity-badges">
                          <Badge variant={a.active === false ? 'danger' : 'success'} size="sm" dot>
                            {a.active === false ? 'Inactivo' : 'Activo'}
                          </Badge>
                        </div>
                      </div>

                      <div className="entity-info">
                        {a.academicDegree && <div className="entity-row"><Award size={15} /> {a.academicDegree}</div>}
                        <div className="entity-row"><MapPin size={15} /> Despacho: {a.office || '—'}</div>
                        <div className="entity-row"><Calendar size={15} /> {a.periodStart || '—'} / {a.periodEnd || '—'}</div>
                      </div>

                      {(hasPermission('AUTORIDAD_EDIT') || hasPermission('AUTORIDAD_DELETE')) && (
                        <div className="entity-actions">
                          {hasPermission('AUTORIDAD_EDIT') && (
                            <button type="button" className="ghost-btn primary" onClick={() => openAuthorityModal(a)}>
                              <Pencil size={14} /> Editar
                            </button>
                          )}
                          {hasPermission('AUTORIDAD_DELETE') && a.active !== false && (
                            <button type="button" className="ghost-btn danger" onClick={() => handleDeleteAuthority(a)}>
                              <Trash2 size={14} /> Desactivar
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
                {authorities.length === 0 && (
                  <EmptyState
                    icon={<GraduationCap size={24} />}
                    title="Sin autoridades registradas"
                    description="Registra a las autoridades rectorales y de gobierno universitario."
                  />
                )}
              </div>
            </div>
          )}

          {/* ------------------------ Parámetros ------------------------ */}
          {activeTab === 'parameters' && hasPermission('PARAMETRO_VIEW') && (
            <Card>
              <SectionHeader
                compact
                icon={<Settings2 size={18} />}
                eyebrow="Configuración"
                title={`Parámetros globales (${parameters.length})`}
                description="Valores de configuración que afectan a todos los módulos."
                aside={
                  canManageParameter ? (
                    <Button size="sm" onClick={() => openParameterModal()} leftIcon={<Plus size={15} />}>
                      Nuevo Parámetro
                    </Button>
                  ) : undefined
                }
              />
              <div className="data-table-wrap">
                <table className="data-table data-table--stack table--parameters">
                  <colgroup>
                    <col style={{ width: '34%' }} />
                    <col style={{ width: '16%' }} />
                    <col style={{ width: '14%' }} />
                    <col style={{ width: '12%' }} />
                    <col style={{ width: '12%' }} />
                    <col style={{ width: '12%' }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>Clave</th>
                      <th>Valor</th>
                      <th>Módulo</th>
                      <th>Tipo</th>
                      <th>Estado</th>
                      <th style={{ textAlign: 'center' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parameters.map((p) => (
                      <tr key={p.id}>
                        <td className="cell-strong">
                          <div className="parameter-key">
                            <code>{p.key}</code>
                            <small title={p.description || undefined}>{p.description || 'Sin descripción'}</small>
                          </div>
                        </td>
                        <td><span className="parameter-value">{p.value}</span></td>
                        <td><Badge variant="outline" size="sm">{humanize(p.module)}</Badge></td>
                        <td><span className="parameter-type">{VALUE_TYPE_LABELS[p.valueType] ?? humanize(p.valueType)}</span></td>
                        <td>
                          <Badge variant={p.active === false ? 'danger' : 'success'} size="sm" dot>{p.active === false ? 'Inactivo' : 'Activo'}</Badge>
                        </td>
                        <td>
                          {canManageParameter && (
                            <div className="action-group">
                              <button type="button" className="action-btn primary" title="Editar" aria-label="Editar" onClick={() => openParameterModal(p)}>
                                <Pencil size={15} />
                              </button>
                              {p.active !== false && (
                                <button type="button" className="action-btn danger" title="Desactivar" aria-label="Desactivar" onClick={() => handleDeleteParameter(p)}>
                                  <Trash2 size={15} />
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                    {parameters.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ color: 'var(--text-muted)' }}>No hay parámetros registrados.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}

      {/* Modal Sede */}
      {campusModal && (
        <Modal
          title={campusForm.id ? 'Editar Sede' : 'Registrar Sede'}
          subtitle="Identifica la sede, registra su ubicación y describe su capacidad instalada."
          icon={<MapPin size={20} />}
          maxWidth="880px"
          onClose={() => setCampusModal(false)}
        >
          <FormError message={formError} />
          <form onSubmit={handleSaveCampus} className="modal-form campus-form">
            <FormSummary
              icon={<Building2 size={18} />}
              title={campusForm.name.trim() || 'Nueva sede'}
              subtitle={campusForm.address?.trim() || 'Dirección por definir'}
              meta={[
                [campusForm.district, campusForm.city, campusForm.region]
                  .filter((value) => value?.trim())
                  .join(' · ') || 'Ubicación por definir',
                `Aforo: ${campusForm.capacity != null ? campusForm.capacity.toLocaleString('es-PE') : '—'}`,
                `Pabellones: ${campusForm.pavilions ?? '—'}`,
                `Laboratorios: ${campusForm.laboratories ?? '—'}`,
              ]}
              badge={<Badge variant="outline" size="sm">{campusTypeLabel}</Badge>}
              progress={campusProgress}
              progressLabel={`${campusProgressFields} de 5 campos clave`}
            />
            <div className="form-section">
                  <span>Identificación de la sede</span>
                  <span className={`form-section__status${campusForm.name.trim() && campusForm.code.trim() ? ' is-done' : ''}`}>
                    {campusForm.name.trim() && campusForm.code.trim()
                      ? <><Check size={12} aria-hidden="true" /> Listo</>
                      : 'Pendiente'}
                  </span>
                </div>
                <div className="institution-grid">
                  <Field className="field--span-2" label="Nombre de la sede" icon={<Building2 size={13} />} hint="Nombre visible en la oferta académica y los reportes.">
                    <input
                      style={inputStyle}
                      required
                      maxLength={150}
                      value={campusForm.name}
                      onChange={(e) => setCampusForm({ ...campusForm, name: e.target.value })}
                      placeholder="Ej. Campus Ate"
                      autoComplete="organization"
                    />
                  </Field>
                  <Field label="Código" icon={<Hash size={13} />} hint="Máximo 20 caracteres; se guarda en mayúsculas.">
                    <input
                      style={{ ...inputStyle, textTransform: 'uppercase' }}
                      required
                      maxLength={20}
                      value={campusForm.code}
                      onChange={(e) => setCampusForm({ ...campusForm, code: e.target.value.toUpperCase() })}
                      placeholder="Ej. SEDE-ATE"
                    />
                  </Field>
                  <Field label="Tipo" icon={<Layers size={13} />}>
                    <select style={inputStyle} value={campusForm.campusType} onChange={(e) => setCampusForm({ ...campusForm, campusType: e.target.value })}>
                      {CAMPUS_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </Field>
                </div>

                <div className="form-section">
                  <span>Ubicación</span>
                  <span className={`form-section__status${campusForm.city?.trim() && campusForm.address?.trim() ? ' is-done' : ''}`}>
                    {campusForm.city?.trim() && campusForm.address?.trim()
                      ? <><Check size={12} aria-hidden="true" /> Listo</>
                      : 'Opcional'}
                  </span>
                </div>
                <div className="institution-grid campus-form__grid--3">
                  <Field label="Ciudad" icon={<Building2 size={13} />}>
                    <input style={inputStyle} maxLength={100} value={campusForm.city ?? ''} onChange={(e) => setCampusForm({ ...campusForm, city: e.target.value })} placeholder="Ej. Lima" />
                  </Field>
                  <Field label="Distrito" icon={<MapPin size={13} />}>
                    <input style={inputStyle} maxLength={100} value={campusForm.district ?? ''} onChange={(e) => setCampusForm({ ...campusForm, district: e.target.value })} placeholder="Ej. Ate" />
                  </Field>
                  <Field label="Región" icon={<Map size={13} />}>
                    <input style={inputStyle} maxLength={100} value={campusForm.region ?? ''} onChange={(e) => setCampusForm({ ...campusForm, region: e.target.value })} placeholder="Ej. Lima Metropolitana" />
                  </Field>
                </div>
                <Field label="Dirección" icon={<Navigation size={13} />} hint="Incluye avenida, número y referencia si corresponde.">
                  <input style={inputStyle} maxLength={255} value={campusForm.address ?? ''} onChange={(e) => setCampusForm({ ...campusForm, address: e.target.value })} placeholder="Ej. Av. Carretera Central 1234" autoComplete="street-address" />
                </Field>

                <div className="form-section">
                  <span>Infraestructura</span>
                  <span className={`form-section__status${campusForm.capacity != null ? ' is-done' : ''}`}>
                    {campusForm.capacity != null
                      ? <><Check size={12} aria-hidden="true" /> Listo</>
                      : 'Opcional'}
                  </span>
                </div>
                <div className="institution-grid campus-form__grid--3">
                  <Field label="Aforo" icon={<Users size={13} />} hint="Capacidad total estimada.">
                    <input style={inputStyle} type="number" min={0} value={campusForm.capacity ?? ''} onChange={(e) => setCampusForm({ ...campusForm, capacity: e.target.value === '' ? undefined : Number(e.target.value) })} placeholder="Ej. 5000" />
                  </Field>
                  <Field label="Pabellones" icon={<LayoutGrid size={13} />}>
                    <input style={inputStyle} type="number" min={0} value={campusForm.pavilions ?? ''} onChange={(e) => setCampusForm({ ...campusForm, pavilions: e.target.value === '' ? undefined : Number(e.target.value) })} placeholder="Ej. 4" />
                  </Field>
                  <Field label="Laboratorios" icon={<FlaskConical size={13} />}>
                    <input style={inputStyle} type="number" min={0} value={campusForm.laboratories ?? ''} onChange={(e) => setCampusForm({ ...campusForm, laboratories: e.target.value === '' ? undefined : Number(e.target.value) })} placeholder="Ej. 12" />
                  </Field>
                </div>

            <div className="modal-form-footer">
              <span className="campus-form__note">Los cambios se reflejan en la oferta académica y la auditoría institucional.</span>
              <Button type="button" variant="secondary" onClick={() => setCampusModal(false)}>Cancelar</Button>
              <Button type="submit" isLoading={isSubmitting}>Guardar Sede</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Autoridad */}
      {authorityModal && (
        <Modal
          title={authorityForm.id ? 'Editar Autoridad' : 'Registrar Autoridad'}
          subtitle="Registra el cargo, los datos de contacto y el periodo de gestión."
          icon={<GraduationCap size={20} />}
          maxWidth="720px"
          onClose={() => setAuthorityModal(false)}
        >
          <FormError message={formError} />
          <form onSubmit={handleSaveAuthority} className="modal-form">
            <FormSummary
              icon={<GraduationCap size={18} />}
              title={`${authorityForm.firstName} ${authorityForm.lastName}`.trim() || 'Nueva autoridad'}
              subtitle={authorityForm.position?.trim() || 'Cargo por definir'}
              meta={[
                authorityForm.email?.trim() || 'Sin correo',
                authorityForm.periodStart && authorityForm.periodEnd
                  ? `${authorityForm.periodStart} → ${authorityForm.periodEnd}`
                  : 'Periodo por definir',
              ]}
              progress={Math.round(([authorityForm.position, authorityForm.firstName, authorityForm.lastName, authorityForm.email, authorityForm.periodStart].filter((value) => String(value ?? '').trim()).length / 5) * 100)}
              progressLabel="5 campos clave"
            />
            <div className="form-section">Cargo y datos personales</div>
            <Field label="Cargo" icon={<Briefcase size={13} />}>
              <input style={inputStyle} required value={authorityForm.position} onChange={(e) => setAuthorityForm({ ...authorityForm, position: e.target.value })} placeholder="Ej. Rector(a)" />
            </Field>
            <div className="institution-grid">
              <Field label="Nombres" icon={<UserRound size={13} />}>
                <input style={inputStyle} required value={authorityForm.firstName} onChange={(e) => setAuthorityForm({ ...authorityForm, firstName: e.target.value })} placeholder="Ej. María Fernanda" autoComplete="given-name" />
              </Field>
              <Field label="Apellidos" icon={<Users size={13} />}>
                <input style={inputStyle} required value={authorityForm.lastName} onChange={(e) => setAuthorityForm({ ...authorityForm, lastName: e.target.value })} placeholder="Ej. Pérez Gómez" autoComplete="family-name" />
              </Field>
            </div>
            <Field label="Grado académico" icon={<GraduationCap size={13} />}>
              <input style={inputStyle} value={authorityForm.academicDegree ?? ''} onChange={(e) => setAuthorityForm({ ...authorityForm, academicDegree: e.target.value })} placeholder="Ej. Doctora en Educación" />
            </Field>

            <div className="form-section">Contacto y nombramiento</div>
            <div className="institution-grid">
              <Field label="Correo" icon={<Mail size={13} />}>
                <input style={inputStyle} type="email" value={authorityForm.email ?? ''} onChange={(e) => setAuthorityForm({ ...authorityForm, email: e.target.value })} placeholder="Ej. rectoria@universidad.edu.pe" autoComplete="email" />
              </Field>
              <Field label="Teléfono" icon={<Phone size={13} />}>
                <input style={inputStyle} type="tel" value={authorityForm.phone ?? ''} onChange={(e) => setAuthorityForm({ ...authorityForm, phone: e.target.value })} placeholder="Ej. +51 1 456 7890" autoComplete="tel" />
              </Field>
              <Field label="Despacho" icon={<DoorOpen size={13} />}>
                <input style={inputStyle} value={authorityForm.office ?? ''} onChange={(e) => setAuthorityForm({ ...authorityForm, office: e.target.value })} placeholder="Ej. Rectorado, piso 3" />
              </Field>
            </div>
            <Field label="N° de nombramiento" icon={<FileText size={13} />} hint="Registra la resolución o documento que sustenta el cargo.">
              <input style={inputStyle} value={authorityForm.appointmentResolution ?? ''} onChange={(e) => setAuthorityForm({ ...authorityForm, appointmentResolution: e.target.value })} placeholder="Ej. Res. N° 012-2026" />
            </Field>

            <div className="form-section">Periodo de gestión</div>
            <div className="institution-grid">
              <Field label="Inicio de periodo" icon={<CalendarDays size={13} />}>
                <DatePicker style={inputStyle} ariaLabel="Inicio del periodo" value={authorityForm.periodStart ?? ''} onChange={(next) => setAuthorityForm({ ...authorityForm, periodStart: next })} />
              </Field>
              <Field label="Fin de periodo" icon={<CalendarDays size={13} />}>
                <DatePicker style={inputStyle} ariaLabel="Fin del periodo" value={authorityForm.periodEnd ?? ''} onChange={(next) => setAuthorityForm({ ...authorityForm, periodEnd: next })} />
              </Field>
            </div>
            <div className="modal-form-footer">
              <Button type="button" variant="secondary" onClick={() => setAuthorityModal(false)}>Cancelar</Button>
              <Button type="submit" isLoading={isSubmitting}>Guardar Autoridad</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Parámetro */}
      {parameterModal && (
        <Modal
          title={parameterForm.id ? 'Editar Parámetro' : 'Registrar Parámetro'}
          subtitle="Define una clave de configuración y el valor que consumirá el sistema."
          icon={<Settings2 size={20} />}
          maxWidth="720px"
          onClose={() => setParameterModal(false)}
        >
          <FormError message={formError} />
          <form onSubmit={handleSaveParameter} className="modal-form">
            <FormSummary
              icon={<Settings2 size={18} />}
              title={parameterForm.key.trim() || 'NUEVA_CLAVE'}
              subtitle={parameterForm.description?.trim() || 'Sin descripción'}
              meta={[
                `Valor: ${parameterForm.value?.trim() || '—'}`,
                VALUE_TYPE_LABELS[parameterForm.valueType] ?? parameterForm.valueType,
                parameterForm.module?.trim() || 'SIN MÓDULO',
              ]}
              progress={Math.round(([parameterForm.key, parameterForm.value, parameterForm.module, parameterForm.description].filter((value) => String(value ?? '').trim()).length / 4) * 100)}
              progressLabel="4 campos clave"
            />
            <div className="form-section">Definición del parámetro</div>
            <div className="institution-grid">
              <Field label="Clave" icon={<Key size={13} />} hint="Usa mayúsculas y guiones bajos. Ej. NOTA_MINIMA_APROBATORIA.">
                <input style={inputStyle} required value={parameterForm.key} onChange={(e) => setParameterForm({ ...parameterForm, key: e.target.value })} placeholder="Ej. NOTA_MINIMA_APROBATORIA" />
              </Field>
              <Field label="Valor" icon={<Type size={13} />}>
                <input style={inputStyle} required value={parameterForm.value} onChange={(e) => setParameterForm({ ...parameterForm, value: e.target.value })} placeholder="Ej. 11" />
              </Field>
              <Field label="Tipo de valor" icon={<List size={13} />}>
                <select style={inputStyle} value={parameterForm.valueType} onChange={(e) => setParameterForm({ ...parameterForm, valueType: e.target.value })}>
                  <option value="STRING">Texto</option>
                  <option value="NUMBER">Número</option>
                  <option value="BOOLEAN">Booleano</option>
                  <option value="DATE">Fecha</option>
                </select>
              </Field>
              <Field label="Módulo" icon={<Layers size={13} />}>
                <input style={inputStyle} required value={parameterForm.module} onChange={(e) => setParameterForm({ ...parameterForm, module: e.target.value })} placeholder="Ej. ACADEMICO" />
              </Field>
            </div>

            <div className="form-section">Documentación</div>
            <Field label="Descripción" icon={<AlignLeft size={13} />} hint="Explica qué controla el parámetro y cómo afecta al sistema.">
              <input style={inputStyle} value={parameterForm.description ?? ''} onChange={(e) => setParameterForm({ ...parameterForm, description: e.target.value })} placeholder="Ej. Nota mínima para aprobar una asignatura" />
            </Field>
            <div className="modal-form-footer">
              <Button type="button" variant="secondary" onClick={() => setParameterModal(false)}>Cancelar</Button>
              <Button type="submit" isLoading={isSubmitting}>Guardar Parámetro</Button>
            </div>
          </form>
        </Modal>
      )}
      {/* Modal Facultad */}
      {facultyModal && (
        <Modal
          title={facultyForm.id ? 'Editar Facultad' : 'Registrar Facultad'}
          subtitle="Agrupa carreras y define la adscripción académica de estudiantes y docentes."
          icon={<School size={20} />}
          maxWidth="720px"
          onClose={() => setFacultyModal(false)}
        >
          <FormError message={formError} />
          <form onSubmit={handleSaveFaculty} className="modal-form">
            <FormSummary
              icon={<School size={18} />}
              title={facultyForm.name.trim() || 'Nueva facultad'}
              subtitle={facultyForm.description?.trim() || 'Sin descripción'}
              progress={Math.round(([facultyForm.name, facultyForm.description].filter((value) => String(value ?? '').trim()).length / 2) * 100)}
              progressLabel="Nombre y descripción"
            />
            <div className="form-section">Datos de la facultad</div>
            <Field label="Nombre de la facultad" icon={<School size={13} />}>
              <input
                style={inputStyle}
                required
                maxLength={200}
                placeholder="Ej. Facultad de Ingeniería y Arquitectura"
                value={facultyForm.name}
                onChange={(e) => setFacultyForm({ ...facultyForm, name: e.target.value })}
                autoComplete="organization"
              />
            </Field>
            <Field label="Descripción" icon={<FileText size={13} />} hint="Resume las áreas académicas que agrupa esta facultad.">
              <input
                style={inputStyle}
                maxLength={255}
                placeholder="Ej. Ingeniería, arquitectura y ciencias aplicadas"
                value={facultyForm.description ?? ''}
                onChange={(e) => setFacultyForm({ ...facultyForm, description: e.target.value })}
              />
            </Field>
            <p className="field-hint">
              La facultad agrupa carreras y es la adscripción de estudiantes y docentes. No se puede
              desactivar mientras tenga carreras o personas activas asociadas.
            </p>
            <div className="modal-form-footer">
              <Button type="button" variant="secondary" onClick={() => setFacultyModal(false)}>Cancelar</Button>
              <Button type="submit" isLoading={isSubmitting}>Guardar Facultad</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Carrera */}
      {careerModal && (
        <Modal
          title={careerForm.id ? 'Editar Carrera' : 'Registrar Carrera'}
          subtitle="Define el nombre, la facultad de adscripción y el alcance de la carrera."
          icon={<BookOpen size={20} />}
          maxWidth="720px"
          onClose={() => setCareerModal(false)}
        >
          <FormError message={formError} />
          <form onSubmit={handleSaveCareer} className="modal-form">
            <FormSummary
              icon={<BookOpen size={18} />}
              title={careerForm.name.trim() || 'Nueva carrera'}
              subtitle={faculties.find((faculty) => faculty.id === careerForm.facultyId)?.name || 'Facultad por definir'}
              progress={Math.round(([careerForm.name, careerForm.facultyId, careerForm.description].filter((value) => String(value ?? '').trim() && value !== 0).length / 3) * 100)}
              progressLabel="Nombre, facultad y descripción"
            />
            <div className="form-section">Datos de la carrera</div>
            <Field label="Nombre de la carrera" icon={<BookOpen size={13} />}>
              <input
                style={inputStyle}
                required
                maxLength={200}
                placeholder="Ej. Ingeniería de Sistemas e Informática"
                value={careerForm.name}
                onChange={(e) => setCareerForm({ ...careerForm, name: e.target.value })}
              />
            </Field>
            <Field label="Facultad de adscripción" icon={<Building2 size={13} />}>
              <select
                style={inputStyle}
                required
                value={careerForm.facultyId || ''}
                onChange={(e) => setCareerForm({ ...careerForm, facultyId: Number(e.target.value) })}
              >
                <option value="" disabled>Seleccione una facultad</option>
                {faculties.filter((f) => f.active !== false).map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Descripción" icon={<FileText size={13} />} hint="Describe el perfil o alcance de la carrera.">
              <input
                style={inputStyle}
                maxLength={255}
                placeholder="Ej. Formación en desarrollo de software, redes y datos"
                value={careerForm.description ?? ''}
                onChange={(e) => setCareerForm({ ...careerForm, description: e.target.value })}
              />
            </Field>
            <p className="field-hint">
              Si cambias la facultad, los estudiantes de esta carrera se reasignan automáticamente
              para mantener la coherencia con el catálogo.
            </p>
            <div className="modal-form-footer">
              <Button type="button" variant="secondary" onClick={() => setCareerModal(false)}>Cancelar</Button>
              <Button type="submit" isLoading={isSubmitting}>Guardar Carrera</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
