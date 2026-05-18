/** Helvenda Wohnungen — help, FAQ, contact (English) */

export const wohnenHelpArticlesEn = {
  'wohnen-was-ist-helvenda-wohnungen': {
    title: 'What is Helvenda Wohnungen?',
    category: 'Getting started',
    content: [
      'Helvenda Wohnungen is Helvenda’s rental marketplace at wohnen.helvenda.ch — separate from the C2C marketplace at helvenda.ch.',
      'For tenants: profile, debt enforcement register extract, and Helvenda quality certificate — set up once, apply faster to matching listings.',
      'For landlords: qualified enquiries instead of unfiltered mass messages. Where applicable we check register status and income category (3× rent rule).',
      'Helvenda is not a party to any tenancy agreement.',
    ],
    tips: ['One Helvenda account works for marketplace and Wohnungen.', 'Tenants: start under “My profile” or browse “Apartments”.'],
  },
  'wohnen-kosten-und-gebuehren': {
    title: 'Pricing — what is free?',
    category: 'Getting started',
    content: [
      'During the launch phase, Helvenda Wohnungen is free for tenants. There is no mandatory subscription for contact or applications.',
      'Landlords can use core features without per-day listing fees; future premium options will be communicated transparently.',
      'The quality certificate is a trust tool, not a credit agency report.',
    ],
    tips: ['See Terms §1.5.8 for fees where published.'],
  },
  'wohnen-profil-und-suchprofil': {
    title: 'Profile and search preferences',
    category: 'Tenant',
    content: [
      'Under “My profile” you enter household, income category, employment, and preferred areas.',
      'Matches appear under “My matches”; complete phone and required fields before applying.',
    ],
    tips: ['Update your profile when income or household changes.'],
  },
  'wohnen-betreibungsregister-hochladen': {
    title: 'Upload debt enforcement register extract',
    category: 'Tenant',
    content: [
      'Upload a current official PDF extract (typically max. 3 months old).',
      'We verify automatically or manually. A “verified” status is required for the certificate and qualified applications.',
    ],
    tips: ['Use official PDFs only, not screenshots.', 'Renew before expiry.'],
  },
  'wohnen-bewerbung-abgeben': {
    title: 'Apply for a rental',
    category: 'Tenant',
    content: [
      'Applications run through Helvenda Wohnungen with the same qualification rules (profile, phone, register, 3× rent where required).',
      'Landlords decide on acceptance, rejection, or viewings — not Helvenda.',
    ],
    tips: ['Check “My profile” and “Certificate” first.', 'Track applications under “My applications”.'],
  },
  'wohnen-qualitaetsnachweis-nutzen': {
    title: 'Helvenda quality certificate',
    category: 'Certificate',
    content: [
      'After requirements are met you receive a PDF with code HLV-YYYY-XXXXXXXX and a verification link at /verify/…',
      'You may attach the PDF outside Helvenda (e.g. other portals or email).',
    ],
    tips: ['Renew expired certificates under “Certificate”.', 'Only trust links on wohnen.helvenda.ch/verify/…'],
  },
  'wohnen-inserat-veroeffentlichen': {
    title: 'Publish a rental listing',
    category: 'Landlord',
    content: [
      'Use “List apartment” to enter object, rent, availability, and contact.',
      'New listings require tenant qualification — you receive qualified leads only.',
    ],
    tips: ['Keep data accurate and deactivate when rented.'],
  },
  'wohnen-vermieter-leads': {
    title: 'Applications and leads for landlords',
    category: 'Landlord',
    content: [
      'You receive an email with applicant details and a link to verify the quality certificate.',
      'Use the official /verify/ link — not screenshots alone.',
    ],
    tips: ['See help article “Verify quality certificate”.'],
  },
  'wohnen-datenschutz-und-sicherheit': {
    title: 'Privacy and security',
    category: 'Trust',
    content: [
      'Rental data is processed for matching and applications — see Privacy Policy, Helvenda Wohnungen section.',
      'Never send passwords or payment details via the contact form.',
    ],
    tips: ['Full policy: footer “Privacy”.'],
  },
}

