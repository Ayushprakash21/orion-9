/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './components/Dashboard';
import { Inventory } from './components/Inventory';
import { Procurement } from './components/Procurement';
import { Suppliers } from './components/Suppliers';
import { Shipments } from './components/Shipments';
import { Exceptions } from './components/Exceptions';
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

export default function App() {
  return (
    <SupplyChainProvider>
      <ToastProvider>
        <BrowserRouter>
          <EntityDrawerProvider>
            <NotificationProvider>
              <Routes>
                <Route path="/" element={<Layout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="inventory" element={<Inventory />} />
                  <Route path="procurement" element={<Procurement />} />
                  <Route path="suppliers" element={<Suppliers />} />
                  <Route path="shipments" element={<Shipments />} />
                  <Route path="exceptions" element={<Exceptions />} />
                  <Route path="copilot" element={<AICopilot />} />
                  <Route path="integrations" element={<Integrations />} />
                  <Route path="data" element={<DataCenter />} />
                  <Route path="reports" element={<Reports />} />
                  <Route path="settings" element={<Settings />} />

                  <Route path="inbound" element={<Inbound />} />
                  <Route path="outbound" element={<Outbound />} />
                  <Route path="predictions" element={<Predictions />} />
                  <Route path="scenarios" element={<Scenarios />} />
                  <Route path="sync" element={<SyncMonitor />} />
                  <Route path="data-quality" element={<DataQuality />} />

                </Route>
              </Routes>
            </NotificationProvider>
          </EntityDrawerProvider>
        </BrowserRouter>
      </ToastProvider>
    </SupplyChainProvider>
  );
}
