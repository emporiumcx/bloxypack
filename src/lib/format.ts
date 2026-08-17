export function formatBux(value: number) {
  return Math.round(value).toLocaleString("en-US");
}

export function slugToTitle(slug: string) {
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace("Sshf", "SSHF")
    .replace("Iq", "IQ");
}
