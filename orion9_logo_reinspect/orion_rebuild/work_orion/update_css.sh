#!/bin/bash
cat >> src/index.css << 'INNER_EOF'

/* True Tone Adjustments */
:root.light.true-tone {
  --os-bg: #F5F4EE;
  --os-surface: #FCFCFA;
  --os-surface-secondary: #F7F6F2;
  --os-surface-elevated: #FCFCFA;
  --os-surface-hover: #F0EFE9;
  --os-surface-active: #E6E4DF;
  --os-border: #E6E4DF;
  --os-border-strong: #DBD8D1;
  --os-text-primary: #2C2A26;
  --os-input-bg: #FCFCFA;
}

:root.dark.true-tone {
  --os-bg: #100F0D;
  --os-surface: #181715;
  --os-surface-secondary: #1D1C19;
  --os-surface-elevated: #1D1C19;
  --os-surface-hover: #24231E;
  --os-surface-active: #302E28;
  --os-border: #2D2C28;
  --os-border-strong: #45423C;
  --os-text-primary: #EBE9E2;
  --os-input-bg: #181715;
}

/* Brightness Overlay */
body::after {
  content: "";
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: black;
  opacity: var(--os-brightness-overlay, 0);
  pointer-events: none;
  z-index: 9999999;
}
INNER_EOF
chmod +x update_css.sh
./update_css.sh
