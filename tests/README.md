# Marketing Dashboard Tests

This directory contains test scripts and diagnostic utilities for the Marketing Insights Dashboard project.

## Running Tests

You can run the tests using the following npm scripts:

```bash
# Run interactive test menu
npm test

# Run all tests
npm run test:all

# Run specific tests
npm run test:local      # Test local API connection
npm run test:railway    # Test Railway API connection
npm run test:facebook   # Test Facebook API credentials
npm run test:google     # Test Google Ads API credentials 
npm run test:dashboard  # Run dashboard debug utilities
```

Alternatively, you can run tests directly:

```bash
node tests/run-tests.js [test-name]
```

## Test Files

- `run-tests.js`: Central script to run all testing utilities
- `testLocalConnection.js`: Tests connectivity with the local API server
- `testRailwayConnection.js`: Tests connectivity with the Railway-deployed backend
- `dashboardDebug.js`: Debugging utilities for the dashboard frontend

## Diagnostic Utilities

The `utils/` subdirectory contains specialized diagnostic tools:

- `facebookCredentialsDiagnostic.js`: Validates Facebook API credentials
- `credentialsDiagnostic.js`: Validates Google Ads API credentials
- `runFacebookDiagnostic.js`: Helper script to run the Facebook diagnostic

## Adding New Tests

To add a new test:

1. Create your test file in the `tests/` directory
2. For utility functions, place them in the `tests/utils/` directory
3. Update `run-tests.js` to include your test in the `availableTests` object
4. Add a new npm script in `package.json` if needed