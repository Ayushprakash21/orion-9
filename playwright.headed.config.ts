import { defineConfig, devices } from '@playwright/test';
import baseConfig from './playwright.config';

export default defineConfig({
  ...baseConfig,
  use: {
    ...baseConfig.use,
    headless: false,
    launchOptions: {

      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--enable-webgl',
        '--disable-software-rasterizer',
        '--disable-unsafe-swiftshader',
      ],
    },
  },
});
