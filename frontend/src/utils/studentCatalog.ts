import type { CareerDto } from '../services/universityService';

/**
 * Normaliza nombres del catálogo para compararlos sin depender de mayúsculas,
 * tildes de formato ni espacios accidentales.
 */
export const normalizeCatalogName = (value?: string): string =>
  (value ?? '').trim().toLocaleLowerCase('es');

/**
 * Devuelve las carreras que pertenecen a la facultad seleccionada.
 * Sin facultad no se ofrecen carreras para evitar combinaciones incoherentes.
 */
export const careersForFaculty = (careers: CareerDto[], facultyName?: string): CareerDto[] => {
  if (!facultyName || !facultyName.trim()) {
    return [];
  }
  const target = normalizeCatalogName(facultyName);
  return careers.filter((career) => normalizeCatalogName(career.facultyName) === target);
};

/**
 * Obtiene la facultad canónica de una carrera del catálogo.
 * La relación carrera → facultad es la fuente de verdad del backend.
 */
export const facultyNameForCareer = (
  careers: CareerDto[],
  careerName?: string
): string | undefined => {
  if (!careerName || !careerName.trim()) {
    return undefined;
  }
  const target = normalizeCatalogName(careerName);
  return careers.find((career) => normalizeCatalogName(career.name) === target)?.facultyName;
};
