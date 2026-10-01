/**
 * Custom next/image loader. Unsplash images are resized and re-encoded
 * (AVIF/WebP via `auto=format`) directly on their CDN, so we get
 * responsive srcsets without routing every request through the Next.js
 * optimizer. Any other source is returned untouched.
 */
export default function imageLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  if (src.startsWith("https://images.unsplash.com/")) {
    const sep = src.includes("?") ? "&" : "?";
    return `${src}${sep}auto=format&fit=crop&w=${width}&q=${quality ?? 75}`;
  }
  return src;
}
