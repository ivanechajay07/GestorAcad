package com.gestoracad.service.impl;

import com.gestoracad.audit.AccionAuditoria;
import com.gestoracad.dto.DtoDocente;
import com.gestoracad.dto.DtoEstudiante;
import com.gestoracad.dto.DtoReporteExportacion;
import com.gestoracad.dto.DtoRespuestaUsuario;
import com.gestoracad.security.UtilidadesSeguridad;
import com.gestoracad.service.ServicioAuditoria;
import com.gestoracad.service.ServicioDocente;
import com.gestoracad.service.ServicioEstudiante;
import com.gestoracad.service.ServicioReportes;
import com.gestoracad.service.ServicioUsuario;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Genera archivos CSV compatibles con Excel para los listados institucionales.
 * Cada exportación queda registrada en la bitácora de auditoría.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Service
public class ServicioReportesImpl implements ServicioReportes {

    private static final String MODULE = "REPORTES";
    private static final String SEPARATOR = ";";
    private static final String BOM = "\uFEFF";
    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter DATE_TIME = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private final ServicioEstudiante studentService;
    private final ServicioDocente teacherService;
    private final ServicioUsuario userService;
    private final ServicioAuditoria auditService;

    public ServicioReportesImpl(ServicioEstudiante studentService,
                                ServicioDocente teacherService,
                                ServicioUsuario userService,
                                ServicioAuditoria auditService) {
        this.studentService = studentService;
        this.teacherService = teacherService;
        this.userService = userService;
        this.auditService = auditService;
    }

    @Override
    @Transactional(readOnly = true)
    public DtoReporteExportacion exportarEstudiantes(String clientIp, String userAgent) {
        List<DtoEstudiante> students = studentService.getAllStudents();
        StringBuilder csv = new StringBuilder(BOM);
        row(csv, "Código", "Estudiante", "Documento", "Correo", "Teléfono", "Carrera", "Facultad",
                "Ciclo", "Promedio", "Condición", "Matrícula", "Estado");
        for (DtoEstudiante student : students) {
            row(csv,
                    student.getCode(),
                    student.getFullName(),
                    student.getDocumentId(),
                    student.getEmail(),
                    student.getPhone(),
                    student.getCareer(),
                    student.getFaculty(),
                    student.getCurrentCycle(),
                    decimal(student.getWeightedAverage()),
                    student.getCondition(),
                    student.getEnrollmentStatus(),
                    student.isActive() ? "Activo" : "Inactivo");
        }
        audit("Exportación del padrón estudiantil (" + students.size() + " registros)",
                "/api/v1/reports/students", clientIp, userAgent, "tb_estudiantes");
        return build("estudiantes", csv);
    }

    @Override
    @Transactional(readOnly = true)
    public DtoReporteExportacion exportarDocentes(String clientIp, String userAgent) {
        List<DtoDocente> teachers = teacherService.getAllTeachers();
        StringBuilder csv = new StringBuilder(BOM);
        row(csv, "Código", "Docente", "Documento", "Correo", "Teléfono", "Categoría", "Dedicación",
                "Facultad", "Departamento", "Horas semanales", "Estado");
        for (DtoDocente teacher : teachers) {
            row(csv,
                    teacher.getCode(),
                    teacher.getFullName(),
                    teacher.getDocumentId(),
                    teacher.getEmail(),
                    teacher.getPhone(),
                    teacher.getCategory(),
                    teacher.getDedication(),
                    teacher.getFaculty(),
                    teacher.getDepartment(),
                    teacher.getWeeklyLoad(),
                    teacher.isActive() ? "Activo" : "Inactivo");
        }
        audit("Exportación del padrón docente (" + teachers.size() + " registros)",
                "/api/v1/reports/teachers", clientIp, userAgent, "tb_docentes");
        return build("docentes", csv);
    }

    @Override
    @Transactional(readOnly = true)
    public DtoReporteExportacion exportarUsuarios(String clientIp, String userAgent) {
        List<DtoRespuestaUsuario> users = userService.getAllUsers();
        StringBuilder csv = new StringBuilder(BOM);
        row(csv, "Usuario", "Nombre", "Correo", "Teléfono", "Departamento", "Roles", "Estado", "Último acceso");
        for (DtoRespuestaUsuario user : users) {
            row(csv,
                    user.getUsername(),
                    user.getFullName(),
                    user.getEmail(),
                    user.getPhone(),
                    user.getDepartment(),
                    user.getRoles() == null ? "" : String.join(", ", user.getRoles()),
                    user.isActive() ? "Activo" : "Inactivo",
                    dateTime(user.getLastSeen()));
        }
        audit("Exportación del directorio de usuarios (" + users.size() + " registros)",
                "/api/v1/reports/users", clientIp, userAgent, "tb_usuarios");
        return build("usuarios", csv);
    }

    private DtoReporteExportacion build(String prefix, StringBuilder csv) {
        String filename = prefix + "_" + LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE) + ".csv";
        return new DtoReporteExportacion(filename, csv.toString().getBytes(StandardCharsets.UTF_8));
    }

    private void audit(String description, String endpoint, String clientIp, String userAgent, String entity) {
        auditService.log(
                UtilidadesSeguridad.getCurrentUsername(),
                AccionAuditoria.EXPORT,
                MODULE,
                description,
                endpoint,
                "GET",
                clientIp,
                "SUCCESS",
                userAgent,
                entity,
                null);
    }

    private void row(StringBuilder csv, Object... values) {
        for (int index = 0; index < values.length; index++) {
            if (index > 0) {
                csv.append(SEPARATOR);
            }
            csv.append(cell(values[index]));
        }
        csv.append('\n');
    }

    private String cell(Object value) {
        String text;
        if (value == null) {
            text = "";
        } else if (value instanceof BigDecimal decimal) {
            text = decimal(decimal);
        } else if (value instanceof LocalDate date) {
            text = DATE.format(date);
        } else if (value instanceof LocalDateTime dateTime) {
            text = DATE_TIME.format(dateTime);
        } else {
            text = String.valueOf(value);
        }
        if (!text.isEmpty() && "=+-@".indexOf(text.charAt(0)) >= 0) {
            boolean phone = text.matches("\\+[0-9 ()-]+");
            boolean negativeNumber = text.matches("-[0-9.,]+");
            if (!phone && !negativeNumber) {
                text = "'" + text;
            }
        }
        if (text.contains(SEPARATOR) || text.contains("\"") || text.contains("\n") || text.contains("\r")) {
            return "\"" + text.replace("\"", "\"\"") + "\"";
        }
        return text;
    }

    private String decimal(BigDecimal value) {
        return value == null ? "" : value.stripTrailingZeros().toPlainString();
    }

    private String dateTime(LocalDateTime value) {
        return value == null ? "" : DATE_TIME.format(value);
    }
}
