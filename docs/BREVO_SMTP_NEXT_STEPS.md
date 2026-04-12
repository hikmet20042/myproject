# Brevo SMTP for Supabase - Next Steps

Your Brevo SMTP is configured with `noreply@icma360.org`. Follow these steps to complete the setup.

---

## ✅ Step 1: Verify SMTP Configuration

### Check these settings in Supabase Dashboard:

**Location:** Authentication → Emails → SMTP Settings

| Field | Expected Value |
|-------|---------------|
| **Host** | `smtp-relay.brevo.com` |
| **Port** | `587` (TLS) or `465` (SSL) |
| **User** | Your Brevo SMTP username (usually the email or API key) |
| **Password** | Your Brevo SMTP password |
| **Sender Name** | `icma360` |
| **Sender Email** | `noreply@icma360.org` |

### If something looks wrong:

1. **Find your Brevo SMTP credentials:**
   - Log in to [Brevo Dashboard](https://my.brevo.com/)
   - Go to **SMTP & API** → **SMTP** tab
   - Find your SMTP credentials (or generate new ones)

2. **Update in Supabase:**
   - Go to **Authentication** → **Emails** → **SMTP Settings**
   - Toggle **Enable Custom SMTP** ON
   - Enter correct credentials
   - Click **Save changes**

---

## 🧪 Step 2: Test Email Sending

### Test 1: Register a New User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"your-personal-email@gmail.com","password":"testpass123"}'
```

**Expected:** You receive a confirmation email from `noreply@icma360.org`

### Test 2: Forgot Password

```bash
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"your-personal-email@gmail.com"}'
```

**Expected:** You receive a password reset email from `noreply@icma360.org`

### Test 3: Via UI

1. Go to `http://localhost:3000/auth/register`
2. Create a new account with your personal email
3. Check your inbox (and spam folder!)
4. You should receive the confirmation email

---

## 📧 Step 3: Configure DNS Records (Critical!)

To ensure emails land in **inbox** (not spam), configure these DNS records for `icma360.org`.

### 3.1 SPF Record (Sender Policy Framework)

**What it does:** Tells email servers that Brevo is authorized to send emails on your behalf.

**Add to your DNS (where icma360.org is managed):**

```
Type: TXT
Name: @
Value: v=spf1 include:spf.brevo.com ~all
```

**If you already have an SPF record**, modify it to include Brevo:

**Before:**
```
v=spf1 include:_spf.google.com ~all
```

**After:**
```
v=spf1 include:_spf.google.com include:spf.brevo.com ~all
```

**Note:** You can only have ONE SPF record (multiple `include:` statements are fine, but only one `v=spf1`).

---

### 3.2 DKIM Record (DomainKeys Identified Mail)

**What it does:** Adds a digital signature to emails, proving they're from you.

**How to set up in Brevo:**

