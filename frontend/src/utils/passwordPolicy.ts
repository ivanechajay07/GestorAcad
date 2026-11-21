/**
 * Política de contraseñas, alineada con `ValidadorContrasenaSegura` del backend.
 * Se usa para mostrar los requisitos en vivo antes de enviar el formulario.
 */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 100;

const COMMON_PASSWORDS = new Set([
  'password1!',
  'password123',
  'qwerty123!',
  'admin1234!',
  '12345678a!',
  'gestoracad2026',
  'universidad2026',
  'bienvenido1!',
  'cambiar123!',
]);

export interface PasswordRule {
  id: string;
  label: string;
  valid: boolean;
}

export const evaluatePassword = (value: string): PasswordRule[] => {
  const normalized = value.toLowerCase();
  return [
    {
      id: 'length',
      label: `Entre ${PASSWORD_MIN_LENGTH} y ${PASSWORD_MAX_LENGTH} caracteres`,
      valid: value.length >= PASSWORD_MIN_LENGTH && value.length <= PASSWORD_MAX_LENGTH,
    },
    { id: 'uppercase', label: 'Una letra mayúscula', valid: /[A-Z]/.test(value) },
    { id: 'lowercase', label: 'Una letra minúscula', valid: /[a-z]/.test(value) },
    { id: 'digit', label: 'Un número', valid: /\d/.test(value) },
    { id: 'symbol', label: 'Un símbolo (ej. !, #, $)', valid: /[^A-Za-z0-9]/.test(value) },
    {
      id: 'common',
      label: 'Que no sea una contraseña común',
      valid: value.length > 0 && !COMMON_PASSWORDS.has(normalized),
    },
  ];
};

export const isPasswordSecure = (value: string): boolean =>
  evaluatePassword(value).every((rule) => rule.valid);
