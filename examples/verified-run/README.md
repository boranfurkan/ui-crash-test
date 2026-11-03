# Saved UI Crash Test regression

This bundle targets the member-list demo's /fixture route and /api/members input boundary.
It is a runnable regression for that adapter, not a standalone copy of the application.
The JSON stores the actual reduced input; replay does not regenerate it from a seed.
The measurement source is copied verbatim from the runner.

1. Keep the UI Crash Test app running with npm run dev.
2. In an extracted bundle: npm install, then npx playwright install chromium.
3. npm test tests the original broken layout and should fail until the layout is repaired.
4. UI_CRASH_LAYOUT=fixed npm test verifies the included fixed demo variant (POSIX shells).
   PowerShell: $env:UI_CRASH_LAYOUT='fixed'; npm test
5. UI_CRASH_BASE_URL can point at the same demo adapter at another loopback port.

Both layout variants are included in the demonstration. The tool does not patch source files.
Copy the fixture and assertion into an application's existing Playwright tests after adapting its data boundary and locators.
