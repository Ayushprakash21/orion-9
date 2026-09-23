import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Dashboard } from './components/Dashboard';
import { Inventory } from './components/Inventory';
import { Procurement } from './components/Procurement';
import { Suppliers } from './components/Suppliers';
import { Shipments } from './components/Shipments';
import { Exceptions } from './components/Exceptions';
import { DecisionCenter } from './components/DecisionCenter';
import { AICopilot } from './components/AICopilot';
import { DataCenter } from './components/DataCenter';
import { Integrations } from './components/Integrations';
import { Reports } from './components/Reports';
import { Settings } from './components/Settings';
import { Inbound } from './components/Inbound';
import { Outbound } from './components/Outbound';
import { Predictions } from './components/Predictions';
import { DemandForecasting } from './components/DemandForecasting';
import { InventoryOptimization } from './components/InventoryOptimization';
import { Scenarios } from './components/Scenarios';
import { SyncMonitor } from './components/SyncMonitor';
import { DataQuality } from './components/DataQuality';
import { ContractIntelligence } from './components/ContractIntelligence';
import { SupplierCommunication } from './components/SupplierCommunication';
import { LogisticsIntelligence } from './components/LogisticsIntelligence';
import { WarehouseOptimization } from './components/WarehouseOptimization';
import { Observability } from './components/Observability';
import { ActionCenter } from './components/ActionCenter';
import { Autopilot } from './components/Autopilot';
import { WorkflowBuilder } from './components/WorkflowBuilder';
import { DigitalTwin } from './components/DigitalTwin';
import { RiskRadar } from './components/RiskRadar';
import { CostOptimizer } from './components/CostOptimizer';
import { WorkingCapital } from './components/WorkingCapital';
import { OrionIntelligenceCenter } from './components/deep-intelligence/OrionIntelligenceCenter';
import { SignalLanguageView } from './components/deep-intelligence/SignalLanguageView';
import { OrionMemoryView } from './components/deep-intelligence/OrionMemoryView';
import { NetworkIntelligenceView } from './components/deep-intelligence/NetworkIntelligenceView';
import { DecisionScienceView } from './components/deep-intelligence/DecisionScienceView';
import { WorldModelView } from './components/deep-intelligence/WorldModelView';
import { AutonomyView } from './components/deep-intelligence/AutonomyView';
import { CausalIntelligenceView } from './components/deep-intelligence/CausalIntelligenceView';
import { EventFabricView } from './components/deep-intelligence/EventFabricView';
import { CounterfactualView } from './components/deep-intelligence/CounterfactualView';
import { DecisionEconomicsView } from './components/deep-intelligence/DecisionEconomicsView';
import { AttentionCenterView } from './components/deep-intelligence/AttentionCenterView';
import { InformationGapsView } from './components/deep-intelligence/InformationGapsView';
import { ConstraintsView } from './components/deep-intelligence/ConstraintsView';
import { OrionPowerOnScreen } from './os/components/OrionPowerOnScreen';
import { PoliciesView } from './components/deep-intelligence/PoliciesView';
import { OutcomesView } from './components/deep-intelligence/OutcomesView';
import { DecisionReplayView } from './components/deep-intelligence/DecisionReplayView';
import { TimeMachineView } from './components/deep-intelligence/TimeMachineView';
import { DecisionDnaView } from './components/deep-intelligence/DecisionDnaView';
import { HumanAiView } from './components/deep-intelligence/HumanAiView';
import { VitalSignsView } from './components/deep-intelligence/VitalSignsView';
import { QuietRiskView } from './components/deep-intelligence/QuietRiskView';
import { SupplyChainProvider } from './store/SupplyChainContext';
import { ToastProvider } from './store/ToastContext';
import { ConnectivityProvider } from './store/ConnectivityContext';
import { NotificationProvider } from './store/NotificationContext';
import { EntityDrawerProvider } from './store/EntityDrawerContext';
import { AuthProvider, useAuth } from './store/AuthContext';
import { BrandingProvider } from './store/BrandingContext';
import { useSupplyChain } from './store/SupplyChainContext';
import { About } from './components/About';
import { Login } from './components/auth/Login';
import { Profile } from './components/Profile';

