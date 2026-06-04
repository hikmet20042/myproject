import { test } from '@playwright/test'

test.describe('Vacancy Image Upload', () => {
  // SKIPPED: Requires rendering /dashboard/vacancies/create which is behind
  // auth middleware. The __mockSession pattern is not consumed by the
  // application code, and the middleware blocks unauthenticated requests
  // server-side (cannot be intercepted by page.route()). These tests need a
  // working auth testing infrastructure (e.g. test Supabase instance) to run.
  test.skip('image upload form renders for authenticated org user', () => {})
  test.skip('upload single image via file input triggers multipart POST', () => {})
  test.skip('upload multiple images via file input triggers multipart POST', () => {})
  test.skip('removing image sends DELETE request', () => {})
  test.skip('shows validation error for unsupported file type', () => {})
})
