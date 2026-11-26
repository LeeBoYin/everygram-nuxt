// `npm run test:unit` disables `require(esm)` like the Netlify function runtime,
// so an ESM-only dependency of the sanitizer fails here instead of in production.
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { test } from 'node:test';
import { JSDOM } from 'jsdom';
import { Marked } from 'marked';
import { renderMarkdown } from '../../utils/markdown.ts';

const parse = (html) => new JSDOM(`<body>${html}</body>`).window.document.body;

// fails on anything that can run a script or take over the page
const assertHarmless = (content) => {
    const html = renderMarkdown(content);
    for (const node of parse(html).querySelectorAll('*')) {
        assert.doesNotMatch(
            node.nodeName,
            /^(SCRIPT|IFRAME|OBJECT|EMBED|STYLE|FORM|BASE|META|LINK|SVG|MATH)$/i,
            html,
        );
        for (const { name, value } of node.attributes) {
            assert.doesNotMatch(
                name,
                /^(on|style$|srcdoc$|formaction$)/i,
                html,
            );
            if (['href', 'src', 'action', 'xlink:href'].includes(name)) {
                assert.doesNotMatch(
                    new URL(value, 'https://everygram.app').protocol,
                    /^(javascript|data|vbscript|file):$/,
                    html,
                );
            }
        }
    }
    return html;
};

test('raw HTML cannot run scripts', () => {
    for (const content of [
        'hi <img src=x onerror=alert(1)>',
        '<script>alert(1)</script>',
        '<iframe src="https://evil.example"></iframe>',
        '<iframe srcdoc="<script>alert(1)</script>"></iframe>',
        '<svg onload=alert(1)></svg>',
        '<math><mtext><img src=x onerror=alert(1)></mtext></math>',
        '<a href="javascript:alert(1)">a</a>',
        '<a href=" JaVaScRiPt:alert(1)">a</a>',
        '<a href="jav&#x09;ascript:alert(1)">a</a>',
        '<div onclick="alert(1)">a</div>',
        '<object data="x"></object><embed src="x">',
        '<style>body { display: none }</style>',
        '<form action="https://evil.example"><input name=password></form>',
        '<base href="https://evil.example">',
        '<meta http-equiv="refresh" content="0;url=https://evil.example">',
    ]) {
        assertHarmless(content);
    }
});

test('links with other schemes become plain text', () => {
    for (const href of [
        'javascript:alert(1)',
        'JaVaScRiPt:alert(1)',
        '< javascript:alert(1)>',
        '<  \tJAVASCRIPT:alert(1)>',
        '&#x20;javascript:alert(1)',
        '&#106;avascript:alert(1)',
        'javascript&colon;alert(1)',
        'java&Tab;script:alert(1)',
        'data:text/html,<script>alert(1)</script>',
        'vbscript:msgbox(1)',
        'file:///etc/passwd',
    ]) {
        const body = parse(assertHarmless(`[**link**](${href})`));
        for (const a of body.querySelectorAll('a')) {
            // a link is only left if the browser reads it as a safe URL
            assert.match(
                new URL(a.getAttribute('href'), 'https://everygram.app')
                    .protocol,
                /^(https?|mailto):$/,
                href,
            );
        }
    }
    assert.equal(
        renderMarkdown('[**link**](javascript:alert(1))'),
        '<p><strong>link</strong></p>\n',
    );
    assertHarmless('<javascript:alert(1)>');
    assertHarmless('[a][ref]\n\n[ref]: javascript:alert(1)');
    assertHarmless('![a](javascript:alert(1))');
});

test('quotes in href and title cannot add attributes', () => {
    const body = parse(
        assertHarmless(
            `[a](https://example.com/"onmouseover="alert(1) 'x" onmouseover="alert(1)')`,
        ),
    );
    const a = body.querySelector('a');
    assert.equal(a.getAttribute('title'), 'x" onmouseover="alert(1)');
    assert.deepEqual([...a.attributes].map(({ name }) => name).sort(), [
        'href',
        'rel',
        'target',
        'title',
    ]);
});

test('raw HTML cannot restyle the page or open an unsafe window', () => {
    const body = parse(
        assertHarmless(
            '<div class="fixed" style="top:0" id="a">a</div>' +
                '<a href="https://example.com" target="_blank">a</a>' +
                '<input type="password">',
        ),
    );
    assert.equal(body.querySelector('div').attributes.length, 0);
    assert.equal(body.querySelector('a').rel, 'noopener noreferrer');
    assert.equal(body.querySelector('input'), null);
});

// what the previous renderer produced for trusted content
const trusted = new Marked({
    breaks: true,
    renderer: {
        link({ href, title, tokens }) {
            const titleAttr = title ? ` title="${title}"` : '';
            return `<a href="${href}" target="_blank" rel="noopener noreferrer"${titleAttr}>${this.parser.parseInline(tokens)}</a>`;
        },
    },
});
const assertUnchanged = (content) =>
    assert.equal(
        parse(renderMarkdown(content)).innerHTML,
        parse(trusted.parse(content)).innerHTML,
    );

test('normal Markdown is unchanged', () => {
    assertUnchanged(
        [
            '# Title',
            '## Sub **bold** *italic* ~~del~~',
            'line one\nline two',
            '- a\n- b\n    - c',
            '3. c\n4. d',
            '- [x] done\n- [ ] todo',
            '> quote',
            '`code <b>`',
            '```js\nconst a = "<script>";\n```',
            '| a | b |\n|:--|--:|\n| 1 | 2 |',
            '---',
            '![photo](https://example.com/a.png "Photo")',
            '[**bold** link](https://example.com/?a=1&b=2 "A \'title\'")',
            '[mail](mailto:a@example.com) [local](/privacy/en) [top](#top)',
            'https://example.com/auto <http://example.com>',
            'a & b < c &copy;',
        ].join('\n\n'),
    );
});

test('release notes and privacy pages are unchanged', () => {
    const dir = new URL('../../content/', import.meta.url);
    for (const file of readdirSync(dir)) {
        assertUnchanged(readFileSync(new URL(file, dir), 'utf8'));
    }
});

test('empty content', () => {
    assert.equal(renderMarkdown(''), '');
    assert.equal(renderMarkdown(undefined), '');
});
