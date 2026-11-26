import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from './api';
import { universityService } from './universityService';
import type { CareerDto, FacultyDto } from './universityService';

vi.mock('./api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const faculty: FacultyDto = {
  id: 1,
  name: 'Facultad de Ingeniería y Arquitectura',
  description: 'Ingenierías',
  careerCount: 2,
  studentCount: 3,
  teacherCount: 2,
  active: true,
};

const career: CareerDto = {
  id: 10,
  name: 'Ingeniería de Sistemas e Informática',
  facultyId: 1,
  facultyName: faculty.name,
  studentCount: 1,
  active: true,
};

describe('universityService · catálogo académico', () => {
  beforeEach(() => {
    vi.mocked(api.get).mockReset();
    vi.mocked(api.post).mockReset();
    vi.mocked(api.put).mockReset();
    vi.mocked(api.delete).mockReset();
  });

  it('lista facultades con sus contadores', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { success: true, message: 'ok', data: [faculty], timestamp: '2026-10-28T16:00:00' },
    } as never);

    const response = await universityService.getFaculties();

    expect(api.get).toHaveBeenCalledWith('/v1/faculties');
    expect(response.data[0].careerCount).toBe(2);
    expect(response.data[0].name).toBe(faculty.name);
  });

  it('registra una facultad en POST /v1/faculties', async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: { success: true, message: 'ok', data: faculty, timestamp: '2026-10-28T16:00:00' },
    } as never);

    const response = await universityService.createFaculty({ name: faculty.name });

    expect(api.post).toHaveBeenCalledWith('/v1/faculties', { name: faculty.name });
    expect(response.data.id).toBe(1);
  });

  it('lista carreras y las filtra por facultad', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { success: true, message: 'ok', data: [career], timestamp: '2026-10-28T16:00:00' },
    } as never);

    const response = await universityService.getCareersByFaculty(1);

    expect(api.get).toHaveBeenCalledWith('/v1/careers/faculty/1');
    expect(response.data[0].facultyName).toBe(faculty.name);
  });

  it('actualiza una carrera y propaga el error del backend', async () => {
    vi.mocked(api.put).mockRejectedValue(new Error('La carrera ya se encuentra registrada'));

    await expect(universityService.updateCareer(10, career)).rejects.toThrow(
      'La carrera ya se encuentra registrada'
    );
    expect(api.put).toHaveBeenCalledWith('/v1/careers/10', career);
  });
});
