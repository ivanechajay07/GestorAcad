/**
 * Capa DAO (Data Access Object) del sistema.
 *
 * <p>En esta arquitectura el patrón DAO se implementa con Spring Data JPA:
 * cada interfaz {@code RepositorioX} es el contrato de acceso a datos de su
 * entidad, y Spring genera la implementación en tiempo de ejecución
 * (incluidas las consultas JPQL declaradas con {@code @Query}).</p>
 *
 * <p>Esta capa:</p>
 * <ul>
 *   <li>solo depende de las entidades y del framework de persistencia;</li>
 *   <li>no conoce servicios, controladores ni DTOs;</li>
 *   <li>es la única capa autorizada a consultar la base de datos.</li>
 * </ul>
 *
 * <p>Las reglas de {@code ArquitecturaCapasTest} (ArchUnit) verifican
 * automáticamente estas restricciones en cada build.</p>
 */
package com.gestoracad.repository;
