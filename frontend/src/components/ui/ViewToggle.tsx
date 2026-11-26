import React from 'react';
import { LayoutGrid, List } from 'lucide-react';

interface ViewToggleProps {
  value: 'cards' | 'table';
  onChange: (value: 'cards' | 'table') => void;
}

export const ViewToggle: React.FC<ViewToggleProps> = ({ value, onChange }) => (
  <div className="segmented">
    <button type="button" className={value === 'cards' ? 'active' : ''} onClick={() => onChange('cards')}>
      <LayoutGrid size={14} /> Tarjetas
    </button>
    <button type="button" className={value === 'table' ? 'active' : ''} onClick={() => onChange('table')}>
      <List size={14} /> Tabla
    </button>
  </div>
);
