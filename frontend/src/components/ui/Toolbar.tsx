import React from 'react';

interface ToolbarProps {
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export const Toolbar: React.FC<ToolbarProps> = ({ children, actions }) => (
  <div className="toolbar">
    <div className="toolbar-group">{children}</div>
    {actions && <div className="toolbar-actions">{actions}</div>}
  </div>
);
