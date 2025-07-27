import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        environment: "node",
        browser: {
            enabled: false,
            name: 'chromium', // or 'firefox', 'webkit'
            provider: 'playwright', // or 'webdriverio', 'preview'
        },
    },
})