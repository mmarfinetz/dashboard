# Test Utilities

This directory contains diagnostic utilities for testing API credentials and connectivity.

## Utilities

- `facebookCredentialsDiagnostic.js`: Validates Facebook API credentials and tests basic API connectivity
- `credentialsDiagnostic.js`: Validates Google Ads API credentials and tests basic API connectivity
- `runFacebookDiagnostic.js`: Helper script to run the Facebook diagnostic utility

## Usage

These utilities are integrated into the main test runner, so you can run them using:

```bash
npm run test:facebook
npm run test:google
```

You can also run them directly:

```bash
node tests/utils/facebookCredentialsDiagnostic.js
node tests/utils/credentialsDiagnostic.js
node tests/utils/runFacebookDiagnostic.js
```