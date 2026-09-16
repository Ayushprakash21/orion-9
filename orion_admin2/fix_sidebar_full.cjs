const fs = require('fs');
let sidebarStr = fs.readFileSync('src/components/layout/Sidebar.tsx', 'utf8');

sidebarStr = sidebarStr.replace(/const navItems = \[[\s\S]*?\];/, ''); // Remove existing navItems array
sidebarStr = sidebarStr.replace('import { NavLink } from \'react-router-dom\';', "import { NavLink, useLocation } from 'react-router-dom';");

const newNav = `
import { 
  LayoutDashboard, PackageSearch, ShoppingCart, Users, Truck, AlertTriangle, 
  Bot, Database, FileBarChart, Settings, Network, ArrowDownToLine, 
  ArrowUpFromLine, Lightbulb, Workflow, Activity, CheckCircle2, LineChart
} from 'lucide-react';

const menuGroups = [
  {
    title: 'COMMAND CENTER',
    items: [
      { name: 'Dashboard', path: '/', icon: LayoutDashboard }
    ]
  },
  {
    title: 'OPERATIONS',
    items: [
      { name: 'Inventory', path: '/inventory', icon: PackageSearch },
      { name: 'Inbound', path: '/inbound', icon: ArrowDownToLine },
      { name: 'Procurement', path: '/procurement', icon: ShoppingCart },
      { name: 'Suppliers', path: '/suppliers', icon: Users },
      { name: 'Shipments', path: '/shipments', icon: Truck },
      { name: 'Outbound', path: '/outbound', icon: ArrowUpFromLine }
    ]
  },
  {
    title: 'INTELLIGENCE',
    items: [
      { name: 'Exceptions', path: '/exceptions', icon: AlertTriangle },
      { name: 'Predictions', path: '/predictions', icon: Lightbulb },
      { name: 'Scenarios', path: '/scenarios', icon: Workflow },
      { name: 'AI Copilot', path: '/copilot', icon: Bot }
    ]
  },
  {
    title: 'INTEGRATION',
    items: [
      { name: 'Integration Hub', path: '/connect', icon: Network },
      { name: 'Data Center', path: '/data', icon: Database },
      { name: 'Data Quality', path: '/data-quality', icon: CheckCircle2 },
      { name: 'Sync Monitor', path: '/sync', icon: Activity }
    ]
  },
  {
    title: 'MANAGEMENT',
    items: [
      { name: 'Reports', path: '/reports', icon: FileBarChart },
      { name: 'Settings', path: '/settings', icon: Settings }
    ]
  }
];
`;

sidebarStr = sidebarStr.replace(/import \{[\s\S]*?\} from 'lucide-react';/, newNav);

const navRender = `
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          {menuGroups.map((group, idx) => (
            <div key={idx}>
              <div className="px-3 mb-2 text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">
                {group.title}
              </div>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.name}
                      to={item.path}
                      onClick={() => {
                        if (window.innerWidth < 1024) closeSidebar();
                      }}
                      className={({ isActive }) => cn(
                        "flex items-center gap-3 rounded-sm px-3 py-2 text-[11px] uppercase tracking-widest font-medium transition-all",
                        isActive 
                          ? "bg-white/10 text-cyan-400 border-l-2 border-cyan-400 shadow-[inset_2px_0_10px_rgba(6,182,212,0.2)]" 
                          : "hover:bg-white/5 hover:text-slate-200 text-slate-500 border-l-2 border-transparent"
                      )}
                    >
                      <Icon size={16} />
                      {item.name}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
`;

sidebarStr = sidebarStr.replace(/<nav className="flex-1 overflow-y-auto py-6 px-3 space-y-2">[\s\S]*?<\/nav>/, navRender);

fs.writeFileSync('src/components/layout/Sidebar.tsx', sidebarStr);