import { AdminLayout } from './components/admin/AdminLayout';
import { AdminOverview } from './components/admin/AdminOverview';
import { AdminUsers } from './components/admin/AdminUsers';
import { AdminOrganizations } from './components/admin/AdminOrganizations';
import { AdminRoles } from './components/admin/AdminRoles';
import { AdminAuditLogs } from './components/admin/AdminAuditLogs';
import { AdminBranding } from './components/admin/AdminBranding';
import { AdminSettings } from './components/admin/AdminSettings';
import { AdminDemoData } from './components/admin/AdminDemoData';
import { PlatformIntelligence } from './components/admin/PlatformIntelligence';
import { AdminControlCenter, ControlCenterApprovals, ControlCenterSimulations, ControlCenterAudit, ControlCenterPolicies } from './components/admin/AdminControlCenter';
import { AIWorkforceCenter } from './components/admin/AIWorkforceCenter';
import { OutcomeCenter } from './components/admin/OutcomeCenter';
import { LearningCenter } from './components/admin/LearningCenter';
import { DriftCenter } from './components/admin/DriftCenter';
import { RollbackCenter } from './components/admin/RollbackCenter';
import { ProductionReadinessCenter } from './components/admin/ProductionReadinessCenter';
import { OperationsCenter } from './components/admin/OperationsCenter';
import { IncidentCenter } from './components/admin/IncidentCenter';
import { ConfigurationCenter } from './components/admin/ConfigurationCenter';
import { ReleaseCenter } from './components/admin/ReleaseCenter';
import { GlobalOperationsCenter } from './components/admin/GlobalOperationsCenter';
import { RegionalOperationsCenter } from './components/admin/RegionalOperationsCenter';
import { IntegrationControlCenter } from './components/admin/IntegrationControlCenter';
import { TradingPartnerCenter } from './components/admin/TradingPartnerCenter';
import { ReconciliationCenter } from './components/admin/ReconciliationCenter';
import { FailoverCenter } from './components/admin/FailoverCenter';
import { ResilienceCenter } from './components/ResilienceCenter';
import { SecurityRedTeamCenter } from './components/SecurityRedTeamCenter';
import { ScalePerformanceCenter } from './components/admin/ScalePerformanceCenter';
import { ManualCenter } from './components/ManualCenter';
import { LoadingScreen } from './components/LoadingScreen';
import { OrionBootSequence } from './os/components/OrionBootSequence';
import { OrionWorldEntrySequence } from './os/components/OrionWorldEntrySequence';

import { OrionDesktop } from './os/components/OrionDesktop';
import { OrionWindowManager } from './os/WindowManagerContext';
import { OrionSearchProvider } from './os/OrionSearchContext';
import { OrionContextMenuProvider } from './os/contextMenu/OrionContextMenuContext';
import { OrionLockScreen } from './os/components/OrionLockScreen';
import { OrionSleepScreen } from './os/components/OrionSleepScreen';
import { OrionShutdownScreen } from './os/components/OrionShutdownScreen';
import { OrionDisplayPreferencesProvider } from './os/DisplayPreferences';

/**
 * Main Application routes (Hosted inside Orion Desktop Window Manager)
 */
function MainApplicationRoutes() {
  return (
    <OrionWindowManager>
      <OrionSearchProvider>
        <OrionContextMenuProvider>
          <OrionDesktop />
        </OrionContextMenuProvider>
      </OrionSearchProvider>
    </OrionWindowManager>
  );
}

/**
 * Public Authentication routes (when !isAuthenticated)
 */
