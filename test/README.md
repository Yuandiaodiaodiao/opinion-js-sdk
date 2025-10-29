# Tests

TypeScript unit tests for the Opinion CLOB SDK using Vitest.

## Running Tests

```bash
# Run all tests
npm test

# Watch mode (auto-run on file changes)
npm run test:watch

# Run with coverage report
npm run test:coverage

# Run integration tests (requires .env configuration)
npm run test:integration
```

## Test Structure

- `types.test.ts` - Type definition tests to ensure API response structures match TypeScript types
- `utils.test.ts` - Utility function tests (validation, precision conversion)
- `client.test.ts` - Client initialization and configuration validation tests

## Coverage

Test coverage reports are generated in the `coverage/` directory when running `npm run test:coverage`.

## Integration Tests

Integration tests that interact with the real API are located in `examples/integration-test.js`.
These require a properly configured `.env` file with API credentials.
