// Test file for GIORGIO MORODER landing page
const { chromium } = require('playwright');
const path = require('path');

(async () => {
    console.log('Starting Playwright test for GIORGIO MORODER...\n');

    const browser = await chromium.launch({
        headless: true
    });

    const context = await browser.newContext();
    const page = await context.newPage();

    const consoleMessages = [];
    const consoleErrors = [];

    page.on('console', msg => {
        consoleMessages.push({ type: msg.type(), text: msg.text() });
        if (msg.type() === 'error') {
            consoleErrors.push(msg.text());
        }
    });

    page.on('pageerror', err => {
        consoleErrors.push(err.message);
    });

    try {
        const htmlPath = path.join(__dirname, 'index.html');
        console.log('Loading page:', htmlPath);

        await page.goto(`file://${htmlPath}`, {
            waitUntil: 'networkidle',
            timeout: 30000
        });

        console.log('Page loaded successfully!\n');

        await page.waitForTimeout(1000);

        // Check if key elements exist
        const checks = [
            { selector: '.navbar', name: 'Navigation' },
            { selector: '.hero', name: 'Hero Section' },
            { selector: '#flow', name: 'System Flow Section' },
            { selector: '#output', name: 'Oracle Output Section' },
            { selector: '#capital', name: 'Capital Engine Section' },
            { selector: '#oracle', name: 'Oracle-as-a-Service Section' },
            { selector: '#vision', name: 'Strategic Vision Section' },
            { selector: '#powered', name: 'Powered By Section' },
            { selector: '#network-canvas', name: 'Network Background Canvas' },
            { selector: '.terminal-window', name: 'Terminal Window' },
            { selector: '.oracle-flow', name: 'Oracle Flow Diagram' },
            { selector: '.usecases-grid', name: 'Use Cases Grid' },
            { selector: '.pillars-grid', name: 'Pillars Grid' },
            { selector: '#json-code', name: 'JSON Code Element' },
            { selector: '#copy-btn', name: 'Copy Button' }
        ];

        console.log('Element Check Results:');
        console.log('='.repeat(45));

        let allPassed = true;
        for (const check of checks) {
            const element = await page.$(check.selector);
            const status = element ? '✓' : '✗';
            console.log(`${status} ${check.name}`);
            if (!element) allPassed = false;
        }

        console.log('='.repeat(45));

        const title = await page.title();
        console.log('\nPage Title:', title);

        const viewport = await page.viewportSize();
        console.log('Viewport Size:', viewport.width, 'x', viewport.height);

        console.log('\nConsole Messages:');
        console.log('-'.repeat(45));
        if (consoleMessages.length === 0) {
            console.log('No console messages');
        } else {
            consoleMessages.forEach(msg => {
                console.log(`[${msg.type}] ${msg.text}`);
            });
        }

        if (consoleErrors.length > 0) {
            console.log('\n⚠ Console Errors Found:');
            console.log('-'.repeat(45));
            consoleErrors.forEach(err => console.log('ERROR:', err));
            console.log('\nTest Result: FAILED - Console errors detected');
        } else {
            console.log('\n✓ No console errors detected');
        }

        console.log('\n' + '='.repeat(45));
        if (allPassed && consoleErrors.length === 0) {
            console.log('✓ ALL TESTS PASSED - GIORGIO MORODER Landing Page Ready');
        } else {
            console.log('✗ SOME TESTS FAILED');
        }
        console.log('='.repeat(45));

    } catch (error) {
        console.error('Test failed with error:', error.message);
        process.exit(1);
    } finally {
        await browser.close();
    }
})();
