# Supabase Auth Integration Status

This document tracks the current state of Supabase integration for authentication email flows.

## Current Status: ✅ FULLY INTEGRATED

All authentication email flows are already using Supabase's built-in email service.

---

## 1. Forgot Password Flow ✅

**Implementation:** `/app/api/auth/forgot-password/route.ts`

**How it works:**
1. User submits email on `/auth/forgot-password`
2. API calls `supabase.auth.resetPasswordForEmail(email, { redirectTo })`
3. **Supabase sends the reset email** using the "Reset Password" template
4. User clicks link → redirected to `/auth/callback` → `/auth/reset-password`
5. User enters new password → `supabase.auth.updateUser({ password })`

**Supabase Method:** `resetPasswordForEmail()`
**Email Template Used:** `Reset Password`
**Rate Limiting:** 5 requests per 15 minutes (IP-based)

**Code:**
```typescript
await supabase.auth.resetPasswordForEmail(normalizedEmail, {
  redirectTo: `${appUrl}/auth/reset-password`,
})
```

---

## 2. Signup Confirmation Flow ✅

**Implementation:** `/app/api/auth/register/route.ts`

**How it works:**
1. User registers on `/auth/register`
2. API calls `supabase.auth.signUp({ email, password, options })`
3. **Supabase sends confirmation email** using "Confirm Signup" template
4. User clicks link → redirected to `/auth/callback`
5. Callback verifies OTP → creates accounts/users records → redirects to onboarding or verify-email page

**Supabase Method:** `signUp()`
**Email Template Used:** `Confirm Signup`
**Redirect URL:** `${appUrl}/auth/callback?next=/auth/verify-email?verified=1`

**Code:**
```typescript
const { data: signUpData, error } = await supabase.auth.signUp({
  email: normalizedEmail,
  password,
  options: {
    emailRedirectTo,
  },
})
```

**Note:** Email confirmation must be enabled in Supabase Dashboard:
- Go to **Authentication** → **Settings**
- Enable **Enable email confirmations**

---

## 3. Email Change Flow ✅

**Implementation:** `/app/api/auth/change-email/route.ts`

**How it works:**
1. User requests email change on `/profile/settings`
2. API verifies current password (if not Google-only)
3. API calls `supabase.auth.updateUser({ email: newEmail }, { emailRedirectTo })`
4. **Supabase sends confirmation email** to the NEW email address
5. User clicks link → redirected to `/auth/callback` → `/profile/settings?emailChange=confirmed`
6. Email is updated in Supabase auth system

**Supabase Method:** `updateUser({ email })`
**Email Template Used:** `Change Email`
**Rate Limiting:** 5 requests per 15 minutes (IP + User-based)

**Code:**
```typescript
const { error } = await supabase.auth.updateUser(
  { email: newEmail },
  { emailRedirectTo },
)
```

**Note:** For secure email change, enable in Supabase Dashboard:
- Go to **Authentication** → **Settings**
- Enable **Secure email change** (requires confirmation)

---

## 4. Verification Resend Flow ✅

**Implementation:** `/app/api/auth/verify-request/route.ts`

**How it works:**
1. User clicks "Resend verification email" on `/profile` or `/auth/verify-email`
2. API calls `supabase.auth.resend({ type: 'signup', email })`
3. **Supabase resends confirmation email** using "Confirm Signup" template
4. User clicks link → verified

**Supabase Method:** `resend({ type: 'signup' })`
**Email Template Used:** `Confirm Signup`
**Rate Limiting:** 5 requests per 15 minutes (IP-based)

**Code:**
```typescript
const { error } = await supabase.auth.resend({
  type: 'signup',
  email: targetEmail,
  options: {
    emailRedirectTo: `${appUrl}/auth/callback?next=${encodeURIComponent('/auth/verify-email?verified=1')}`,
  },
})
```

---

## Profile Page Integration ✅

**Implementation:** `/app/profile/page.tsx` and `/app/profile/settings/page.tsx`

### Profile Overview Page
- ✅ Shows user email, name, avatar from session
- ✅ Shows email verification status
- ✅ Displays warning banner for unverified emails
- ✅ Provides "Resend verification email" button
- ✅ Loads profile stats from `/api/users/profile/stats`
- ✅ Shows profile completion percentage

### Profile Settings Page
- ✅ Email change modal with policy checking
- ✅ Password change modal
- ✅ Account deletion modal with confirmation
- ✅ Google OAuth re-authentication support
- ✅ Profile editing (name, bio, location, etc.)
- ✅ Social media links management
- ✅ Avatar upload/remove

