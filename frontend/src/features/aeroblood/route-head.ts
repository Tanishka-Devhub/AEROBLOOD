export function portalHead(title: string, description: string) {
  return { meta: [
    { title: `${title} | AERO-BLOOD` },
    { name: 'description', content: description },
    { property: 'og:title', content: `${title} | AERO-BLOOD` },
    { property: 'og:description', content: description },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] };
}