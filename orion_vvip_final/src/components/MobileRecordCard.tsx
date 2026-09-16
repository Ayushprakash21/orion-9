import React from 'react';

export interface MobileField {
  label: string;
  value: React.ReactNode;
  valueClassName?: string;
}

export interface MobileRecordCardProps {
  title: React.ReactNode;
  subtitle: React.ReactNode;
  statusNode?: React.ReactNode;
  fields: MobileField[];
  onClick: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
}

export const MobileRecordCard: React.FC<MobileRecordCardProps> = ({
  title,
  subtitle,
  statusNode,
  fields,
  onClick,
  onContextMenu
}) => {
  return (
    <div 
      onClick={onClick}
      onContextMenu={onContextMenu}
      className="p-4 hover:bg-os-surface-hover cursor-pointer transition-colors space-y-3 w-full box-border active:bg-os-surface-hover"
    >
      <div className="flex justify-between items-start gap-3 w-full">
        <div className="min-w-0 flex-1">
          <div className="font-mono text-os-text-primary font-medium break-words whitespace-normal leading-tight">{title}</div>
          <div className="text-[11px] text-os-text-muted break-words whitespace-normal leading-snug mt-1">{subtitle}</div>
        </div>
        {statusNode && (
          <div className="flex-shrink-0">
            {statusNode}
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-x-3 gap-y-3 text-xs pt-2 w-full">
        {fields.map((f, i) => (
          <div key={i} className="min-w-0 break-words">
            <div className="text-[10px] text-os-text-muted uppercase font-mono mb-0.5 tracking-wide">{f.label}</div>
            <div className={`font-mono break-words whitespace-normal ${f.valueClassName || 'text-os-text-primary'}`}>
              {f.value}
            </div>
          </div>
        ))}
      </div>
      
      <div className="pt-2 border-t border-os-border mt-2">
        <button className="text-[10px] text-os-text-muted uppercase font-mono tracking-wider font-medium hover:text-os-text-primary transition-colors w-full text-left">
          [ View Details ]
        </button>
      </div>
    </div>
  );
};
