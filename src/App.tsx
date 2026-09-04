import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
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
import { Scenarios } from './components/Scenarios';
import { SyncMonitor } from './components/SyncMonitor';
import { DataQuality } from './components/DataQuality';
import { SupplyChainProvider } from './store/SupplyChainContext';
import { ToastProvider } from './store/ToastContext';
import { NotificationProvider } from './store/NotificationContext';
import { EntityDrawerProvider } from './store/EntityDrawerContext';
import { AuthProvider, useAuth } from './store/AuthContext';
import { About } from './components/About';
import { Login } from './components/auth/Login';
import { AdminLogin } from './components/auth/AdminLogin';
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
import { LoadingScreen } from './components/LoadingScreen';

/**
 * Main Application routes (Layout + SCM Modules)
 */
function MainApplicationRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="procurement" element={<Procurement />} />
        <Route path="suppliers" element={<Suppliers />} />
        <Route path="shipments" element={<Shipments />} />
        <Route path="exceptions" element={<Exceptions />} />
        <Route path="decisions" element={<DecisionCenter />} />
        <Route path="copilot" element={<AICopilot />} />
        <Route path="integrations" element={<Integrations />} />
        <Route path="data" element={<DataCenter />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
        <Route path="profile" element={<Profile initialTab="profile" />} />
        <Route path="organization" element={<Profile initialTab="organization" />} />
        <Route path="inbound" element={<Inbound />} />
        <Route path="outbound" element={<Outbound />} />
        <Route path="predictions" element={<Predictions />} />
        <Route path="scenarios" element={<Scenarios />} />
        <Route path="sync" element={<SyncMonitor />} />
        <Route path="data-quality" element={<DataQuality />} />
        <Route path="about" element={<About />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

/**
 * Public Authentication routes (when !isAuthenticated)
 */
function UnauthenticatedApplication() {
  const location = useLocation();

  return (
    <Routes>
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/admin/*"
        element={<Navigate to="/admin/login" replace state={{ from: location }} />}
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
      <Route
        path="/login"
        element={<Navigate to={isAdmin ? "/admin" : "/"} replace />}
      />
      <Route
        path="/admin/login"
        element={<Navigate to={isAdmin ? "/admin" : "/"} replace />}
      />

      {/* Admin Application routes */}
      {isAdmin && (
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminOverview />} />
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
        <Route path="/admin/*" element={<Navigate to="/" replace />} />
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
  const { isInitializing, isFadingOut, isAuthenticated } = useAuth();

  // 1. STARTUP INITIALIZATION:
  // LoadingScreen MUST render FIRST on full application start / browser refresh.
  // Neither AppShell, Sidebar, Header, Dashboard, nor Login exists in the DOM while isInitializing === true.
  if (isInitializing) {
    return (
      <LoadingScreen
        isFadingOut={isFadingOut}
        message="INITIALIZING SYSTEM..."
      />
    );
  }

  // 2. UNAUTHENTICATED:
  // Render Login and Admin Login exclusively
  if (!isAuthenticated) {
    return (
      <div className="w-full h-full min-h-screen bg-[#0A0A0A] animate-in fade-in duration-300">
        <UnauthenticatedApplication />
      </div>
    );
  }

  // 3. AUTHENTICATED:
  // Render Main Application or Admin Application
  return (
    <div className="w-full h-full min-h-screen bg-[#0A0A0A] animate-in fade-in duration-300">
      <AuthenticatedApplication />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
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
    </AuthProvider>
  );
}
