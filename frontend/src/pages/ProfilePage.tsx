import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { authService } from '../services/authService';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { PageHeader } from '../components/ui/PageHeader';
import { User, Lock, ShieldCheck, CheckCircle2, AlertTriangle, ImagePlus, KeyRound } from 'lucide-react';
import { evaluatePassword, PASSWORD_MAX_LENGTH, isPasswordSecure } from '../utils/passwordPolicy';
import { getApiErrorMessage } from '../utils/apiErrors';

export const ProfilePage: React.FC = () => {
  const { user, roles, permissions, updateUser } = useAuth();
  const toast = useToast();

  const [avatarPreview, setAvatarPreview] = useState(user?.avatar ?? '');
  const [savingAvatar, setSavingAvatar] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    if (newPassword !== confirmPassword) {
      setErrorMsg('La confirmación no coincide con la nueva contraseña.');
      return;
    }
    if (!isPasswordSecure(newPassword)) {
      setErrorMsg('La nueva contraseña no cumple la política: 8 a 100 caracteres, mayúscula, minúscula, número y símbolo.');
      return;
    }
    if (newPassword === currentPassword) {
      setErrorMsg('La nueva contraseña debe ser diferente a la actual.');
      return;
    }

    setIsSubmitting(true);
    try {
      await authService.changePassword(currentPassword, newPassword);
      setSuccessMsg('Contraseña actualizada correctamente.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setErrorMsg(getApiErrorMessage(err, 'No se pudo cambiar la contraseña.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const persistAvatar = async (avatar: string) => {
    if (!user) return;
    setSavingAvatar(true);
    try {
      const res = await authService.updateProfile({
        firstName: user.firstName || user.username,
        lastName: user.lastName || '',
        department: user.department,
        avatar,
      });
      if (res.success && res.data) {
        updateUser({
          avatar: res.data.avatar,
          firstName: res.data.firstName,
          lastName: res.data.lastName,
          fullName: res.data.fullName,
          department: res.data.department,
        });
        setAvatarPreview(res.data.avatar ?? '');
        toast.success('Foto de perfil actualizada.');
      }
    } catch {
      toast.error('No se pudo actualizar la foto de perfil.');
    } finally {
      setSavingAvatar(false);
    }
  };

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Seleccione una imagen válida.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 200;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, w, h);
        persistAvatar(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
      <PageHeader
        title="Mi Perfil"
        subtitle="Información de la cuenta autenticada y gestión de credenciales."
        icon={<User size={26} />}
        accent="var(--accent-cyan)"
        breadcrumbs={[{ label: 'Mi Perfil' }]}
        badges={<Badge variant="role">{user?.username ?? 'Sesión'}</Badge>}
      />

      {/* Datos del perfil */}
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <User size={20} color="var(--primary)" />
            <span>Datos de la Cuenta</span>
          </div>
        }
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginBottom: '18px', flexWrap: 'wrap' }}>
          {avatarPreview ? (
            <img
              src={avatarPreview}
              alt={user?.fullName}
              style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--border-light)' }}
            />
          ) : (
            <span className="icon-tile" style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--primary-glow)', color: 'var(--primary)', fontSize: '1.6rem' }}>
              {user?.firstName?.[0] || user?.username?.[0]?.toUpperCase() || 'U'}
            </span>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{user?.fullName}</span>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <label className="ghost-btn" style={{ cursor: 'pointer' }}>
                <ImagePlus size={15} /> {savingAvatar ? 'Guardando...' : 'Cambiar foto'}
                <input type="file" accept="image/*" onChange={handleAvatarFile} style={{ display: 'none' }} />
              </label>
              {avatarPreview && (
                <button type="button" className="link-action" style={{ color: 'var(--status-down)' }} onClick={() => persistAvatar('')}>
                  Quitar foto
                </button>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: '14px' }}>
          <div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 700 }}>USUARIO</div>
            <div style={{ fontSize: 'var(--text-base)', color: 'var(--text-main)', marginTop: '4px' }}>{user?.username}</div>
          </div>
          <div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 700 }}>NOMBRE COMPLETO</div>
            <div style={{ fontSize: 'var(--text-base)', color: 'var(--text-main)', marginTop: '4px' }}>{user?.fullName}</div>
          </div>
          <div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 700 }}>CORREO</div>
            <div style={{ fontSize: 'var(--text-base)', color: 'var(--text-main)', marginTop: '4px' }}>{user?.email}</div>
          </div>
          <div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 700 }}>DEPARTAMENTO</div>
            <div style={{ fontSize: 'var(--text-base)', color: 'var(--text-main)', marginTop: '4px' }}>
              {user?.department || '—'}
            </div>
          </div>
        </div>

        <div style={{ marginTop: '18px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          <div className="profile-chip">
            <ShieldCheck size={16} color="var(--primary)" />
            <span><strong>{roles.length}</strong> {roles.length === 1 ? 'rol asignado' : 'roles asignados'}</span>
          </div>
          <div className="profile-chip">
            <KeyRound size={16} color="var(--accent-cyan)" />
            <span><strong>{permissions.length}</strong> {permissions.length === 1 ? 'permiso habilitado' : 'permisos habilitados'}</span>
          </div>
          <div className="profile-chip">
            <CheckCircle2 size={16} color="var(--status-up)" />
            <span>Sesión protegida con JWT</span>
          </div>
        </div>

        <div style={{ marginTop: '18px' }}>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '6px' }}>
            ROLES ASIGNADOS
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {roles.length > 0 ? (
              roles.map((r) => (
                <Badge key={r} variant="primary" size="sm">{r}</Badge>
              ))
            ) : (
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Sin roles</span>
            )}
          </div>
        </div>
      </Card>

      {/* Cambio de contraseña */}
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Lock size={20} color="var(--accent-cyan)" />
            <span>Cambiar Contraseña</span>
          </div>
        }
        subtitle="La contraseña debe tener entre 8 y 100 caracteres y ser distinta a la actual"
      >
        {successMsg && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 12px',
              marginBottom: '16px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              color: '#6ee7b7',
              fontSize: 'var(--text-sm)',
            }}
          >
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div
            role="alert"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 12px',
              marginBottom: '16px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(244, 63, 94, 0.1)',
              border: '1px solid rgba(244, 63, 94, 0.35)',
              color: '#fda4af',
              fontSize: 'var(--text-sm)',
            }}
          >
            <AlertTriangle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label htmlFor="profile-current-password" style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              CONTRASEÑA ACTUAL
            </label>
            <input
              id="profile-current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              required
              style={{
                width: '100%',
                backgroundColor: 'var(--bg-app)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-md)',
                padding: '9px 12px',
                color: 'var(--text-main)',
                fontSize: 'var(--text-base)',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))', gap: '14px' }}>
            <div>
              <label htmlFor="profile-new-password" style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                NUEVA CONTRASEÑA
              </label>
              <input
                id="profile-new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={PASSWORD_MAX_LENGTH}
                style={{
                  width: '100%',
                  backgroundColor: 'var(--bg-app)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                  padding: '9px 12px',
                  color: 'var(--text-main)',
                  fontSize: 'var(--text-base)',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label htmlFor="profile-confirm-password" style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                CONFIRMAR NUEVA CONTRASEÑA
              </label>
              <input
                id="profile-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={PASSWORD_MAX_LENGTH}
                style={{
                  width: '100%',
                  backgroundColor: 'var(--bg-app)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                  padding: '9px 12px',
                  color: 'var(--text-main)',
                  fontSize: 'var(--text-base)',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          <ul className="password-rules" aria-label="Requisitos de la nueva contraseña">
            {evaluatePassword(newPassword).map((rule) => (
              <li key={rule.id} className={rule.valid ? 'is-valid' : ''}>
                {rule.valid
                  ? <CheckCircle2 size={12} aria-hidden="true" />
                  : <AlertTriangle size={12} aria-hidden="true" />}
                {rule.label}
              </li>
            ))}
          </ul>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Actualizar Contraseña
            </Button>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
              <ShieldCheck size={14} color="var(--status-up)" />
              Cifrada con BCrypt
            </span>
          </div>
        </form>
      </Card>
    </div>
  );
};
