const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

const JSON_ESCAPES: Record<string, string> = {
  "<": "\\u003C",
  ">": "\\u003E",
  "&": "\\u0026",
  "\u2028": "\\u2028",
  "\u2029": "\\u2029",
};

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => HTML_ESCAPES[character]);
}

export function escapeAttribute(value: string): string {
  return escapeHtml(value);
}

export function safeHttpUrl(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;

  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return undefined;
    }

    return url.href;
  } catch {
    return undefined;
  }
}

export function serializeJsonForHtml(value: unknown): string {
  const serialized = JSON.stringify(value) ?? "null";
  return serialized.replace(/[<>&\u2028\u2029]/g, (character) => JSON_ESCAPES[character]);
}