### Session Management
- ✅ Uses `useSession()` hook from `/lib/auth/client`
- ✅ Session managed by `AuthProvider.tsx`
- ✅ Auto-refreshes every 60 seconds
- ✅ Listens to auth state changes
- ✅ Handles post-login redirects

---

## Auth Callback Handler ✅

**Implementation:** `/app/auth/callback/route.ts`

**Handles:**
- ✅ OAuth code exchange (Google)
- ✅ Signup confirmation (`type=signup`)
- ✅ Password recovery (`type=recovery`)
- ✅ Email change confirmation (`type=email_change`)
- ✅ Magic link login
- ✅ Invite acceptance

**Flow:**
1. User clicks email link → `/auth/callback?token_hash=...&type=...`
2. Supabase verifies OTP token
3. Creates/updates `accounts` and `users` tables
4. Redirects to safe next URL
5. Middleware enforces auth requirements

---

## Environment Variables Required

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Development
# NEXT_PUBLIC_APP_URL=https://icma360.org  # Production
```

---

## Supabase Dashboard Configuration

### Required Settings

1. **Site URL**
   - Location: Authentication → URL Configuration
   - Development: `http://localhost:3000`
   - Production: `https://icma360.org`

2. **Redirect URLs** (whitelist)
   - `http://localhost:3000/auth/callback`
   - `https://icma360.org/auth/callback`
   - Add any other environments

3. **Email Confirmations**
   - Location: Authentication → Settings
   - Enable: **Enable email confirmations**
   - Enable: **Secure email change** (recommended)

4. **Email Provider**
   - Location: Authentication → Email Templates → Email Provider Settings
   - Configure Brevo SMTP or use Supabase's default provider
   - Set from email: `noreply@icma360.org`

---

## Database Tables

The following tables are managed by your app (not Supabase auth):

### `accounts` table
```sql
- id (uuid, PK) - matches auth.users.id
- account_type (text, nullable) - 'user' or 'organization'
- is_admin (boolean)
- is_active (boolean)
```

### `users` table
```sql
- id (uuid, PK) - matches auth.users.id
- name (text)
- email (text)
- role (text)
- auth_provider (text) - 'email' or 'google'
```

### `user_profiles` table
```sql
- id (uuid, PK)
- user_id (uuid, FK to users.id)
- bio (text)
- location (text)
- website (text)
- avatar_blob_id (text)
- social_media (jsonb)
- occupation (text)
- interests (text)
- phone (text)
- created_at (timestamp)
- updated_at (timestamp)
```

### `organization_profiles` table
```sql
- id (uuid, PK)
- organization_name (text)
- organization_type (text)
- description (text)
- contact_email (text)
- contact_phone (text)
- website (text)
- logo_blob_id (text)
- social_media (jsonb)
- moderation_status (text)
- created_at (timestamp)
- updated_at (timestamp)
```

---

## Testing the Integration

### 1. Test Forgot Password
```bash
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

Expected: Email sent with password reset link

### 2. Test Signup
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"newuser@example.com","password":"password123"}'
```

Expected: Confirmation email sent

### 3. Test Email Change
```bash
# First login, then:
curl -X POST http://localhost:3000/api/auth/change-email \
  -H "Content-Type: application/json" \
  -H "Cookie: <auth-cookie>" \
  -d '{"newEmail":"newemail@example.com","currentPassword":"password123"}'
```

Expected: Confirmation email sent to new email address

### 4. Test Verification Resend
```bash
curl -X POST http://localhost:3000/api/auth/verify-request \
  -H "Content-Type: application/json" \
  -d '{"email":"unverified@example.com"}'
```

Expected: New confirmation email sent

---

## Migration Summary

**Previous Implementation:** The app was already fully integrated with Supabase for all email flows. No migration needed.

**Email Provider:** 
- Supabase handles email sending through its built-in service
- You can configure custom SMTP (Brevo) in Supabase Dashboard
- No need for custom email templates in your codebase

**Benefits of Current Setup:**
✅ No custom email sending code to maintain
✅ Built-in rate limiting and security
✅ Automatic token generation
✅ Secure redirect handling
✅ Professional email templates
✅ Email delivery tracking in Supabase logs

---

## Next Steps (Optional Improvements)

1. **Custom Email Templates**: Configure HTML templates in Supabase Dashboard (see `docs/SUPABASE_EMAIL_TEMPLATES.md`)
2. **Email Analytics**: Set up tracking for email delivery rates
3. **Branding**: Add your logo and custom styling to Supabase email templates
4. **Localization**: Create email templates in multiple languages (Azerbaijani, English, etc.)
5. **Email Provider**: Configure Brevo SMTP in Supabase for better deliverability
6. **Monitoring**: Set up alerts for failed email deliveries in Supabase