function UnauthenticatedApplication() {
  const location = useLocation();

  return (
    <Routes>
      <Route path="/admin-login" element={<Navigate to="/login" replace state={{ from: location }} />} />
      <Route path="/admin/login" element={<Navigate to="/login" replace state={{ from: location }} />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/admin"
        element={<Navigate to="/login" replace state={{ from: location }} />}
      />
      <Route
        path="/admin/*"
        element={<Navigate to="/login" replace state={{ from: location }} />}
      />
      <Route
        path="*"
        element={<Navigate to="/login" replace state={{ from: location }} />}
      />
    </Routes>
  );
}

/**
 * Authenticated Application Router
 */
function AuthenticatedApplication() {
  const { isAdmin } = useAuth();
  const location = useLocation();

  return (
    <Routes>
      {/* Redirect away from login pages if already authenticated */}
            {/* If already authenticated, navigating to login should send them to their dashboard */}
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/admin/login" element={<Navigate to="/admin" replace />} />
      <Route path="/admin-login" element={<Navigate to="/admin" replace />} />

      {/* Admin Application routes */}
      {isAdmin && (
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminOverview />} />
          <Route path="control-center" element={<AdminControlCenter />} />
          <Route path="control-center/domains/:domainId" element={<AdminControlCenter />} />
          <Route path="control-center/capabilities/:domainId/:capabilityId" element={<AdminControlCenter />} />
          <Route path="control-center/policies" element={<ControlCenterPolicies />} />
          <Route path="control-center/approvals" element={<ControlCenterApprovals />} />
          <Route path="control-center/simulations" element={<ControlCenterSimulations />} />
          <Route path="control-center/audit" element={<ControlCenterAudit />} />
          <Route path="ai-workforce" element={<AIWorkforceCenter />} />
          <Route path="outcomes" element={<OutcomeCenter />} />
          <Route path="learning" element={<LearningCenter />} />
          <Route path="drift" element={<DriftCenter />} />
          <Route path="rollback" element={<RollbackCenter />} />
          <Route path="readiness" element={<ProductionReadinessCenter />} />
          <Route path="operations" element={<OperationsCenter />} />
          <Route path="incidents" element={<IncidentCenter />} />
          <Route path="configurations" element={<ConfigurationCenter />} />
          <Route path="releases" element={<ReleaseCenter />} />
          <Route path="global-ops" element={<GlobalOperationsCenter />} />
          <Route path="regional-ops" element={<RegionalOperationsCenter />} />
          <Route path="integration-gateway" element={<IntegrationControlCenter />} />
          <Route path="trading-partners" element={<TradingPartnerCenter />} />
          <Route path="reconciliation" element={<ReconciliationCenter />} />
          <Route path="failover" element={<ResilienceCenter />} />
          <Route path="resilience" element={<ResilienceCenter />} />
          <Route path="security-redteam" element={<SecurityRedTeamCenter />} />
          <Route path="scale-performance" element={<ScalePerformanceCenter />} />
          <Route path="manual" element={<ManualCenter admin />} />
          <Route path="platform-intelligence" element={<PlatformIntelligence />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="organizations" element={<AdminOrganizations />} />
          <Route path="roles" element={<AdminRoles />} />
          <Route path="audit-logs" element={<AdminAuditLogs />} />
          <Route path="demo-data" element={<AdminDemoData />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="branding" element={<AdminBranding />} />
        </Route>
      )}

      {/* If non-admin attempts /admin routes, redirect to root */}
      {!isAdmin && (
        <>
          <Route path="/admin" element={<Navigate to="/" replace />} />
          <Route path="/admin/*" element={<Navigate to="/" replace />} />
        </>
      )}

      {/* User Manual: standard users have access only to the User Manual. */}
      {!isAdmin && (
        <Route path="/manual" element={<ManualCenter />} />
      )}

      {/* Main SCM Application Routes */}
      <Route path="/*" element={<MainApplicationRoutes />} />
    </Routes>
  );
}

/**
 * Root Application Bootstrap & Lifecycle:
 *
 * Architecture:
 * Root
 *  └── Startup/Application Initialization
 *        ├── LoadingScreen (Controls render tree during startup and browser refresh)
 *        └── Application
 *              ├── Login / AdminLogin (when !isAuthenticated)
 *              ├── Main App (when authenticated standard user or admin in main views)
 *              └── Admin App (when authenticated admin on /admin routes)
 */
function AppBootstrap() {
  const {
    bootState,
    currentUser,
    isFadingOut,
    isAdmin,
    postLoginDestination,
    completePostLoginInitialization,
    unlock,
    wake,
    powerOn,
    completeShutdown,
    completeSystemInitialization,
  } = useAuth();
  const navigate = useNavigate();
  const supplyChain = useSupplyChain();
  const theme = supplyChain?.settings?.theme;
  const brightness = supplyChain?.settings?.brightness ?? 100;
  const isSupplyChainInitializing = supplyChain?.isInitializing ?? false;

  // Failsafe timeout: never block UI for more than 1.8 seconds even on slow storage
  const [initTimedOut, setInitTimedOut] = React.useState(false);
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setInitTimedOut(true);
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  React.useEffect(() => {
    const prefersDark = theme === 'dark' || 
      (theme === 'system' || !theme ? window.matchMedia('(prefers-color-scheme: dark)').matches : false);
    
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(prefersDark ? 'dark' : 'light');
    document.documentElement.style.colorScheme = prefersDark ? 'dark' : 'light';
    if (document.body) {
      document.body.style.backgroundColor = prefersDark ? '#07090E' : '#F5F5F7';
    }
    
    // Brightness is 20 to 100. 100 means 0 overlay opacity, 20 means 0.8 overlay opacity.
    const opacity = (100 - brightness) / 100;
    document.documentElement.style.setProperty('--os-brightness-overlay', opacity.toString());
    
    if (supplyChain?.settings?.reducedMotion) {
      document.documentElement.classList.add('reduced-motion');
    } else {
      document.documentElement.classList.remove('reduced-motion');
    }

  }, [theme, brightness]);

  
  const renderContent = () => {
    // 1. SYSTEM HALTED / SHUT DOWN:
    if (bootState === 'SHUTTING_DOWN') {
      return (
        <OrionShutdownScreen
          onComplete={() => {
            completeShutdown();
            navigate('/', { replace: true });
          }}
        />
      );
    }
  
    // 1.5 & 1.6 POWER ON & INITIALIZATION
    if (bootState === 'POWERED_OFF') {
      return (
        <OrionPowerOnScreen
          isInitializing={false}
          onPowerOn={powerOn}
          onComplete={() => {}}
        />
      );
    }

    if (bootState === 'SYSTEM_INITIALIZING') {
      return (
        <OrionBootSequence onComplete={completeSystemInitialization} />
      );
    }
  
    // 2. SYSTEM REBOOT SEQUENCE:
    if (bootState === 'RESTARTING') {
      return (
        <div className="fixed inset-0 z-[100000] w-full h-full bg-[#03060E] flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-t-2 border-os-accent animate-spin" />
        </div>
      );
    }
  
    // 3. CORE INITIALIZATION / LAUNCHING (Initial Load):
    if (bootState === 'BOOTING' && !initTimedOut) {
      return (
        <LoadingScreen 
          isFadingOut={isFadingOut}
          message="INITIALIZING ORION-9..."
        />
      );
    }
  
    // 4. THIRD TRANSITION: authenticated session enters the Orion world
    if (bootState === 'POST_LOGIN_INITIALIZING') {
      return (
        <OrionWorldEntrySequence
          isAdmin={isAdmin}
          onComplete={() => {
            const dest = postLoginDestination || '/';
            completePostLoginInitialization();
            navigate(dest, { replace: true });
          }}
        />
      );
    }
  
    // 5. UNAUTHENTICATED / AUTHENTICATING:
    if (bootState === 'LOGIN_REQUIRED' || bootState === 'AUTHENTICATING') {
      return (
        <div className="w-full h-full min-h-screen bg-os-bg relative z-20 orion-auth-portal">
          <ErrorBoundary fallbackTitle="AUTHENTICATION PORTAL EXCEPTION">
            <UnauthenticatedApplication />
          </ErrorBoundary>
        </div>
      );
    }
  
    // 6. SUPPLY CHAIN DATA INITIALIZATION (post-login / app data load):
    if (isSupplyChainInitializing && !initTimedOut) {
      return (
        <LoadingScreen 
          isFadingOut={isFadingOut}
          message="CONNECTING SUPPLY CHAIN KERNEL..."
        />
      );
    }
  
    // 7. READY / AUTHENTICATED / LOCKED / SLEEPING:
    return (
      <div className="w-full h-full min-h-screen relative orion-authenticated-shell">
        <ErrorBoundary fallbackTitle="ORION SCM APPLICATION EXCEPTION">
          <AuthenticatedApplication />
        </ErrorBoundary>
        
        {bootState === 'LOCKED' && (
          <OrionLockScreen onUnlock={unlock} currentUser={currentUser} />
        )}
  
        {bootState === 'SLEEPING' && (
          <OrionSleepScreen onWake={wake} />
        )}
      </div>
    );
  };

  return (
    <div className="w-full h-full min-h-screen bg-os-bg relative overflow-hidden">
      <OrionDisplayPreferencesProvider />
      <div className="w-full h-full relative z-0">
        {renderContent()}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary fallbackTitle="ORION SCM SYSTEM FAULT">
      <ConnectivityProvider>
        <AuthProvider>
          <BrandingProvider>
            <SupplyChainProvider>
              <ToastProvider>
                <BrowserRouter>
                  <EntityDrawerProvider>
                    <NotificationProvider>
                      <AppBootstrap />
                    </NotificationProvider>
                  </EntityDrawerProvider>
                </BrowserRouter>
              </ToastProvider>
            </SupplyChainProvider>
          </BrandingProvider>
        </AuthProvider>
      </ConnectivityProvider>
    </ErrorBoundary>
  );
}
