# Setup support@helvenda.ch Email Address

## Option 1: Using Resend (Recommended if already using Resend)

If you're already using Resend for sending emails, you can set up `support@helvenda.ch`:

1. **Go to Resend Dashboard**: https://resend.com/domains
2. **Add Domain**: Add `helvenda.ch` as a verified domain
3. **Verify Domain**: Add the DNS records Resend provides to your domain registrar
4. **Create Email Address**: Once verified, you can send emails FROM `support@helvenda.ch`
5. **Set Up Inbox**: To RECEIVE emails at `support@helvenda.ch`, you need to:
   - Set up email forwarding in Resend (if available)
   - OR use a service like Google Workspace, Microsoft 365, or a simple email forwarding service

## Option 2: Using Your Domain Provider's Email Service

Most domain registrars offer email hosting:

1. **Log into your domain registrar** (where you registered helvenda.ch)
2. **Find Email/Mailbox settings**
3. **Create a new mailbox**: `support@helvenda.ch`
4. **Set a password** and configure the mailbox
5. **Access emails** via:
   - Webmail (usually provided by registrar)
   - Email client (Outlook, Apple Mail, etc.)
   - Forward to your personal email

## Option 3: Using Google Workspace or Microsoft 365

1. **Sign up** for Google Workspace or Microsoft 365
2. **Add domain** `helvenda.ch` to your account
3. **Verify domain** ownership
4. **Create user** `support@helvenda.ch`
5. **Access emails** via Gmail or Outlook

## Option 4: Simple Email Forwarding Service

Services like:

- **ForwardMX** (https://forwardmx.net)
- **ImprovMX** (https://improvmx.com)
- **Cloudflare Email Routing** (if using Cloudflare DNS)

These services forward emails from `support@helvenda.ch` to your personal email address.

## Quick Setup with Cloudflare (If using Cloudflare DNS)

1. Go to Cloudflare Dashboard → Email → Email Routing
2. Enable Email Routing for `helvenda.ch`
3. Add destination address (your personal email)
4. Create routing rule: `support@helvenda.ch` → your email

## Testing

After setup, test by:

1. Sending an email TO `support@helvenda.ch` from another email address
2. Check if it arrives at your configured destination
3. Reply to confirm it works

## Important Notes

- **DNS Propagation**: Changes can take 24-48 hours to propagate
- **MX Records**: Email forwarding requires proper MX records in DNS
- **SPF/DKIM**: Set up SPF and DKIM records to prevent emails from being marked as spam
