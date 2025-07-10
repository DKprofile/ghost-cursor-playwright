import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: 'src/__test__',
  timeout: 15000,
  use: {
    headless: false,
    actionTimeout: 0
  },
  projects: [
    {
      name: 'chromium',
      use: { ...require('@playwright/test').devices['Desktop Chrome'] }
    }
  ]
})
