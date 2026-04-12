# Brevo SMTP Configuration for ICMA360

Complete guide for configuring and using Brevo SMTP with Supabase for ICMA360 authentication emails.

---

## ✅ Current Setup Status

- ✅ **Brevo SMTP** configured in Supabase
- ✅ **Sender Email:** `noreply@icma360.org`
- ✅ **Email sending** tested and working
- ✅ **DNS Records:** Needs SPF/DKIM/DMARC (optional but recommended)

---

## 📧 Email Templates

All email templates that match your current design are in:
- **`EMAIL_TEMPLATES_DESIGN_MATCHED.md`** - Complete HTML templates

### Template Summary

| Template | Subject | Status |
|----------|---------|--------|
| **Confirm Signup** | `ICMA360 - E-poçt ünvanınızı təsdiqləyin` | ✅ Ready to apply |
| **Reset Password** | `ICMA360 - Parolunuzu sıfırlayın` | ✅ Ready to apply |
| **Change Email** | `ICMA360 - E-poçt dəyişikliyini təsdiqləyin` | ✅ Ready to apply |

---

## 🎨 Design Features

The templates match your app's current design:

- **ICMA360 Logo** - Uses your actual logo (same as auth pages)
- **Clean Card Layout** - White card with gray border (like signin/register)
- **Inter Font** - Same font family
- **Gradient Buttons** - Your signature blue gradient with shadow
- **Notice Boxes** - Yellow (warnings) and blue (info) matching your UI
- **Minimal & Professional** - Clean aesthetic matching your app

---

## 🚀 How to Apply Templates

### In Supabase Dashboard:

1. Go to **Authentication** → **Email Templates**
2. Click **Confirm Signup**
3. Switch to **HTML** tab
4. Paste the HTML from `EMAIL_TEMPLATES_DESIGN_MATCHED.md`
5. Update **Subject** to: `ICMA360 - E-poçt ünvanınızı təsdiqləyin`
6. Click **Save**

Repeat for:
- **Reset Password** → Subject: `ICMA360 - Parolunuzu sıfırlayın`
- **Change Email** → Subject: `ICMA360 - E-poçt dəyişikliyini təsdiqləyin`

---

## 🧪 Testing

### Test Email Sending:

```bash
# Test signup confirmation
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@gmail.com","password":"testpass123"}'

# Test password reset
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@gmail.com"}'
```

### Check Brevo Logs:

Go to **Brevo Dashboard** → **Transactional** → **Email Logs** to see delivery status.

---

## 📊 DNS Records (Recommended)

To improve email deliverability and prevent spam:

### SPF Record
```
Type: TXT
Name: @
Value: v=spf1 include:spf.brevo.com ~all
```

### DKIM Record
- Go to **Brevo Dashboard** → **Senders** → **Domains** → `icma360.org`
- Copy the DKIM record provided by Brevo
- Add to your DNS

### DMARC Record
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarc-reports@icma360.org
```

---

## 🔧 Troubleshooting

### Emails going to spam?
1. Verify SPF/DKIM records are set
2. Wait 24-48 hours for DNS propagation
3. Check Brevo sender reputation
4. Use recognizable sender name ("ICMA360")

### Emails not sending?
1. Check Brevo **Transactional** → **Email Logs**
2. Verify SMTP credentials in Supabase
3. Ensure `noreply@icma360.org` is verified in Brevo
4. Check Brevo account status and limits

---

**Last Updated:** April 12, 2026
**Status:** ✅ Brevo SMTP configured and working
