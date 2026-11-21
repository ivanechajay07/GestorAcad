# Seguridad y Auditoría del Sistema

## 1. Marco de Seguridad Integral

La plataforma implementa un modelo de seguridad en profundidad (*defense in depth*) que abarca todas las capas del sistema:

### Principios Fundamentales:
1. **Contraseñas Seguras:** Nunca se almacenan contraseñas en texto plano. Se utiliza **BCrypt** con factor de costo configurable (work factor 10 o 12) y salado aleatorio por usuario.
2. **Sin Secretos en Código:** Llaves criptográficas, credenciales de base de datos y puertos se inyectan a través de variables de entorno (`.env` y `application.yml`).
3. **Autenticación Stateless (JWT):** No se maneja estado de sesión en servidor HTTP. Cada solicitud protegida viaja con un token en la cabecera `Authorization: Bearer <token>`.
4. **Control Granular RBAC:** Estructura modular de tablas:
   - `tb_usuarios`: Cuentas de acceso y estado.
   - `tb_roles`: Roles funcionales (`UNIVERSIDAD`, `DOCENTE`, `ESTUDIANTE`, `SUPERADMIN`).
   - `tb_permisos`: Permisos atómicos en formato `MODULO_ACCION` (ej. `USUARIO_VIEW`, `USUARIO_CREATE`, `ROL_VIEW`, `AUDITORIA_VIEW`, `UNIVERSIDAD_CREATE`, `CURSO_VIEW`).
   - `tb_usuario_rol`: Asociación N:M entre usuario y rol.
   - `tb_rol_permiso`: Asociación N:M entre rol y permiso atómico.
5. **Cabeceras de Seguridad:** Nginx y Spring Security aplican directivas HTTP estrictas:
   - `X-Frame-Options: SAMEORIGIN` (mitigación contra Clickjacking).
   - `X-Content-Type-Options: nosniff` (mitigación contra MIME-sniffing).
   - `X-XSS-Protection: 1; mode=block`.
   - `Referrer-Policy: strict-origin-when-cross-origin`.
6. **Manejo Estandarizado de Respuestas 401 y 403:**
   - 401 Unauthorized: Cuando el token no es provisto, expiró o es inválido.
   - 403 Forbidden: Cuando el usuario está autenticado pero su rol no posee los privilegios necesarios.

---

## 2. Subsistema de Auditoría Transaccional

El sistema audita todas las transacciones críticas del negocio para trazabilidad forense.

### Campos de Auditoría Requeridos:
- **Usuario:** Identificador y nombre de usuario que originó la petición.
- **Acción:** Operación efectuada (`LOGIN`, `LOGOUT`, `CREATE`, `UPDATE`, `DELETE`, `VIEW`, `EXPORT`, `IMPORT`).
- **Módulo:** Contexto funcional (`UNIVERSIDAD`, `USUARIOS`, `CURSOS`, `MATRICULAS`, `SEGURIDAD`, etc.).
- **Entidad:** Nombre de la entidad de dominio afectada (ej. `User`, `Role`).
- **ID Entidad:** Identificador del registro afectado cuando aplica.
- **Fecha y Hora:** Timestamp con zona horaria estandarizada UTC.
- **Dirección IP:** Dirección IP origen del cliente extraída desde `X-Forwarded-For` o conexión directa.
- **Endpoint:** URI solicitada (ej. `/api/v1/usuarios/15`).
- **Método HTTP:** `POST`, `PUT`, `DELETE`, `GET`.
- **User Agent:** Cadena del navegador/cliente que originó la petición.
- **Descripción:** Detalle técnico o identificador del recurso afectado.
- **Resultado:** `SUCCESS` o `FAILURE`. Registrado en transacción autónoma (`REQUIRES_NEW`) para no perderse ante rollbacks de negocio.

### Política de Bloqueo por Intentos Fallidos:
- Tras **5 intentos de login fallidos** consecutivos, la cuenta se bloquea automáticamente durante **15 minutos** (`cuenta_bloqueada` + `bloqueado_hasta`).
- Un inicio de sesión exitoso reinicia el contador de `intentos_fallidos`.
- Cada intento (exitoso o fallido) queda registrado en `tb_auditoria` con IP y user agent.

### Auditoría Automática en Entidades JPA:
A través de `BaseEntity` y `AuditorAwareImpl`, cada inserción o modificación en base de datos actualiza transparentemente:
- `created_at`
- `updated_at`
- `created_by`
- `updated_by`
- `deleted_at` (soporte de borrado lógico / soft delete para evitar pérdidas accidentales de datos)
