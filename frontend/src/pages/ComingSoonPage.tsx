import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Layers, Hammer, ArrowLeft, Calendar } from 'lucide-react';

interface ComingSoonPageProps {
  title: string;
  description: string;
  phase: string;
  capabilities?: string[];
}

export const ComingSoonPage: React.FC<ComingSoonPageProps> = ({
  title,
  description,
  phase,
  capabilities = [],
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '880px', margin: '0 auto', width: '100%' }}>
      <div
        className="glass-panel glow-effect"
        style={{
          padding: 'clamp(24px, 4vw, 40px)',
          background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.35)',
          textAlign: 'center',
          position: 'relative',
        }}
      >
        <span
          style={{
            position: 'relative',
            zIndex: 1,
            display: 'inline-flex',
            width: 64,
            height: 64,
            borderRadius: 18,
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
            boxShadow: '0 10px 30px rgba(79, 70, 229, 0.45)',
            marginBottom: 16,
          }}
        >
          <Hammer size={30} color="#ffffff" />
        </span>
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
          <Badge variant="primary">
            <Calendar size={12} /> {phase}
          </Badge>
          <Badge variant="info">PRÓXIMAMENTE</Badge>
        </div>
        <h2 style={{ position: 'relative', zIndex: 1, fontSize: 'clamp(1.4rem, 3vw, 1.9rem)', fontWeight: 800, color: '#ffffff', margin: 0 }}>
          {title}
        </h2>
        <p style={{ position: 'relative', zIndex: 1, color: 'var(--hero-text-secondary)', fontSize: '0.92rem', marginTop: 10, marginBottom: 0, lineHeight: 1.55 }}>
          {description}
        </p>
      </div>

      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={18} color="var(--primary)" />
            <span>Funcionalidades planificadas</span>
          </div>
        }
        subtitle="Este módulo se habilitará en su fase correspondiente"
      >
        <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 10, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          {capabilities.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <div style={{ marginTop: 24 }}>
          <Link to="/dashboard" className="link-clean" style={{ display: 'inline-block' }}>
            <Button variant="secondary" leftIcon={<ArrowLeft size={16} />}>
              Volver al Panel
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};
