// One description of every product, shared by the hub, the rail and the pages.
// Adding a product means adding an entry here — nothing else keeps a list.
export const CATALOG = [
  {
    slug: "opaque",
    name: "Opaque",
    what: "iOS photo editor",
    logo: "/logos/opaque.png",
    wash: "w-sage",
    source: "opaque-3964b",
    live: true,
    blurb: "Users, per-user P&L, retention, usage and paywall funnels, filter performance, and every custom prompt typed.",
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
    what: "TikTok scheduling",
    logo: "/logos/oaisislabs.svg",
    wash: "w-mist",
    source: "oaisislabs",
    live: true,
    blurb: "Posts by status, what TikTok refused and why, delivery lag, direct against inbox, slideshows.",
    views: [["", "Overview", "send"]],
  },
  {
    slug: "oaisis",
    name: "OAISIS",
    what: "Voice to text",
    logo: "/logos/oaisis.png",
    wash: "w-clay",
    source: "oaisis-a6968",
    live: true,
    blurb: "Transcriptions, hours of audio, words, pro conversion, per-user load, and what people actually dictate.",
    views: [["", "Overview", "waveform"]],
  },
  {
    slug: "faike",
    name: "FAIKE",
    what: "iOS fact checker",
    logo: "/logos/faike.png",
    wash: "w-sage",
    source: "faike-2828d",
    live: true,
    blurb: "Scans by kind, the paywall funnel, who ran out, sessions by country and device, every query typed.",
    views: [["", "Overview", "shield"]],
  },
];

export const bySlug = (slug) => CATALOG.find((p) => p.slug === slug);
