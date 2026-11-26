package com.gestoracad.security;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Restricción de validación para contraseñas institucionales.
 * Exige longitud mínima, mayúscula, minúscula, número y símbolo, y rechaza
 * contraseñas de uso común.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Documented
@Constraint(validatedBy = ValidadorContrasenaSegura.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface ContrasenaSegura {

    String message() default "La contraseña debe tener entre 8 y 100 caracteres e incluir al menos una mayúscula, una minúscula, un número y un símbolo";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
