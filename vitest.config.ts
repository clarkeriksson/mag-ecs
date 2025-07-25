import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        environment: "node",
        browser: {
            enabled: true,
            name: 'chromium', // or 'firefox', 'webkit'
            provider: 'playwright', // or 'webdriverio', 'preview'
        },
    },
})