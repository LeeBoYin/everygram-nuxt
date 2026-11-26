// Markdown can come from other users (public trip pages), so the HTML is always
// sanitized before it reaches `v-html`.
import DOMPurify from 'isomorphic-dompurify';
import { Marked } from 'marked';

const SAFE_PROTOCOLS = ['http:', 'https:', 'mailto:'];
// only used to resolve relative links, such as `/privacy/en` or `#section`
const BASE_URL = 'https://everygram.app';

const escapeHtml = (value: string) =>
    value
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
// every `&` is escaped, so the browser reads exactly the URL that was checked
const escapeHref = (href: string) => escapeHtml(href.replace(/&/g, '&amp;'));
// titles keep the entities already written in the Markdown source
const escapeTitle = (title: string) =>
    escapeHtml(
        title.replace(/&(?!(?:#\d+|#x[\da-f]+|[a-z][\da-z]*);)/gi, '&amp;'),
    );

const isSafeHref = (href: string) => {
    try {
        // `URL` normalizes case, whitespace and control characters the same way
        // browsers do
        return SAFE_PROTOCOLS.includes(new URL(href, BASE_URL).protocol);
    } catch {
        return false;
    }
};

// a separate instance, so the options don't leak to other users of `marked`
const marked = new Marked({
    async: false,
    breaks: true,
    renderer: {
        link({ href, title, tokens }) {
            const text = this.parser.parseInline(tokens);
            if (!isSafeHref(href)) {
                return text;
            }
            const titleAttr = title ? ` title="${escapeTitle(title)}"` : '';
            return `<a href="${escapeHref(href)}" target="_blank" rel="noopener noreferrer"${titleAttr}>${text}</a>`;
        },
    },
});

// raw HTML can be written in Markdown, and it skips the link renderer above
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    // a class could cover the page using the app's own utility classes, only
    // the one `marked` adds to code blocks is kept
    const className = node.getAttribute('class');
    if (className !== null && !/^language-\S+$/.test(className)) {
        node.removeAttribute('class');
    }
    // task list checkboxes are the only inputs Markdown creates
    if (node.nodeName === 'INPUT') {
        if (node.getAttribute('type') !== 'checkbox') {
            node.remove();
            return;
        }
        node.setAttribute('disabled', '');
    }
    if (node.nodeName !== 'A' && node.nodeName !== 'AREA') {
        return;
    }
    const href = node.getAttribute('href');
    if (href !== null && !isSafeHref(href)) {
        node.removeAttribute('href');
    }
    if (node.hasAttribute('target')) {
        node.setAttribute('rel', 'noopener noreferrer');
    }
});

const SANITIZE_CONFIG = {
    // plain HTML only, no SVG or MathML
    USE_PROFILES: { html: true },
    ADD_ATTR: ['target'],
    // they can restyle the whole page or collect input, Markdown needs neither
    FORBID_TAGS: ['style', 'form', 'button', 'textarea', 'select', 'dialog'],
    FORBID_ATTR: ['style', 'id', 'name'],
};

export const renderMarkdown = (content: string): string =>
    DOMPurify.sanitize(
        marked.parse(content || '') as string,
        SANITIZE_CONFIG,
    ) as string;
