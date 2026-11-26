package com.gestoracad.service;

import com.gestoracad.entity.Carrera;
import com.gestoracad.entity.Facultad;
import com.gestoracad.repository.RepositorioCarrera;
import com.gestoracad.repository.RepositorioFacultad;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * Resuelve los nombres de facultad y carrera que envía la API contra el
 * catálogo normalizado. Si el nombre no existe se registra, conservando el
 * contrato basado en textos sin duplicar la información en el padrón.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Service
public class ServicioCatalogoAcademico {

    private final RepositorioFacultad facultyRepository;
    private final RepositorioCarrera careerRepository;

    public ServicioCatalogoAcademico(RepositorioFacultad facultyRepository,
                                     RepositorioCarrera careerRepository) {
        this.facultyRepository = facultyRepository;
        this.careerRepository = careerRepository;
    }

    @Transactional
    public Facultad resolveFaculty(String name) {
        if (!StringUtils.hasText(name)) {
            return null;
        }
        String normalized = name.trim();
        return facultyRepository.findByNameIgnoreCase(normalized)
                .orElseGet(() -> facultyRepository.save(new Facultad(normalized)));
    }

    @Transactional
    public Carrera resolveCareer(String careerName, String facultyName) {
        if (!StringUtils.hasText(careerName)) {
            return null;
        }
        String normalized = careerName.trim();
        return careerRepository.findByNameIgnoreCase(normalized)
                .orElseGet(() -> {
                    Facultad faculty = resolveFaculty(facultyName);
                    if (faculty == null) {
                        return null;
                    }
                    return careerRepository.save(new Carrera(normalized, faculty));
                });
    }
}
