import DOMPurify from "dompurify";

export function sanitizeHtml(html: string): string {
  // DOMPurify butuh DOM; saat SSR di server, kembalikan html apa adanya
  if (typeof window === "undefined") return html;

  const maybeSanitize =
    typeof DOMPurify === "function"
      ? (DOMPurify as unknown as { sanitize: (input: string) => string })
          .sanitize
      : (DOMPurify as { sanitize?: (input: string) => string }).sanitize;

  if (typeof maybeSanitize === "function") {
    return maybeSanitize(html);
  }

  return html;
}
