import React from 'react';

export const PageHeader = ({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-medium text-os-text-primary tracking-tight uppercase">{title}</h2>
        {description && (
          <p className="text-xs text-os-text-muted mt-1 max-w-2xl">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {actions}
        </div>
      )}
    </div>
  );
};
