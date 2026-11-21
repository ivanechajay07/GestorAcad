package com.gestoracad.service;

import com.gestoracad.dto.DtoPeriodoAcademico;
import com.gestoracad.entity.ParametroSistema;
import com.gestoracad.entity.PeriodoAcademico;
import com.gestoracad.exception.ExcepcionApi;
import com.gestoracad.mapper.MapeadorPeriodoAcademico;
import com.gestoracad.repository.RepositorioParametroSistema;
import com.gestoracad.repository.RepositorioPeriodoAcademico;
import com.gestoracad.service.impl.ServicioPeriodoAcademicoImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Pruebas unitarias de las reglas de periodos académicos.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@ExtendWith(MockitoExtension.class)
class ServicioPeriodoAcademicoTest {

    @Mock
    private RepositorioPeriodoAcademico periodRepository;

    @Mock
    private RepositorioParametroSistema parameterRepository;

    @Mock
    private ServicioAuditoria auditService;

    private ServicioPeriodoAcademicoImpl periodService;

    @BeforeEach
    void setUp() {
        periodService = new ServicioPeriodoAcademicoImpl(
                periodRepository,
                parameterRepository,
                new MapeadorPeriodoAcademico(),
                auditService);
    }

    private DtoPeriodoAcademico period(String code, LocalDate start, LocalDate end) {
        DtoPeriodoAcademico dto = new DtoPeriodoAcademico();
        dto.setCode(code);
        dto.setName("Periodo " + code);
        dto.setStartDate(start);
        dto.setEndDate(end);
        return dto;
    }

    private PeriodoAcademico entity(Long id, String code, boolean current) {
        PeriodoAcademico period = new PeriodoAcademico();
        period.setId(id);
        period.setCode(code);
        period.setName("Periodo " + code);
        period.setStartDate(LocalDate.of(2026, 3, 30));
        period.setEndDate(LocalDate.of(2026, 7, 17));
        period.setActive(true);
        period.setCurrent(current);
        return period;
    }

    @Test
    @DisplayName("El primer periodo registrado se convierte en vigente y sincroniza el parámetro")
    void firstPeriodBecomesCurrentAndSyncsParameter() {
        when(periodRepository.existsByCodeIgnoreCase("2026-I")).thenReturn(false);
        when(periodRepository.findFirstByCurrentTrueAndActiveTrue()).thenReturn(Optional.empty());
        when(periodRepository.save(any(PeriodoAcademico.class))).thenAnswer(invocation -> {
            PeriodoAcademico saved = invocation.getArgument(0);
            saved.setId(1L);
            return saved;
        });
        when(parameterRepository.findByKey("PERIODO_ACADEMICO_ACTUAL")).thenReturn(Optional.empty());

        DtoPeriodoAcademico result = periodService.createPeriod(
                period("2026-I", LocalDate.of(2026, 3, 30), LocalDate.of(2026, 7, 17)),
                "127.0.0.1", "JUnit");

        assertEquals("2026-I", result.getCode());
        assertTrue(result.isCurrent());

        ArgumentCaptor<ParametroSistema> parameter = ArgumentCaptor.forClass(ParametroSistema.class);
        verify(parameterRepository).save(parameter.capture());
        assertEquals("2026-I", parameter.getValue().getValue());
    }

    @Test
    @DisplayName("Rechaza un código de periodo duplicado")
    void rejectsDuplicateCode() {
        when(periodRepository.existsByCodeIgnoreCase("2026-I")).thenReturn(true);

        ExcepcionApi error = assertThrows(ExcepcionApi.class, () -> periodService.createPeriod(
                period("2026-I", LocalDate.of(2026, 3, 30), LocalDate.of(2026, 7, 17)),
                "127.0.0.1", "JUnit"));

        assertTrue(error.getMessage().contains("ya se encuentra registrado"));
        verify(periodRepository, never()).save(any());
    }

    @Test
    @DisplayName("Rechaza fechas de fin anteriores al inicio")
    void rejectsInvalidDates() {
        ExcepcionApi error = assertThrows(ExcepcionApi.class, () -> periodService.createPeriod(
                period("2026-I", LocalDate.of(2026, 7, 17), LocalDate.of(2026, 3, 30)),
                "127.0.0.1", "JUnit"));

        assertTrue(error.getMessage().contains("fecha de fin"));
    }

    @Test
    @DisplayName("Activar un periodo limpia el vigente anterior y actualiza el parámetro global")
    void activatePeriodClearsPreviousAndSyncsParameter() {
        PeriodoAcademico target = entity(2L, "2026-II", false);
        when(periodRepository.findById(2L)).thenReturn(Optional.of(target));
        when(periodRepository.save(any(PeriodoAcademico.class))).thenAnswer(invocation -> invocation.getArgument(0));
        ParametroSistema parameter = new ParametroSistema();
        parameter.setKey("PERIODO_ACADEMICO_ACTUAL");
        parameter.setValue("2026-I");
        when(parameterRepository.findByKey("PERIODO_ACADEMICO_ACTUAL")).thenReturn(Optional.of(parameter));

        DtoPeriodoAcademico result = periodService.activatePeriod(2L, "127.0.0.1", "JUnit");

        assertTrue(result.isCurrent());
        verify(periodRepository).clearCurrent();
        assertEquals("2026-II", parameter.getValue());
    }

    @Test
    @DisplayName("No permite desactivar el periodo vigente")
    void cannotDeleteCurrentPeriod() {
        when(periodRepository.findById(1L)).thenReturn(Optional.of(entity(1L, "2026-II", true)));

        ExcepcionApi error = assertThrows(ExcepcionApi.class,
                () -> periodService.deletePeriod(1L, "127.0.0.1", "JUnit"));

        assertTrue(error.getMessage().contains("periodo vigente"));
        verify(periodRepository, never()).save(any());
        verify(auditService).log(any(), any(), eq("PERIODO"), any(), any(), eq("DELETE"), any(), eq("FAILURE"), any(), eq("tb_periodos_academicos"), eq(1L));
    }
}
