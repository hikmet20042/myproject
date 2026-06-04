import { test } from '@playwright/test'

test.describe('Avatar Upload — Profile Settings', () => {
  // SKIPPED: Requires rendering /profile/settings which is behind auth
  // middleware. The __mockSession pattern is not consumed by the application
  // code, and the middleware blocks unauthenticated requests server-side
  // (cannot be intercepted by page.route()). These tests need a working auth
  // testing infrastructure (e.g. test Supabase instance) to run.
  test.skip('avatar upload form renders for authenticated user', () => {})
  test.skip('file input accepts image/* and rejects other types', () => {})
  test.skip('upload triggers POST to avatar API endpoint', () => {})
  test.skip('removing avatar sends DELETE request', () => {})
  test.skip('shows loading state during upload', () => {})
  test.skip('shows error toast on failed upload', () => {})
})