1. Log in to [Brevo Dashboard](https://my.brevo.com/)
2. Go to **Senders** → **Domains**
3. Click **Add a Domain** (if not already added)
4. Enter `icma360.org`
5. Brevo will show you DKIM records to add to your DNS
6. Copy the DKIM record(s) and add them to your DNS

**Example DKIM record:**
```
Type: TXT
Name: brevo._domainkey
Value: k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA... (long string)
```

**Alternative method - Brevo provides these exact values:**
- Go to **Senders** → **Domains** → Click on `icma360.org`
- Under **DKIM**, you'll see the exact TXT record to add
- Copy and paste into your DNS provider

---

### 3.3 DMARC Record (Domain-based Message Authentication)

**What it does:** Tells email servers what to do if SPF/DKIM checks fail.

**Add to your DNS:**

```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarc-reports@icma360.org; ruf=mailto:dmarc-forensics@icma360.org; fo=1
```

**What the values mean:**
- `p=none` - Monitor only (don't reject emails yet)
- `rua=` - Where to send daily aggregate reports
- `ruf=` - Where to send forensic reports (for failures)
- `fo=1` - Generate reports for all failures

**Later (after monitoring for a week), you can tighten it:**
```
v=DMARC1; p=quarantine; rua=mailto:dmarc-reports@icma360.org
```

Or eventually:
```
v=DMARC1; p=reject; rua=mailto:dmarc-reports@icma360.org
```

---

## 🔍 Step 4: Verify DNS Records

After adding DNS records, verify they're working:

### Using Online Tools:

1. **MXToolbox:** https://mxtoolbox.com/
   - Enter `icma360.org` and check SPF, DKIM, DMARC

2. **Brevo Domain Check:**
   - Go to **Senders** → **Domains** → `icma360.org`
   - Brevo will show if records are verified

### Using Command Line:

```bash
# Check SPF
dig icma360.org TXT +short

# Check DKIM
dig brevo._domainkey.icma360.org TXT +short

# Check DMARC
dig _dmarc.icma360.org TXT +short
```

---

## 🎨 Step 5: Verify Email Templates

Your email templates should already be configured (from earlier docs). Verify them:

**Location:** Authentication → Email Templates

### Check these templates:

1. **Confirm Signup**
   - Subject: `icma360 - E-poçt ünvanınızı təsdiqləyin`
   - HTML content configured

2. **Reset Password**
   - Subject: `icma360 - Parolunuzu sıfırlayın`
   - HTML content configured

3. **Change Email**
   - Subject: `icma360 - E-poçt dəyişikliyini təsdiqləyin`
   - HTML content configured

If not configured yet, see: `docs/SUPABASE_EMAIL_SETUP_GUIDE.md`

---

## 📊 Step 6: Monitor Email Delivery

### In Brevo Dashboard:

1. Go to **Transactional** → **Email Logs**
2. You'll see all emails sent via Brevo
3. Check for:
   - ✅ **Sent** - Email delivered successfully
   - ⚠️ **Bounced** - Email failed (check address)
   - ❌ **Spam complaints** - User marked as spam
   - 📬 **Opened** - User opened the email

### In Supabase Dashboard:

1. Go to **Authentication** → **Logs**
2. Check for auth-related errors
3. Look for failed email sends

---

## 🚨 Step 7: Troubleshooting

### Issue: No emails received

**Check:**

1. **Spam/Junk folder** - Most common issue!
2. **Brevo Logs** - Go to Brevo → Transactional → Email Logs
3. **SMTP configuration** - Verify credentials in Supabase
4. **DNS records** - Ensure SPF/DKIM are set up
5. **Sender verification** - Ensure `noreply@icma360.org` is verified in Brevo

**Quick test:**
```bash
# Test with a different email provider (Gmail, Outlook, etc.)
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@gmail.com","password":"testpass123"}'
```

---

### Issue: Emails going to spam

**Solutions:**

1. **Wait 24-48 hours** after adding DNS records (propagation time)
2. **Verify SPF record** - Use https://mxtoolbox.com/spf.aspx
3. **Verify DKIM record** - Use https://mxtoolbox.com/dkim.aspx
4. **Verify DMARC record** - Use https://mxtoolbox.com/dmarc.aspx
5. **Check sender reputation** - https://mxtoolbox.com/blacklists.aspx
6. **Use a recognizable sender name** - "icma360" not "noreply"
7. **Ensure email content is professional** (use the templates provided)

---

### Issue: "SMTP connection failed"

**Check:**

1. **SMTP credentials** - Verify in Brevo dashboard
2. **Host** - Should be `smtp-relay.brevo.com`
3. **Port** - Should be `587` (TLS) or `465` (SSL)
4. **Firewall** - Ensure outbound connections to Brevo are allowed
5. **Account status** - Ensure Brevo account is active

---

### Issue: "Sender email not verified"

**Fix:**

1. Go to **Brevo Dashboard** → **Senders** → **Domains**
2. Ensure `icma360.org` is verified
3. If not, complete domain verification:
   - Add DNS records as instructed by Brevo
   - Wait for verification (can take up to 24 hours)
4. Ensure `noreply@icma360.org` is added as a sender

---

## 📈 Step 8: Production Readiness Checklist

Before going live:

- [ ] SMTP credentials verified and working
- [ ] Test email sent successfully (checked inbox)
- [ ] SPF record configured and verified
- [ ] DKIM record configured and verified
- [ ] DMARC record configured
- [ ] Email templates configured in Supabase
- [ ] No emails going to spam
- [ ] Brevo domain verified
- [ ] Sender email (`noreply@icma360.org`) verified
- [ ] Monitoring Brevo email logs
- [ ] Updated `.env` files if needed

---

## 🔐 Security Notes

1. **Never commit Brevo credentials** to git
2. **Use environment variables** for SMTP password (handled by Supabase dashboard, not your code)
3. **Rotate SMTP password** periodically in Brevo dashboard
4. **Monitor email logs** for suspicious activity
5. **Enable two-factor authentication** on your Brevo account

---

## 📚 Reference Files

- `docs/SUPABASE_EMAIL_TEMPLATES.md` - Email template content
- `docs/SUPABASE_EMAIL_SETUP_GUIDE.md` - Visual setup guide
- `docs/ZOHO_SMTP_SETUP.md` - Zoho SMTP guide (not using anymore)
- `docs/QUICK_REFERENCE_SUPABASE.md` - Quick reference card

---

## 🆘 Need Help?

- **Brevo Support:** https://help.brevo.com/
- **Supabase Auth Docs:** https://supabase.com/docs/guides/auth/auth-smtp
- **Brevo SMTP Docs:** https://help.brevo.com/hc/en-us/articles/360000191380

---

**Last Updated:** April 12, 2026
**Status:** Ready to test
