import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  compact?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  compact = false,
}) => {
  return (
    <div className={`empty-state${compact ? ' empty-state--compact' : ''}`}>
      <span className="empty-state__icon" aria-hidden="true">
        {icon ?? <Inbox size={compact ? 20 : 24} />}
      </span>
      <div className="empty-state__copy">
        <strong>{title}</strong>
        {description && <p>{description}</p>}
      </div>
      {action && <div className="empty-state__action">{action}</div>}
    </div>
  );
};
