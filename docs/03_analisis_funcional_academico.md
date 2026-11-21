# Análisis Funcional de Sistemas Académicos

## 1. Alcance y Dominio del Sistema
El **Gestor Académico Virtual** modela el ecosistema de educación superior universitaria. Su núcleo funcional se fundamenta en una jerarquía institucional y curricular rigurosa, orientada a la consistencia de datos y la escalabilidad.

---

## 2. Jerarquía Estructural Académica

El modelo de datos y procesos responderá a la siguiente estructura arbórea:

```
UNIVERSIDAD (Institución matriz, Rectoría)
    │
    ├── SEDE / CAMPUS (Opcional por sede física)
    │
    └── FACULTAD (Unidad académica superior, Decanato)
            │
            └── CARRERA / PROGRAMA (Plan de estudios, Dirección de Escuela)
                    │
                    └── CURSO / ASIGNATURA (Malla curricular, Créditos, Horas)
```

### Entidades Operativas Asociadas:
- **PERIODO_ACADEMICO:** Ciclo lectivo (ej. 2026-I, 2026-II) con fechas de inicio, fin y estado (Planificación, En Curso, Cerrado).
- **DOCENTE:** Profesional académico vinculado a una facultad o departamento.
- **ESTUDIANTE:** Alumno matriculado en una carrera universitaria.
- **SECCION:** Instancia concreta de un curso en un periodo específico (ej. Cálculo I - Sección A) con un docente asignado y cupos limitados.
- **MATRICULA:** Relación vinculante que inscribe a un estudiante en una sección durante un periodo académico.

---

## 3. Perfiles de Usuario y Roles Funcionales

1. **UNIVERSIDAD (Administrador Institucional):**
   - Configuración global del sistema.
   - Alta y administración de Facultades y Carreras.
   - Definición de Periodos Académicos.
   - Asignación de autoridades y gestión de cuentas de usuario.
   - Auditoría y supervisión general de la plataforma.

2. **DOCENTE:**
   - Visualización de secciones y cursos asignados.
   - Consulta de nóminas de estudiantes inscritos.
   - (Fase 8) Registro de notas, calificaciones y asistencias.
   - (Fase 9/10) Consulta a base de conocimiento y normativas institucionales.

3. **ESTUDIANTE:**
   - Consulta de avance curricular y cursos aprobados/pendientes.
   - Proceso de matrícula en secciones abiertas según periodo.
   - (Fase 8) Visualización de calificaciones, horarios y asistencia.
   - (Fase 9/10) Consultas sobre reglamentos académicos, trámites y normativas mediante IA.

---

## 4. Separación Estricta de Módulos (Gestión por Fases)

Para salvaguardar la estabilidad arquitectónica y evitar deuda técnica, queda taxativamente estipulado:
- **NO implementar en Fases 1 a 6:**
  - Notas y Actas de Evaluación.
  - Control de Asistencia diaria.
  - Generador de Horarios y cruce de aulas.
  - Exámenes virtuales o rúbricas de calificación.
  - Integración de API GPT o modelos de lenguaje.
- Estos módulos cuentan con fases dedicadas (Fase 8, 9 y 10) que se construirán una vez que la estructura académica base (Fase 7) y la seguridad de usuarios (Fase 2 y 3) estén operativas y verificadas.
