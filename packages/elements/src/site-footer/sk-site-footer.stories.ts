import type { Meta, StoryObj } from '@storybook/web-components';
import './sk-site-footer.js';
import documentSheet from './sk-site-footer.css.js';

// THE ANCHOR'S COLOUR, and nothing else, needs this. Under the #77 ruling the element owns the
// structure, so the grid, headings, lists, divider and legal line are all shadow nodes styled by
// the adopted sheet — and the slotted `<li>` is reachable via `::slotted(li)` because it is
// DIRECTLY assigned. The `<a>` inside each `<li>` is one level deeper, so it keeps its light-DOM
// class from this same sheet loaded in the document. The ruling names that trade explicitly.
//
// This is a far smaller obligation than the design it replaced, where whole columns were slotted
// and the headings and lists were unreachable too. Not a bare `.css` import: `check-no-css-in-source`
// requires a constructed sheet here (FR-009, ADR-10 §1), and the generated module is one. Do not
// spell the rejected import form literally in a comment — the gate greps the file, not the syntax
// tree, and quoting it fails the gate on the comment explaining the fix.
if (!document.adoptedStyleSheets.includes(documentSheet)) {
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, documentSheet];
}

/**
 * <sk-site-footer> — the ELEMENT.
 *
 * The shape is the operator's ruling on #77: the element owns the structure — the grid, the
 * <nav>s, the headings, the <ul>s, the divider and the legal line — and text arrives as
 * PROPERTIES. Only the link ITEMS are slotted, as <li> elements that land directly inside the
 * element's own <ul>, so `::slotted(li)` reaches them.
 *
 * NO DOCUMENT STYLESHEET IS NEEDED FOR THE STRUCTURE. An earlier revision of this component
 * slotted whole columns, which put the headings and lists out of `::slotted()`'s reach and made
 * a document sheet mandatory just to render legibly — axe caught that as a real contrast
 * violation. Under the ruling the only thing still document-styled is the `<a>` inside each
 * `<li>`, which is why these stories carry `class="sk-site-footer__link"` on the anchors.
 */
const meta: Meta = {
  title: 'Elements/SkSiteFooter',
  tags: ['autodocs'],
  parameters: { a11y: { disable: false }, layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj;

const items = (labels: readonly [string, string], slot: string) =>
  labels
    .map(
      (l) =>
        `<li slot="${slot}"><a href="#" class="sk-site-footer__link">${l}</a></li>`,
    )
    .join('');

const footer = () => `
  <sk-site-footer
    wordmark="Your Brand"
    tagline="One sentence on what you do."
    headingone="Product"
    headingtwo="Connect"
    legal="© YYYY Your Company. All rights reserved."
  >
    ${items(['Platform', 'Docs'], 'column-one')}
    ${items(['Contact', 'GitHub'], 'column-two')}
  </sk-site-footer>
`;

export const Default: Story = { render: footer };

/**
 * No `legal` — the divider above it is not rendered either.
 *
 * The element reads the property synchronously during render, so there is no frame in which the
 * separator is drawn over nothing and no second update after `updateComplete` resolves.
 */
export const WithoutLegal: Story = {
  render: () => `
    <sk-site-footer wordmark="Your Brand" headingone="Product" headingtwo="Connect">
      ${items(['Platform', 'Docs'], 'column-one')}
      ${items(['Contact', 'GitHub'], 'column-two')}
    </sk-site-footer>
  `,
};

/** `class="sk-light"`, NOT `data-theme="light"` — the attribute form activates nothing (#93). */
export const LightMode: Story = {
  parameters: { backgrounds: { default: 'sk-light' }, layout: 'fullscreen' },
  render: () => `
    <div class="sk-light" style="background: var(--sk-surface-page); display: block; width: 100%;">
      ${footer()}
    </div>
  `,
};
