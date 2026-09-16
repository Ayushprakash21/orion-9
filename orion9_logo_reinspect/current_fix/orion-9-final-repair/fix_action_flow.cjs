const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/components/drawers/ActionDetailContent.tsx');
let content = fs.readFileSync(file, 'utf8');

const regex = /<button \n            disabled=\{action\.status === 'EXECUTED' \|\| action\.status === 'CANCELLED'\}\n            onClick=\{\(\) => \{ executeAction\(id\); closeEntity\(\); \}\} \n            className="px-4 py-2 bg-\[#1B1B1B\] border border-\[#2A2A2A\] text-\[#30D158\] rounded-lg text-xs font-mono uppercase tracking-wider hover:bg-\[#202020\] disabled:opacity-50">\n            Approve & Execute\n          <\/button>/m;

const replacement = `
          {action.status === 'PROPOSED' || action.status === 'AWAITING_APPROVAL' ? (
            <button 
              onClick={() => { approveAction(id); closeEntity(); }} 
              className="px-4 py-2 bg-[#1B1B1B] border border-[#2A2A2A] text-[#FF9F0A] rounded-lg text-xs font-mono uppercase tracking-wider hover:bg-[#202020] disabled:opacity-50">
              Approve Action
            </button>
          ) : action.status === 'APPROVED' ? (
            <button 
              onClick={() => { executeAction(id); closeEntity(); }} 
              className="px-4 py-2 bg-[#1B1B1B] border border-[#2A2A2A] text-[#30D158] rounded-lg text-xs font-mono uppercase tracking-wider hover:bg-[#202020] disabled:opacity-50">
              Execute Action
            </button>
          ) : (
            <button 
              disabled={true}
              className="px-4 py-2 bg-[#1B1B1B] border border-[#2A2A2A] text-[#30D158] rounded-lg text-xs font-mono uppercase tracking-wider disabled:opacity-50">
              Approve & Execute
            </button>
          )}
`;

content = content.replace(regex, replacement);
content = content.replace("const { actions, executeAction, cancelAction } = useSupplyChain() as any;", "const { actions, approveAction, executeAction, cancelAction } = useSupplyChain() as any;");

fs.writeFileSync(file, content);
console.log("ActionDetailContent updated");
