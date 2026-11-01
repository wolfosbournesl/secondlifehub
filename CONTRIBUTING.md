# Contributing to Second Life Hub

Thank you for helping build a useful, transparent and respectful open-source tool for the Second Life community.

## Before opening a pull request

1. Explain the problem and the user-facing change.
2. Prefer public, documented and read-only sources.
3. Do not commit API keys, cookies, credentials or private resident data.
4. Document source URL, update time, rate limits and fallback behavior for new integrations.
5. Keep online status, abandonment and crowd claims appropriately qualified.
6. Run the local validation commands:

```bash
bash scripts/build.sh
node scripts/validate-artifact.mjs
```

## Pull requests

Small, focused pull requests are easier to review. Include screenshots for visual changes and describe how you tested the relevant public-source or fallback state.

## Code of conduct

Be constructive, respect resident privacy and follow the terms of the services that provide data to the Hub.