export const wohnenSupportEn = {
  help: {
    title: 'Help — Helvenda Wohnungen',
    subtitle: 'Guides for profile, certificate, applications, and landlord leads',
    searchPlaceholder: 'Search topics (e.g. certificate, application)…',
    faq: 'FAQ',
    faqDesc: 'Short answers about renting on Helvenda',
    contact: 'Contact',
    contactDesc: 'Support for Helvenda Wohnungen',
    noResults: 'No matching article',
    noResultsDesc: 'Try other terms or contact us.',
    contactUs: 'Contact us',
    stillQuestions: 'Still have questions?',
    stillQuestionsDesc: 'We help with profile, certificate, applications, and listings. Use the contact form and pick a Wohnungen category.',
    contactForm: 'Contact form',
    viewFAQ: 'View FAQ',
    gettingStarted: 'Getting started',
    tenant: 'Tenant & application',
    certificate: 'Quality certificate',
    landlord: 'Landlord & listings',
    trust: 'Privacy & security',
  },
  faq: {
    title: 'FAQ — Helvenda Wohnungen',
    subtitle: 'Profile, certificate, applications, and landlord leads',
    searchPlaceholder: 'Search questions…',
    all: 'All',
    general: 'General',
    tenant: 'Tenant',
    landlord: 'Landlord',
    certificate: 'Certificate',
    noResults: 'No results',
    noResultsDesc: 'Try other terms or use the contact form.',
    helpCenter: 'Help centre',
    questionNotFound: 'Question not found?',
    questionNotFoundDesc: 'We usually reply within 24–48 hours on business days.',
    contactUs: 'Contact us',
  },
  faqQuestions: {
    general: [
      {
        question: 'How is this different from helvenda.ch?',
        answer:
          'helvenda.ch is the C2C marketplace. wohnen.helvenda.ch is rentals only — with profile, quality certificate, and qualified applications. One login for both.',
      },
      {
        question: 'Do tenants need a subscription?',
        answer: 'No mandatory subscription for contact or applications.',
      },
      {
        question: 'Is Helvenda party to the lease?',
        answer: 'No. Helvenda provides the platform; lease and selection are between tenant and landlord.',
      },
    ],
    tenant: [
      {
        question: 'Why can’t I apply?',
        answer:
          'Applications need a complete profile, valid phone, and where required a verified register extract and 3× rent rule. Check “My profile”.',
      },
      {
        question: 'How long is my register extract valid?',
        answer: 'Typically up to three months; upload a new one when it expires.',
      },
      {
        question: 'What is the 3× rent rule?',
        answer: 'Household net income should be at least three times the gross rent (category from profile). Orientation for landlords, not a legal guarantee by Helvenda.',
      },
    ],
    landlord: [
      {
        question: 'Why only “qualified” enquiries?',
        answer: 'Listings target verified applicants (profile, register, 3× rule) to reduce weak mass enquiries.',
      },
      {
        question: 'How do I verify the certificate?',
        answer: 'Use wohnen.helvenda.ch/verify/ with the HLV- code. See the help centre guide.',
      },
      {
        question: 'Can I import a listing?',
        answer: 'Allowed sources (e.g. Tutti, UrbanHome) via URL or screenshot. Homegate/ImmoScout imports are not permitted.',
      },
    ],
    certificate: [
      {
        question: 'Is this a credit report?',
        answer: 'No. It shows the verification status documented at Helvenda. Landlords may request payslips additionally.',
      },
      {
        question: 'Can I use the PDF on other portals?',
        answer: 'Yes — use the official PDF and verification link.',
      },
    ],
  },
  contact: {
    title: 'Contact — Helvenda Wohnungen',
    subtitle: 'Profile, certificate, applications, listings, or technical issues',
    contactMethods: 'How to reach us',
    email: 'Email',
    emailAddress: 'support@helvenda.ch',
    emailResponseTime: 'Usually within 24–48 hours on business days',
    phone: 'Phone',
    phoneNumber: '+41 44 508 28 90',
    phoneHours: 'Mon–Fri, 9am–5pm',
    note: 'Note',
    noteText:
      'Pick a category (tenant, landlord, certificate…) so we can route your request. For the C2C marketplace use helvenda.ch.',
    moreHelp: 'Self-service',
    helpCenter: '→ Wohnungen help centre',
    faq: '→ Wohnungen FAQ',
    sendMessage: 'Send message',
    categoryRequired: 'Category *',
    pleaseSelect: 'Please select…',
    tenant: 'Tenant — profile / application',
    landlord: 'Landlord — leads / listing',
    certificate: 'Quality certificate',
    listing: 'Listing / import',
    technical: 'Technical issue',
    feedback: 'Feedback',
    other: 'Other',
    yourEmailRequired: 'Your email *',
    emailPlaceholder: 'your.email@example.com',
    subjectRequired: 'Subject *',
    subjectPlaceholder: 'e.g. Question about certificate',
    messageRequired: 'Message *',
    messagePlaceholder: 'Describe your request (listing ID, application ID, or HLV- code helps).',
    privacyAgreement: 'I have read the privacy policy and agree to processing for this request. *',
    send: 'Send message',
    sending: 'Sending…',
    messageSent: 'Message sent',
    messageSentDesc: 'Thank you. We will get back to you as soon as possible.',
    backToHome: 'Home',
    sendAnother: 'Another message',
    fillAllFields: 'Please fill in all fields',
    successMessage: 'Message sent — we will reply shortly.',
    errorMessage: 'Failed to send. Please try again later.',
  },
  privacySection: {
    title: 'Helvenda Wohnungen — additional privacy notes',
    intro: 'This summary supplements the privacy policy for wohnen.helvenda.ch. The full policy below remains authoritative.',
    items: [
      { heading: 'Tenant profile', text: 'Household, employment, income category, location preferences, contact data — for matching and applications.' },
      { heading: 'Debt enforcement register', text: 'PDF upload for verification; document deleted after review where applicable; status retained.' },
      { heading: 'Applications', text: 'Application content and timing — shared with the landlord as a lead.' },
      { heading: 'Quality certificate', text: 'PDF and HLV code; public verification at /verify/…' },
      { heading: 'Landlord leads', text: 'Applicant data emailed to the listing contact; stored for support and audit.' },
    ],
  },
  imprintIntro:
    'This imprint applies to Helvenda Wohnungen (wohnen.helvenda.ch), the rental marketplace operated by Score-Max GmbH. The C2C marketplace is at helvenda.ch.',
  termsJump: 'Using Helvenda Wohnungen? Rental terms are in section 1.5 of the Terms below.',
  termsJumpLink: 'Jump to section 1.5 — Helvenda Wohnungen',
}
