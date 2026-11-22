import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import { tokenStorage } from '../services/tokenStorage';
import { authService } from '../services/authService';
import { getApiErrorMessage } from '../utils/apiErrors';
import { resolveLoginError } from '../utils/loginErrors';
import { Button } from '../components/ui/Button';
import {
  GraduationCap,
  Lock,
  ShieldCheck,
  ArrowRight,
  AlertTriangle,
  Eye,
  EyeOff,
  KeyRound,
  Check,
  Mail,
  Layers,
  Users,
  Sun,
  Moon,
  BookOpen,
  Award,
  Calendar,
  User,
  History,
  Database,
  Fingerprint,
  Clock,
} from 'lucide-react';

type Phase = 'idle' | 'loading' | 'success';

const CAPABILITIES = [
  {
    icon: ShieldCheck,
    title: 'Acceso por roles',
    detail: 'Cada usuario ve solo los módulos y acciones autorizados.',
  },
  {
    icon: History,
    title: 'Trazabilidad completa',
    detail: 'Las operaciones relevantes quedan en la bitácora institucional.',
  },
  {
    icon: Database,
    title: 'Datos centralizados',
    detail: 'Estudiantes, docentes y catálogo académico en un solo lugar.',
  },
  {
    icon: Fingerprint,
    title: 'Sesión protegida',
    detail: 'Tokens con rotación, bloqueo por intentos y cierre automático.',
  },
];

const capitalize = (value: string): string => (value ? value.charAt(0).toLocaleUpperCase('es') + value.slice(1) : value);

