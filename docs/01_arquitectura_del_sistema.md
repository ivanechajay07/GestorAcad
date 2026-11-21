# Arquitectura del Sistema - Gestor Académico Virtual

## 1. Visión General del Proyecto
**Gestor Académico Virtual** es una plataforma web modular universitaria diseñada bajo los más altos estándares de ingeniería de software. Su propósito fundamental es centralizar la gestión de estructuras académicas, usuarios, docentes y estudiantes, sentando las bases arquitectónicas para incorporar en fases posteriores una **Base de Conocimiento Institucional** y un motor de consultas en lenguaje natural mediante **IA / RAG**.

El desarrollo sigue una estricta estrategia **POR FASES**, garantizando que cada componente esté probado, auditado y validado antes de habilitar nuevos módulos de negocio.

---

## 2. Stack Tecnológico

| Capa | Tecnología | Versión | Rol / Responsabilidad |
| :--- | :--- | :--- | :--- |
| **Backend** | Java / Spring Boot | 3.4.3 (Java 21 LTS) | API REST, lógica de negocio, seguridad y persistencia |
| **Seguridad** | Spring Security + JJWT + BCrypt | 6.x / 0.12.6 | Autenticación stateless, cifrado y autorización RBAC |
| **Persistencia**| Spring Data JPA / Hibernate | 6.x | Mapeo objeto-relacional, transacciones y auditoría |
| **Mapeo DTO** | MapStruct | 1.6.3 | Transformación eficiente DTO <-> Entidad |
| **Documentación**| SpringDoc OpenAPI 3 / Swagger | 2.8.5 | Catálogo y prueba interactiva de endpoints REST |
| **Frontend** | React + TypeScript + Vite | React 19 / Vite 8 | Interfaz SPA responsiva, modular y estética |
| **Enrutamiento**| React Router DOM | 7.x | Navegación SPA y guardias de seguridad |
| **Cliente HTTP**| Axios | 1.20 | Cliente HTTP con interceptores de JWT y errores |
| **Estilos** | CSS Moderno (Tokens + Glassmorphism) | Vanilla CSS | Diseño responsive de alta fidelidad |
| **Base de Datos**| MySQL | 8.0+ / 8.4 LTS | Persistencia normalizada (3FN) con integridad referencial |
| **Admin BD** | phpMyAdmin | Latest | Consola gráfica web de gestión para el DBA |
| **Contenedores**| Docker & Docker Compose | Docker 29+ / Compose 5+ | Orquestación reproducible de infraestructura local |

---

## 3. Arquitectura del Backend

El backend se organiza en una **arquitectura limpia por capas desacopladas**:

```
backend/src/main/java/com/gestoracad/
├── audit/          # Soporte de auditoría JPA y tracking de eventos
├── config/         # Configuración de CORS, OpenAPI/Swagger, Seguridad, JPA
├── controller/     # Endpoints REST (Recepción, validación y respuesta HTTP)
├── dto/            # Data Transfer Objects (Peticiones, respuestas, diagnósticos)
├── entity/         # Entidades JPA de dominio (Herencia de BaseEntity auditada)
├── exception/      # Manejo global centralizado (@RestControllerAdvice)
├── mapper/         # Interfaces de mapeo MapStruct
├── repository/     # Repositorios Spring Data JPA
├── security/       # Utilidades criptográficas JWT, filtros y proveedores
└── service/        # Lógica de negocio y servicios transaccionales
    └── impl/       # Implementaciones concretas de la lógica
```

### Reglas de Diseño Backend:
1. **Separación Estricta:** Los *Controllers* no contienen lógica de negocio ni manipulan directamente la base de datos.
2. **Uso Obligatorio de DTOs:** Ninguna entidad JPA se expone directamente en las firmas de los *Controllers*.
3. **Manejo de Errores Global:** Todas las excepciones son capturadas por `GlobalExceptionHandler`, retornando esquemas RFC uniformes.
4. **Auditoría Automática:** Toda entidad hereda de `BaseEntity` para registrar `created_at`, `updated_at`, `created_by`, `updated_by`, `deleted_at` e `is_active`.

---

## 4. Arquitectura del Frontend

El cliente web React adopta una arquitectura modular basada en componentes y contenedores:

```
frontend/src/
├── assets/         # Recursos estáticos, imágenes institucionales y logos
├── components/     # Componentes reutilizables de UI (Button, Card, Badge, Header, Sidebar)
│   └── ui/         # Elementos atómicos de diseño
├── contexts/       # Gestión de estado global (AuthContext para sesión y roles)
├── hooks/          # Custom hooks reutilizables (useAuth, useHealth)
├── layouts/        # Plantillas maestras (MainLayout con Header + Sidebar dinámico)
├── pages/          # Páginas principales asociadas a rutas (Dashboard, Status, Login)
├── routes/         # Definición de rutas y guardianes de acceso (ProtectedRoute)
├── services/       # Clientes de API con Axios e interceptores de seguridad
└── utils/          # Formateadores y utilidades auxiliares
```

### Principios de Diseño Frontend:
1. **Aesthetics de Alta Gama:** Paleta de colores cuidada (azul marino institucional, índigo profundo, cian luminoso, esmeralda de estado), efectos glassmorphism y microinteracciones fluidas.
2. **Reactividad al Rol:** El Sidebar y las vistas se adaptan en tiempo real al rol activo (`UNIVERSIDAD`, `DOCENTE`, `ESTUDIANTE`).
3. **Control de Fases:** Los módulos no desarrollados se presentan con badges informativos de fase futura y acceso bloqueado.

---

## 5. Topología de Red y Contenedores (Docker)

```
       [ Usuario / Navegador Web ]
                     │
       ┌─────────────┴─────────────┐
       │ Puerto 3000               │ Puerto 8085
       ▼                           ▼
┌──────────────┐            ┌──────────────┐
│  frontend    │            │  phpmyadmin  │
│ (Nginx SPA)  │            │  (Admin BD)  │
└──────┬───────┘            └──────┬───────┘
       │ /api/ (Proxy)             │
       ▼                           │
┌──────────────┐                   │
│   backend    │                   │
│ (Spring Boot)│                   │
└──────┬───────┘                   │
       │ JDBC :3306                │
       ▼                           ▼
┌──────────────────────────────────────────┐
│                  mysql                   │
│     (MySQL 8.0 - gestoracad_db)          │
│       [Volumen: gestoracad_mysql_data]   │
└──────────────────────────────────────────┘
           Red: gestoracad_network
```
