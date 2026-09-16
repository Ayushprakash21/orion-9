const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/components/drawers/ActionDetailContent.tsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace("import React, { useState } from 'react';", "import React, { useState } from 'react';\nimport { useEntityDrawer } from '../../store/EntityDrawerContext';");
content = content.replace("import { formatCurrency } from '../../lib/utils';", "import { formatCurrency } from '../../lib/formatters';");

const newContent = `
export const ActionDetailContent: React.FC<{ id: string }> = ({ id }) => {
  const { actions, executeAction, cancelAction } = useSupplyChain();
  const { closeDrawer } = useEntityDrawer();
  
  const action = actions.find(a => a.id === id);
  if (!action) return <div className="text-red-500">Action not found</div>;

  return (
    <div className="space-y-6">
      <div className="bg-[#151515] border border-[#2A2A2A] p-5 rounded-xl space-y-4">
        <div>
          <div className="text-[10px] font-mono text-[#777777] uppercase tracking-wider">Automated / Manual Control Action</div>
          <h2 className="text-xl font-medium text-[#F5F5F5] mt-0.5">Action ID: {id}</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#111111] p-3 rounded-lg border border-[#2A2A2A]">
            <div className="text-[10px] uppercase font-mono text-[#777777] mb-1">Approval Status</div>
            <div className="text-base font-mono text-[#30D158]">{action.status}</div>
          </div>
          <div className="bg-[#111111] p-3 rounded-lg border border-[#2A2A2A]">
            <div className="text-[10px] uppercase font-mono text-[#777777] mb-1">Priority</div>
            <div className="text-base font-mono text-[#FF453A]">{action.priority}</div>
          </div>
        </div>
        <div className="bg-[#111111] p-4 rounded-lg border border-[#2A2A2A] space-y-2">
          <div className="text-[10px] font-mono text-[#777777] uppercase tracking-wider">Business Impact & Recommendation</div>
          <p className="text-xs text-[#B3B3B3]">{action.recommendation}</p>
        </div>
        <div className="flex gap-2">
          <button 
            disabled={action.status === 'EXECUTED' || action.status === 'CANCELLED'}
            onClick={() => { executeAction(id); closeDrawer(); }} 
            className="px-4 py-2 bg-[#1B1B1B] border border-[#2A2A2A] text-[#30D158] rounded-lg text-xs font-mono uppercase tracking-wider hover:bg-[#202020] disabled:opacity-50">
            Approve & Execute
          </button>
          <button 
            disabled={action.status === 'EXECUTED' || action.status === 'CANCELLED'}
            onClick={() => { cancelAction(id); closeDrawer(); }} 
            className="px-4 py-2 bg-[#1B1B1B] border border-[#2A2A2A] text-[#FF453A] rounded-lg text-xs font-mono uppercase tracking-wider hover:bg-[#202020] disabled:opacity-50">
            Cancel Action
          </button>
        </div>
      </div>
    </div>
  );
};
`;

content = content.replace(/export const ActionDetailContent: React\.FC<\{ id: string \}> = \(\{ id \}\) => \{[\s\S]*\};/, newContent);

fs.writeFileSync(file, content);
console.log("ActionDetailContent updated");