const CURRENT_YEAR = new Date().getFullYear();

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { mode, toggle } = useTheme();
  const toast = useToast();
  const navigate = useNavigate();

  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [remember, setRemember] = useState(() => tokenStorage.isPersistent());
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [forgotOpen, setForgotOpen] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoverySending, setRecoverySending] = useState(false);

  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  // Diálogo de recuperación: cierre con Escape y bloqueo del scroll de fondo
  useEffect(() => {
    if (!forgotOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setForgotOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [forgotOpen]);

  const isBusy = phase !== 'idle';
  const canSubmit = usernameOrEmail.trim().length > 0 && password.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isBusy) return;
    setError(null);
    if (!canSubmit) {
      setError('Ingresa tu usuario y contraseña para continuar.');
      return;
    }
    setPhase('loading');
    try {
      await login(usernameOrEmail.trim(), password, remember);
      setPhase('success');
      window.setTimeout(() => navigate('/dashboard', { replace: true }), 1200);
    } catch (err) {
      setError(resolveLoginError(err));
      setPhase('idle');
    }
  };

  const handleRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (recoverySending) return;
    setRecoverySending(true);
    try {
      await authService.requestPasswordReset(recoveryEmail.trim());
      setForgotOpen(false);
      setRecoveryEmail('');
      toast.info('Si el correo está registrado, el administrador enviará las instrucciones de restablecimiento.', {
        title: 'Solicitud registrada',
      });
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'No se pudo registrar la solicitud de recuperación.'));
    } finally {
      setRecoverySending(false);
    }
  };

  const updateCapsLock = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (typeof event.getModifierState === 'function') {
      setCapsLock(event.getModifierState('CapsLock'));
    }
  };

  // Mantiene el foco dentro del diálogo mientras está abierto
  const handleModalKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab') return;
    const focusables = event.currentTarget.querySelectorAll<HTMLElement>(
      'input, button, a[href], [tabindex]:not([tabindex="-1"])'
    );
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const longDate = capitalize(now.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' }));
  const time = now.toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  return (
    <div className="login-shell">
      {/* Fondo dinámico académico */}
      <div className="login-bg" aria-hidden="true">
        <span className="login-grid-overlay" />
        <span className="login-float login-float-1"><GraduationCap size={72} /></span>
        <span className="login-float login-float-2"><BookOpen size={54} /></span>
        <span className="login-float login-float-3"><Layers size={62} /></span>
        <span className="login-float login-float-4"><Award size={48} /></span>
        <span className="login-float login-float-5"><Calendar size={52} /></span>
        <span className="login-float login-float-6"><Users size={58} /></span>
      </div>

      <div className="login-orb login-orb-1" aria-hidden="true" />
      <div className="login-orb login-orb-2" aria-hidden="true" />

      <button
        type="button"
        className="login-theme-btn"
        onClick={toggle}
        aria-label={mode === 'dark' ? 'Activar tema claro' : 'Activar tema oscuro'}
        title={mode === 'dark' ? 'Tema claro' : 'Tema oscuro'}
      >
        {mode === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <div className="login-layout">
        {/* Panel de marca y propuesta de valor (sin métricas ficticias) */}
        <section className="login-showcase" aria-labelledby="login-hero-title">
          <div className="login-logo-lg">
            <GraduationCap size={30} color="#ffffff" aria-hidden="true" />
          </div>

          <span className="login-eyebrow">
            <span className="live-dot" aria-hidden="true" />
            Plataforma institucional
          </span>

          <h1 id="login-hero-title" className="login-title-lg">
            Gestión académica <span>segura y centralizada</span>
          </h1>
          <p className="login-sub-lg">
            Accede a estudiantes, docentes y catálogo académico con permisos por rol y trazabilidad de cada
            operación.
          </p>

          <ul className="login-capabilities">
            {CAPABILITIES.map(({ icon: Icon, title, detail }) => (
              <li key={title} className="login-capability">
                <span className="login-capability-icon" aria-hidden="true">
                  <Icon size={18} />
                </span>
                <div>
                  <strong>{title}</strong>
                  <span>{detail}</span>
                </div>
              </li>
            ))}
          </ul>

          <div className="login-statusbar">
            <span className="login-status-item">
              <span className="live-dot" aria-hidden="true" />
              Servicios en línea
            </span>
            <span className="login-status-divider" aria-hidden="true" />
            <span className="login-status-item">
              <Clock size={14} aria-hidden="true" />
              <span>{longDate}</span>
              <span aria-hidden="true">·</span>
              <span className="login-clock">{time}</span>
            </span>
          </div>
        </section>

        {/* Tarjeta de acceso */}
        <main className="login-center" aria-labelledby="login-title">
          <div className="login-card-center">
            <div className="login-card-head">
              <h2 id="login-title">Iniciar sesión</h2>
              <p>Usa tus credenciales institucionales para continuar.</p>
            </div>

            {error && (
              <div id="login-error" role="alert" className="login-error">
                <AlertTriangle size={16} aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            <form className="login-form-body" onSubmit={handleSubmit} aria-busy={isBusy}>
              <div className="login-field">
                <label className="field-label" htmlFor="login-username">
                  Usuario o correo institucional
                </label>
                <div className={`login-input${error ? ' has-error' : ''}`}>
                  <User size={17} className="login-input-icon" aria-hidden="true" />
                  <input
                    id="login-username"
                    name="username"
                    type="text"
                    value={usernameOrEmail}
                    onChange={(e) => {
                      setUsernameOrEmail(e.target.value);
                      if (error) setError(null);
                    }}
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                    placeholder="usuario o correo"
                    aria-invalid={!!error}
                    aria-describedby={error ? 'login-error' : undefined}
                    autoFocus
                    required
                  />
                </div>
              </div>

              <div className="login-field">
                <div className="field-label-row">
                  <label className="field-label" htmlFor="login-password">
                    Contraseña
                  </label>
                  <button
                    type="button"
                    className="login-link"
                    onClick={() => setForgotOpen(true)}
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div className={`login-input${error ? ' has-error' : ''}`}>
                  <Lock size={17} className="login-input-icon" aria-hidden="true" />
                  <input
                    id="login-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError(null);
                    }}
                    onKeyDown={updateCapsLock}
                    onKeyUp={updateCapsLock}
                    autoComplete="current-password"
                    aria-invalid={!!error}
                    aria-describedby={
                      [error ? 'login-error' : null, capsLock ? 'login-caps' : null]
                        .filter(Boolean)
                        .join(' ') || undefined
                    }
                    required
                  />
                  <button
                    type="button"
                    className="login-eye"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    aria-pressed={showPassword}
                    title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                {capsLock && (
                  <p id="login-caps" className="login-caps" role="status">
                    <AlertTriangle size={13} aria-hidden="true" />
                    Bloq Mayús está activado.
                  </p>
                )}
              </div>

              <div className="login-extras">
                <label
                  className="remember"
                  title="Guarda la sesión en este navegador. Actívalo solo en equipos de confianza."
                >
                  <input
                    type="checkbox"
                    name="remember"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  Mantener sesión en este equipo
                </label>
                <span className="secure-chip">
                  <ShieldCheck size={13} aria-hidden="true" /> Conexión segura
                </span>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="login-submit"
                isLoading={isBusy}
                rightIcon={<ArrowRight size={18} />}
              >
                Ingresar a la plataforma
              </Button>
            </form>

            <div className="login-trust">
              <span>
                <ShieldCheck size={13} aria-hidden="true" /> Tokens con renovación automática
              </span>
              <span>
                <Lock size={13} aria-hidden="true" /> Bloqueo por intentos fallidos
              </span>
            </div>
          </div>

          <div className="login-footer-lg">
            <div className="login-footer-links">
              <span>Acceso para la comunidad universitaria</span>
            </div>
            <div>© {CURRENT_YEAR} Gestor Académico Virtual</div>
          </div>
        </main>
      </div>

      {/* Diálogo de recuperación de contraseña */}
      {forgotOpen && (
        <div
          className="login-modal-backdrop"
          onClick={() => setForgotOpen(false)}
          role="presentation"
        >
          <div
            className="login-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-recovery-title"
            aria-describedby="login-recovery-desc"
            onKeyDown={handleModalKeyDown}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="login-modal-head">
              <span className="login-modal-icon" aria-hidden="true">
                <KeyRound size={20} />
              </span>
              <div>
                <h3 id="login-recovery-title">Recuperar contraseña</h3>
                <p id="login-recovery-desc">
                  Ingresa tu correo institucional. El administrador del sistema validará la solicitud y
                  enviará las instrucciones de restablecimiento.
                </p>
              </div>
            </div>
            <form className="login-modal-form" onSubmit={handleRecovery}>
              <div className="login-field">
                <label className="field-label" htmlFor="login-recovery-email">
                  Correo institucional
                </label>
                <div className="login-input">
                  <Mail size={17} className="login-input-icon" aria-hidden="true" />
                  <input
                    id="login-recovery-email"
                    name="email"
                    type="email"
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    placeholder="usuario@gestoracad.edu"
                    autoComplete="email"
                    autoCapitalize="none"
                    spellCheck={false}
                    autoFocus
                    required
                  />
                </div>
              </div>
              <div className="login-modal-actions">
                <Button type="button" variant="secondary" onClick={() => setForgotOpen(false)} disabled={recoverySending}>
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" leftIcon={<Mail size={16} />} isLoading={recoverySending}>
                  Enviar solicitud
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Overlay de inicio de sesión */}
      {isBusy && (
        <div className="login-overlay" role="status" aria-live="polite">
          <div className="login-overlay-card">
            <div className={`login-success-ring${phase === 'success' ? ' success' : ''}`}>
              <span className="ring r1" aria-hidden="true" />
              <span className="ring r2" aria-hidden="true" />
              <span className="login-success-icon">
                {phase === 'success' ? <Check size={44} /> : <GraduationCap size={34} />}
              </span>
            </div>
            <div className="login-overlay-text">
              {phase === 'success' ? '¡Acceso concedido!' : 'Iniciando sesión...'}
            </div>
            <div className="login-overlay-sub">
              {phase === 'success' ? 'Redirigiendo al panel institucional...' : 'Verificando credenciales...'}
            </div>
            <div className="login-overlay-bar">
              <span className={phase === 'success' ? 'fill' : 'loading'} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
