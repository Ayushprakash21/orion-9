const fs = require('fs');

let content = fs.readFileSync('src/os/components/OrionPowerOnScreen.tsx', 'utf8');

if (!content.includes("useSupplyChain")) {
  content = content.replace(
    /import \{ brandingRepository \} from '\.\.\/\.\.\/repositories\/BrandingRepository';/,
    "import { brandingRepository } from '../../repositories/BrandingRepository';\nimport { useSupplyChain } from '../../store/SupplyChainContext';\nimport { playSound } from '../audio';"
  );
}

content = content.replace(
  /export const OrionPowerOnScreen: React\.FC<OrionPowerOnScreenProps> = \(\{ isInitializing, onPowerOn, onComplete \}\) => \{/,
  "export const OrionPowerOnScreen: React.FC<OrionPowerOnScreenProps> = ({ isInitializing, onPowerOn, onComplete }) => {\n  const supplyChain = useSupplyChain();\n  const { soundEffects, masterVolume } = supplyChain?.settings || {};\n"
);

content = content.replace(
  /if \(\!isInitializing\) onPowerOn\(\);/g,
  "if (!isInitializing) { if (soundEffects) playSound('boot', masterVolume); onPowerOn(); }"
);

content = content.replace(
  /onClick=\{!isInitializing \? onPowerOn : undefined\}/g,
  "onClick={!isInitializing ? () => { if (soundEffects) playSound('boot', masterVolume); onPowerOn(); } : undefined}"
);

fs.writeFileSync('src/os/components/OrionPowerOnScreen.tsx', content);
