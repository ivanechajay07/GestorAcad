package com.gestoracad.architecture;

import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

/**
 * Verificación automática de la arquitectura por capas (MVC + DAO + SOLID).
 * Estas reglas se ejecutan en cada build y fallan si se rompe la separación de
 * responsabilidades o el principio de inversión de dependencias.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@AnalyzeClasses(packages = "com.gestoracad", importOptions = ImportOption.DoNotIncludeTests.class)
class ArquitecturaCapasTest {

    @ArchTest
    static final ArchRule controladores_no_acceden_a_persistencia =
            noClasses().that().resideInAPackage("..controller..")
                    .should().dependOnClassesThat()
                    .resideInAnyPackage("..repository..", "..entity..")
                    .because("en MVC el controlador solo debe comunicarse con la capa de servicio (nunca con repositorios ni entidades)");

    @ArchTest
    static final ArchRule controladores_dependen_de_interfaces_de_servicio =
            noClasses().that().resideInAPackage("..controller..")
                    .should().dependOnClassesThat().resideInAPackage("..service.impl..")
                    .because("el controlador debe depender de la abstracción del servicio (DIP), no de su implementación");

    @ArchTest
    static final ArchRule servicios_no_dependen_de_controladores =
            noClasses().that().resideInAPackage("..service..")
                    .should().dependOnClassesThat().resideInAPackage("..controller..")
                    .because("la lógica de negocio no debe conocer la capa web");

    @ArchTest
    static final ArchRule repositorios_no_dependen_de_negocio_ni_web =
            noClasses().that().resideInAPackage("..repository..")
                    .should().dependOnClassesThat().resideInAnyPackage("..service..", "..controller..")
                    .because("la capa DAO solo debe conocer entidades y el framework de persistencia");

    @ArchTest
    static final ArchRule entidades_no_dependen_de_capas_superiores =
            noClasses().that().resideInAPackage("..entity..")
                    .should().dependOnClassesThat()
                    .resideInAnyPackage("..repository..", "..service..", "..controller..")
                    .because("el modelo de dominio debe permanecer independiente de la persistencia y la web");
}
