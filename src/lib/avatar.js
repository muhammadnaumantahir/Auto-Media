const PALETTE = [
  { bg: "#7C5CFF1A", fg: "#A996FF" }, // violet
  { bg: "#2DD4BF1A", fg: "#5EEAD4" }, // teal
  { bg: "#F5A6231A", fg: "#FBC373" }, // amber
  { bg: "#FB5A751A", fg: "#FC8B9D" }, // rose
  { bg: "#3B82F61A", fg: "#7CAAFA" }, // blue
];

export function initials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function avatarColor(seed = "") {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}
