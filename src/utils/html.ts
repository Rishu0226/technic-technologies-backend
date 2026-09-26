const ALLOWED = new Set([
  'h1', 'h2', 'h3', 'h4', 'p', 'ul', 'ol', 'li', 'strong', 'em', 'b', 'i',
  'a', 'br', 'blockquote', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'span',
]);

function escapeAttr(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function safeHref(value: string) {
  const text = value.trim();
  if (text.startsWith('/') && !text.startsWith('//')) return text;
  try {
    const url = new URL(text);
    if (url.protocol === 'http:' || url.protocol === 'https:' || url.protocol === 'mailto:') return url.href;
  } catch {
    return '';
  }
  return '';
}

function safeSrc(value: string) {
  const text = value.trim();
  try {
    const url = new URL(text);
    if (url.protocol === 'http:' || url.protocol === 'https:') return url.href;
  } catch {
    return '';
  }
  return '';
}

function sanitizeAttrs(tag: string, raw: string) {
  const attrs: string[] = [];
  const pattern = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+))/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(raw))) {
    const key = match[1].toLowerCase();
    const value = match[3] ?? match[4] ?? match[5] ?? '';
    if (key.startsWith('on')) continue;
    if (tag === 'a' && key === 'href') {
      const href = safeHref(value);
      if (href) attrs.push(`href="${escapeAttr(href)}" target="_blank" rel="noopener noreferrer"`);
    }
    if (tag === 'img' && key === 'src') {
      const src = safeSrc(value);
      if (src) attrs.push(`src="${escapeAttr(src)}"`);
    }
    if (tag === 'img' && key === 'alt') attrs.push(`alt="${escapeAttr(value)}"`);
    if ((tag === 'td' || tag === 'th') && (key === 'colspan' || key === 'rowspan') && /^\d{1,2}$/.test(value)) {
      attrs.push(`${key}="${value}"`);
    }
  }
  return attrs.length ? ` ${attrs.join(' ')}` : '';
}

export function sanitizeHtml(value: unknown) {
  if (typeof value !== 'string') return '';
  let html = value
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/<\/?(?:iframe|object|embed|form|link|meta|base)\b[^>]*>/gi, '');

  html = html.replace(/<\/?([a-z0-9]+)([^>]*)>/gi, (match, tag: string, attrs: string) => {
    const name = tag.toLowerCase();
    if (!ALLOWED.has(name)) return '';
    if (match.startsWith('</')) return `</${name}>`;
    const clean = sanitizeAttrs(name, attrs);
    if (name === 'br' || name === 'img') return `<${name}${clean}>`;
    return `<${name}${clean}>`;
  });

  return html.trim();
}
