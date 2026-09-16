const fs = require('fs');
let content = fs.readFileSync('src/store/ToastContext.tsx', 'utf8');

if (!content.includes('useSupplyChain')) {
  content = content.replace(
    /import React, \{ createContext, useContext, useState, useCallback, ReactNode \} from 'react';/,
    "import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';\nimport { useSupplyChain } from './SupplyChainContext';\nimport { playSound } from '../os/audio';"
  );
}

content = content.replace(
  /export const ToastProvider = \(\{ children \}: \{ children: ReactNode \}\) => \{/,
  "export const ToastProvider = ({ children }: { children: ReactNode }) => {\n  const supplyChain = useSupplyChain();\n  const { soundEffects, masterVolume } = supplyChain?.settings || {};\n"
);

content = content.replace(
  /const showToast = useCallback\(\(message: string, type: ToastType = 'success', title\?: string\) => \{/,
  "const showToast = useCallback((message: string, type: ToastType = 'success', title?: string) => {\n    if (soundEffects) {\n      if (type === 'error') playSound('error', masterVolume);\n      else if (type === 'success') playSound('success', masterVolume);\n      else playSound('notification', masterVolume);\n    }"
);

content = content.replace(/\}, \[\]\);/g, "}, [soundEffects, masterVolume]);");

fs.writeFileSync('src/store/ToastContext.tsx', content);
