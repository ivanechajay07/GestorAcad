import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div
      style={{
        minHeight: '70vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <Card style={{ maxWidth: '480px', textAlign: 'center', padding: '36px 24px' }}>
        <div style={{ display: 'inline-flex', padding: '16px', borderRadius: '50%', backgroundColor: 'var(--status-down-bg)', color: 'var(--status-down)', marginBottom: '16px' }}>
          <AlertCircle size={40} />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 8px 0' }}>
          404 - Página No Encontrada
        </h2>
        <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-secondary)', marginBottom: '24px' }}>
          El recurso o ruta solicitada no existe o pertenece a un módulo no habilitado en la Fase actual.
        </p>
        <Link to="/dashboard" style={{ textDecoration: 'none' }}>
          <Button variant="primary" leftIcon={<ArrowLeft size={16} />}>
            Volver al Panel Principal
          </Button>
        </Link>
      </Card>
    </div>
  );
};
