import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// Testing Library's auto-cleanup only registers itself when a global
// `afterEach` exists at import time, which requires `test.globals: true`
// in the Vitest config. This project imports test globals explicitly
// instead, so cleanup must be wired up manually here to unmount each
// rendered component between tests (otherwise DOM trees from previous
// tests in the same file remain mounted and queries like getByTestId
// match multiple elements).
afterEach(() => {
  cleanup()
})
