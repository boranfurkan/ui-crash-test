# Retained evidence

This directory keeps a small, readable set of measured results: the historical cart investigation, matched action comparison, unchanged Vue integration, Holo Grails checks, text-fit reduction and SDK inventory. Reports describe their own recorded source versions; they are snapshots, not fresh results for every subsequent commit.

The full historical run output, exact scenes, earlier release checkpoints and process notes are preserved in the [release evidence ZIP](https://github.com/boranfurkan/ui-crash-test/releases/download/v0.3.0-rc.1/ui-crash-test-evidence.zip). Its manifest lists SHA-256 hashes. Historical paths inside the ZIP remain unchanged. The browser demo is a separate release video.

Routine new runs belong in ignored `artifacts/`. Curate a new report only when it supports a documented finding or verification claim. Keep small reproduction inputs in `fixtures/corpus/` so tests and comparisons do not depend on historical generated reports.

The self-guided human trial remains `not_started`; [its worksheet](../validation/worksheet.json) is intentionally blank. Assisted app integration is not independent adoption evidence.
