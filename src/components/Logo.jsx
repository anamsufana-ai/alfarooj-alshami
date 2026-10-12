// The Al Farooj Al Shami logo, taken from the restaurant's own printed menu:
// the orange kufic corner and the white "الشامي" calligraphy.
// "mark" is the emblem only; "full" adds the restaurant name lines below it.
export default function Logo({ className = "logo-mark", variant = "mark", decorative = false }) {
  const src = variant === "full" ? "/brand/logo_full.webp" : "/brand/logo_mark.webp";
  const size = variant === "full" ? { width: 640, height: 798 } : { width: 360, height: 375 };
  return <img className={className} src={src} {...size} alt={decorative ? "" : "Al Farooj Al Shami Restaurant"} />;
}
