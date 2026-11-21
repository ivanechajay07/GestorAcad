import { defineConfig } from 'vitest/config';

// Configuración de las pruebas del frontend (TDD).
// Se ejecutan en jsdom para disponer de localStorage/sessionStorage reales.
export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/services/**/*.ts'],
      exclude: ['src/services/**/*.test.ts'],
    },
  },
});
