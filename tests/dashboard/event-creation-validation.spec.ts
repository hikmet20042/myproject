import { test } from '@playwright/test'

test.describe('Event Creation — Page Render', () => {
  test.skip('displays create event page with Azerbaijani heading', () => {})
  test.skip('shows progress bar sections', () => {})
  test.skip('renders certificate checkbox', () => {})
})

test.describe('Event Creation — Field Validation', () => {
  test.skip('shows error for empty title on submit', () => {})
  test.skip('shows error for short description', () => {})
  test.skip('shows error when no sessions added', () => {})
  test.skip('shows error for missing age range', () => {})
  test.skip('shows error for out-of-bounds age range', () => {})
  test.skip('shows error for missing application link', () => {})
})

test.describe('Event Creation — Conditional Location Fields', () => {
  test.skip('physical location requires address and city', () => {})
})

test.describe('Event Creation — Payload Structure', () => {
  test.skip('submits correct payload structure on create', () => {})
})

test.describe('Event Creation — Draft Save', () => {
  test.skip('shows draft save indicator after typing', () => {})
})

test.describe('Event Creation — Success Toast', () => {
  test.skip('shows success toast after creating event', () => {})
})
