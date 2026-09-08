// One description of every product — hub, rail, overview and page heads all
// read from here, so there's a single place to correct a fact.
//
// Links, categories and store names were taken from the live App Store listings
// and from the sites themselves, not written from memory.

export const STUDIO = {
  name: "New Age Technologies",
  what: "Independent app studio",
  link: "https://www.newagetech.co.uk",
  linkLabel: "newagetech.co.uk",
  about:
    "A small UK mobile studio making calm, useful iOS apps under the OAISIS brand. Everything below ships from here.",
};

export const CATALOG = [
  {
    slug: "opaque",
    name: "Opaque",
    storeName: "Opaque — AI Photo Editor",
    what: "iOS photo editor",
    platform: "iOS",
    category: "Photo & Video",
    price: "Free · IAP",
    logo: "/logos/opaque.png",
    wash: "w-sage",
    source: "opaque-3964b",
    link: "https://apps.apple.com/us/app/opaque-ai-photo-editor/id6793271006",
    linkLabel: "App Store",
    live: true,
    blurb: "Users, per-user P&L, retention, usage and paywall funnels, filter performance, and every custom prompt typed.",
    about:
      "One-tap photo editing: a library of AI filters applied to a picture from the camera roll. Records revenue and API spend per user, so its P&L is exact rather than inferred.",
    views: [
      ["", "Overview", "gauge"],
      ["filters", "Filters", "sliders"],
      ["users", "Users", "people"],
      ["sessions", "Sessions", "clock"],
      ["prompts", "Prompts", "quote"],
    ],
  },
  {
    slug: "oaisislabs",
    name: "OAISIS Labs",
    storeName: "OAISIS Labs",
    what: "TikTok scheduling",
    platform: "Web",
    category: "Marketing SaaS",
    price: "Free in beta",
    logo: "/logos/oaisislabs.svg",
    wash: "w-mist",
    source: "oaisislabs",
    link: "https://www.oaisislabs.com",
    linkLabel: "oaisislabs.com",
    live: true,
    blurb: "Posts by status, what TikTok refused and why, delivery lag, direct against inbox, slideshows.",
    about:
      "Upload videos and carousels in bulk, set a posting calendar, and it publishes to TikTok on schedule — then reports what each post did. Approved by TikTok on 27 August 2026; the Direct Post audit is still pending, so posts currently land as inbox drafts.",
    views: [["", "Overview", "send"]],
  },
  {
    slug: "oaisis",
    name: "OAISIS",
    storeName: "Oasis — Voice Transcription",
    what: "Voice to text",
    platform: "macOS · iOS",
    category: "Productivity",
    price: "Free · Pro tier",
    logo: "/logos/oaisis.png",
    wash: "w-clay",
    source: "oaisis-a6968",
    link: "https://www.oaisis.co.uk",
    linkLabel: "oaisis.co.uk",
    live: true,
    blurb: "Transcriptions, hours of audio, words, pro conversion, per-user load, and what people actually dictate.",
    about:
      "Hold a key, speak, and the text lands wherever the cursor is — plus an optimize pass that rewrites a selection from a spoken instruction. The heaviest-used product by volume: thousands of transcriptions against a small user base.",
    views: [["", "Overview", "waveform"]],
  },
  {
    slug: "faike",
    name: "FAIKE",
    storeName: "FAIKE: AI Detector",
    what: "AI content detector",
    platform: "iOS",
    category: "Utilities",
    price: "Free · IAP",
    logo: "/logos/faike.png",
    wash: "w-sage",
    source: "faike-2828d",
    link: "https://apps.apple.com/us/app/faike-ai-detector/id6782379468",
    linkLabel: "App Store",
    live: true,
    blurb: "Scans by kind, the paywall funnel, who ran out, sessions by country and device, every query typed.",
    about:
      "Point it at an image, a block of text or a claim and it says whether it looks machine-made, or checks it against sources. The most instrumented product — sessions, journeys and geography are all recorded.",
    views: [
      ["", "Overview", "shield"],
      ["scans", "Scans", "gauge"],
      ["users", "Users", "people"],
      ["sessions", "Sessions", "clock"],
      ["revenue", "Revenue", "quote"],
    ],
  },
  {
    slug: "surrender",
    name: "Surrender",
    storeName: "Surrender: Walk with Jesus",
    what: "Nightly confession",
    platform: "iOS",
    category: "Lifestyle",
    price: "Free · IAP",
    logo: "/logos/surrender.png",
    wash: "w-clay",
    source: "surrender-e927a",
    link: "https://www.newagetech.co.uk/surrender",
    linkLabel: "newagetech.co.uk",
    live: true,
    blurb:
      "The full onboarding funnel step by step, what people answered, what they confessed to, paywall dwell and dismissals, and the nightly retention loop.",
    about:
      "Write one honest sentence and the app generates a seven-day devotional path from it, then asks a single question every night. The only product with zero API cost — the content engine runs entirely on device, so revenue is very nearly margin.",
    views: [
      ["", "Overview", "gauge"],
      ["funnel", "Funnel", "sliders"],
      ["users", "Users", "people"],
    ],
  },
];

export const bySlug = (slug) => CATALOG.find((p) => p.slug === slug);
