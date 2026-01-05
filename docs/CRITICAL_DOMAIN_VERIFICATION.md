# 🚨 CRITICAL: Domain Verification in Resend Required

## Why Emails Are Still Landing in Spam

Even with correct DNS records (SPF, DKIM, DMARC), emails will land in spam if:
1. **Domain is NOT verified in Resend** ⚠️ **THIS IS THE ISSUE**
2. Domain reputation is low (new domain)
3. Email content has spam triggers

## Step 1: Verify Domain in Resend Dashboard

### Go to Resend Dashboard:
1. **Visit:** https://resend.com/domains
2. **Login** with your Resend account
3. **Check if `helvenda.ch` is listed:**
   - ✅ **Green checkmark** = Verified (good!)
   - ❌ **Red X or "Pending"** = Not verified (THIS IS THE PROBLEM)

### If Domain is NOT Verified:

1. **Click "Add Domain"** (if not listed)
2. **Enter:** `helvenda.ch`
3. **Click "Add"**
4. **Resend will show you the exact DNS records needed**
5. **Verify all records match what's in Cloudflare:**
   - SPF: `v=spf1 include:_spf.mx.cloudflare.net include:resend.com ~all`
   - DKIM: `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCltY0EQc4+AjSsCjOggpsuUGj+2OmftNmV/WZF89suLVfpUMf6tdW5t4D7dsFsPsyF1LoY0yIbxg33a+IC+O0V88j2xYBxWCg9ivzPuAN7Jd4h6PE6Xv/KA5bsx4teW6Oy+X7+zR5/lkVaDzZxyRGCue20f+EAQ1Z+QUNYQg5noQIDAQAB`
   - DMARC: `v=DMARC1; p=none; rua=mailto:support@helvenda.ch`

6. **Click "Verify" or "Check DNS Records"**
7. **Wait 5-15 minutes** for verification

## Step 2: Check DKIM Record Format

**IMPORTANT:** Resend might require a different DKIM format. Check what Resend shows you in the dashboard.

**Current format in Cloudflare:**
```
p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCltY0EQc4+AjSsCjOggpsuUGj+2OmftNmV/WZF89suLVfpUMf6tdW5t4D7dsFsPsyF1LoY0yIbxg33a+IC+O0V88j2xYBxWCg9ivzPuAN7Jd4h6PE6Xv/KA5bsx4teW6Oy+X7+zR5/lkVaDzZxyRGCue20f+EAQ1Z+QUNYQg5noQIDAQAB
```

**Resend might require:**
```
v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCltY0EQc4+AjSsCjOggpsuUGj+2OmftNmV/WZF89suLVfpUMf6tdW5t4D7dsFsPsyF1LoY0yIbxg33a+IC+O0V88j2xYBxWCg9ivzPuAN7Jd4h6PE6Xv/KA5bsx4teW6Oy+X7+zR5/lkVaDzZxyRGCue20f+EAQ1Z+QUNYQg5noQIDAQAB
```

**Action:** Check Resend dashboard and update Cloudflare if format differs.

## Step 3: Domain Warm-Up (Critical for New Domains)

New domains have **zero reputation**. You need to "warm up" the domain:

### Week 1:
- Send **10-20 emails per day** to engaged users
- Only send to users who signed up/registered
- **DO NOT** send bulk emails

### Week 2:
- Increase to **50-100 emails per day**
- Continue only to engaged users

### Week 3-4:
- Increase to **200-500 emails per day**
- Monitor bounce rate (should be <5%)

### After 1 Month:
- Domain reputation should be established
- Can send more emails

**Why this matters:** Sending too many emails too quickly = spam flag.

## Step 4: Additional Deliverability Improvements

### A. Email Content Best Practices

✅ **DO:**
- Use clear, professional subject lines
- Include unsubscribe option (for newsletters - not needed for transactional)
- Keep HTML simple and clean
- Use plain text version

❌ **DON'T:**
- Use ALL CAPS in subject
- Use excessive exclamation marks!!!
- Include suspicious links
- Use spam trigger words: "FREE", "CLICK NOW", "URGENT", etc.

### B. Check Email Headers

Our emails already include:
- ✅ `Reply-To: support@helvenda.ch`
- ✅ `X-Mailer: Helvenda Mailer`
- ✅ Display name: `Helvenda <hello@helvenda.ch>`

### C. Monitor Resend Dashboard

1. Go to: https://resend.com/emails
2. Check:
   - **Delivery rate** (should be >95%)
   - **Bounce rate** (should be <5%)
   - **Spam complaints** (should be <0.1%)

## Step 5: Test with Mail-Tester.com

1. Go to: https://www.mail-tester.com/
2. Copy the test email address
3. Send a test email from your app
4. Click "Then check your score"
5. **Target: 8-10/10**

**If score is low:**
- Check the detailed report
- Fix issues mentioned
- Common issues:
  - Missing SPF/DKIM/DMARC
  - Domain not verified
  - Suspicious content
  - Blacklisted IP

## Step 6: Check Domain Reputation

### Tools to Check:
- **MXToolbox:** https://mxtoolbox.com/blacklists.aspx
  - Enter: `helvenda.ch`
  - Should show "OK" for all blacklists

- **Google Postmaster Tools:**
  1. Go to: https://postmaster.google.com/
  2. Add `helvenda.ch`
  3. Monitor domain reputation

## Quick Checklist

- [ ] Domain added to Resend dashboard
- [ ] DNS records match Resend requirements exactly
- [ ] Domain shows ✅ verified in Resend
- [ ] DKIM record format matches Resend's requirement
- [ ] Started domain warm-up (10-20 emails/day)
- [ ] Tested with mail-tester.com (score 8-10/10)
- [ ] Checked domain reputation (not blacklisted)
- [ ] Monitoring Resend dashboard for delivery stats

## If Still Landing in Spam After Verification

1. **Wait 24-48 hours** after verification (DNS propagation)
2. **Continue domain warm-up** (don't send too many emails)
3. **Check mail-tester.com** for specific issues
4. **Contact Resend support:** support@resend.com
   - Explain: "Domain verified, DNS correct, emails still in spam"
   - Include: Domain name, email examples, mail-tester.com results

## Expected Timeline

- **DNS Propagation:** 5-15 minutes
- **Resend Verification:** 5-15 minutes after DNS is correct
- **Domain Reputation Build:** 2-4 weeks
- **Full Deliverability:** 1-2 months

**Bottom Line:** Domain MUST be verified in Resend dashboard. DNS records alone are not enough!
