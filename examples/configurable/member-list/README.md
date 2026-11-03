# Saved UI scenario regression

Keep the configured application and fixture boundary available. This bundle contains the saved input, browser recipe and the exact replay and measurement sources, not the application.

Run `npm install`, `npx playwright install chromium`, then `npm test`. Set `UI_CRASH_BASE_URL` to point to your running app. The assertion should fail with the confirmed defect and pass after you repair the app. No repair or passing variant is assumed or generated.

The fixture is already validated when saved. Replay uses it directly, without importing or rerunning the generator. The seed and source hashes are provenance.
