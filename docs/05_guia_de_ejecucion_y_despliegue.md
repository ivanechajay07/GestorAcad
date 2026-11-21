# Guía de Ejecución y Despliegue Local

## 1. Requisitos Previos
- **Docker & Docker Compose:** Docker Desktop activo (Linux containers).
- **Node.js:** Versión 20+ (Node v24 disponible en el host).
- **Java:** Versión 21 LTS (Java 26 disponible en el host).
- **Maven:** Incluido mediante Maven Wrapper (`backend/mvnw.cmd` / `backend/mvnw`).

---

## 2. Ejecución con Docker Compose (Recomendado)

El entorno completo (MySQL, phpMyAdmin, Backend Spring Boot y Frontend React) se orquesta con un único comando:

```powershell
# 1. Copiar y verificar variables de entorno
Copy-Item .env.example .env

# 2. Levantar todos los servicios en segundo plano
docker compose up -d

# 3. Verificar estado de los contenedores
docker compose ps
```

### Puertos y URLs del Sistema:
- **Frontend Web:** [http://localhost:3000](http://localhost:3000)
- **Backend REST API:** [http://localhost:8080](http://localhost:8080)
- **Documentación Swagger / OpenAPI:** [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
- **Endpoint de Diagnóstico:** [http://localhost:8080/api/v1/health](http://localhost:8080/api/v1/health)
- **Administrador phpMyAdmin:** [http://localhost:8085](http://localhost:8085)
- **Base de Datos MySQL:** `localhost:3306` (Base: `gestoracad_db`, Usuario: `gestor_user` o `root`)

---

## 3. Ejecución Local para Desarrollo Diario (Sin Contenedores Backend/Frontend)

Para depuración rápida con recarga en caliente (*hot-reload*):

### Paso A: Iniciar únicamente Base de Datos y phpMyAdmin
```powershell
docker compose up -d mysql phpmyadmin
```

### Paso B: Iniciar el Backend Spring Boot
```powershell
# En PowerShell (desde la raíz del proyecto):
$env:DB_HOST="localhost"
$env:DB_PORT="3306"
$env:DB_PASSWORD="gestor_root_pass_2026"
.\backend\mvnw.cmd spring-boot:run -f backend\pom.xml
```

### Paso C: Iniciar el Frontend React + Vite
```powershell
npm --prefix frontend run dev
# Disponible en http://localhost:5173 con proxy automático al backend en 8080
```

---

## 4. Ejecución de Pruebas Automatizadas

### Pruebas del Backend:
```powershell
.\backend\mvnw.cmd test -f backend\pom.xml
```

### Pruebas de Compilación del Frontend:
```powershell
npm --prefix frontend run build
```
