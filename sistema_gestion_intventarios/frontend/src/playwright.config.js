/** @type {import('@playwright/test').PlaywrightTestConfig} */
const config = {
    projects: [
        {
            name: 'chromium',
            use: { browserName: 'chromium' },
        },
        {
            name: 'firefox',
            use: { browserName: 'firefox' },
        },
        {
            name: 'webkit',
            use: { browserName: 'webkit' },
        },
        {
            name: 'mobile-chrome',
            use: {
                browserName: 'chromium',
                viewport: { width: 375, height: 667 }, // iPhone-like
                userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
            },
        },
    ],
    use: {
        baseURL: 'http://localhost:3000',
        headless: true,
    },
    retries: 2,
    workers: 1,
    timeout: 30000,
};
module.exports = config;