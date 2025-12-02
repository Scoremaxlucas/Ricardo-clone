# DNS-Records für helvenda.ch - Resend Verifizierung

## Vollständige DNS-Records zum Kopieren

### Record 1: Domain Verification (DKIM)
```
Type:     TXT
Name:     resend._domainkey
Value:    p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCltY0EQc4+AjSsCjOggpsuUGj+2OmftNmV/WZF89suLVfpUMf6tdW5t4D7dsFsPsyF1LoY0yIbxg33a+IC+O0V88j2xYBxWCg9ivzPuAN7Jd4h6PE6Xv/KA5bsx4teW6Oy+X7+zR5/lkVaDzZxyRGCue20f+EAQ1Z+QUNYQg5noQIDAQAB
TTL:      Auto (oder 3600)
```

### Record 2: Enable Sending - MX
```
Type:     MX
Name:     send
Value:    feedback-smtp.eu-west-1.amazonses.com
Priority: 10
TTL:      Auto (oder 3600)
```

### Record 3: Enable Sending - SPF
```
Type:     TXT
Name:     send
Value:    v=spf1 include:amazonses.com ~all
TTL:      Auto (oder 3600)
```

### Record 4: DMARC (Optional, aber empfohlen)
```
Type:     TXT
Name:     _dmarc
Value:    v=DMARC1; p=none;
TTL:      Auto (oder 3600)
```

## Anleitung

1. Öffne deinen Domain-Provider für helvenda.ch
2. Gehe zu DNS Management / DNS Settings
3. Füge jeden Record einzeln hinzu
4. Speichere alle Records
5. Warte 5-10 Minuten
6. Gehe zu https://resend.com/domains
7. Klicke auf helvenda.ch
8. Klicke "Verify" oder "Check DNS Records"

## Nach Verifizierung

Ändere in Vercel:
- RESEND_FROM_EMAIL zu: noreply@helvenda.ch
- Redeploy die Anwendung

