package com.gestoracad.security;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * Validador de la política de contraseñas institucional.
 * Implementa la regla de complejidad y una lista mínima de contraseñas comunes.
 * Los valores nulos o vacíos se consideran válidos para permitir campos opcionales
 * (la obligatoriedad se declara con {@code @NotBlank} en cada DTO).
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
public class ValidadorContrasenaSegura implements ConstraintValidator<ContrasenaSegura, String> {

    private static final int LONGITUD_MINIMA = 8;
    private static final int LONGITUD_MAXIMA = 100;

    private static final Pattern MAYUSCULA = Pattern.compile(".*[A-Z].*");
    private static final Pattern MINUSCULA = Pattern.compile(".*[a-z].*");
    private static final Pattern DIGITO = Pattern.compile(".*\\d.*");
    private static final Pattern SIMBOLO = Pattern.compile(".*[^A-Za-z0-9].*");

    private static final Set<String> CONTRASENAS_COMUNES = Set.of(
            "password1!", "password123", "qwerty123!", "admin1234!", "12345678a!",
            "gestoracad2026", "universidad2026", "bienvenido1!", "cambiar123!"
    );

    @Override
    public boolean isValid(String contrasena, ConstraintValidatorContext context) {
        if (contrasena == null || contrasena.isBlank()) {
            return true;
        }
        if (contrasena.length() < LONGITUD_MINIMA || contrasena.length() > LONGITUD_MAXIMA) {
            return false;
        }
        if (!MAYUSCULA.matcher(contrasena).matches()
                || !MINUSCULA.matcher(contrasena).matches()
                || !DIGITO.matcher(contrasena).matches()
                || !SIMBOLO.matcher(contrasena).matches()) {
            return false;
        }
        return !CONTRASENAS_COMUNES.contains(contrasena.toLowerCase(Locale.ROOT));
    }
}
