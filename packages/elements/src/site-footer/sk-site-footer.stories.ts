import type { Meta, StoryObj } from '@storybook/web-components';
import './sk-site-footer.js';
// THE SAME SHEET, ADOPTED INTO THE DOCUMENT — not a bare `.css` import.
//
// This story slots NESTED markup, and `::slotted()` reaches only DIRECTLY assigned children, so
// the shadow-adopted sheet styles the column boxes and nothing inside them. Without the sheet in
// the document the slotted links fall back to the UA's `-webkit-link` blue, which axe measured
// as a genuine contrast violation on the dark page — found by the gate, not reasoned about.
// sk-nav-pill needs none of this because its consumers slot the anchors DIRECTLY, so its
// `::slotted()` rules match them.
//
// The first attempt used a bare stylesheet import of the styles-layer file, which trips
// `check-no-css-in-source` — an ENFORCED gate whose whole point is that
// `packages/elements` ships CONSTRUCTED stylesheets, never bundler-specific CSS imports
// (FR-009, ADR-10 §1). A lens caught it, and caught that the "static gates green" claim had been
// measured BEFORE the import was added and never re-run. Adopting the generated module is both
// gate-clean and closer to what a consumer does: it is the identical sheet the element adopts,
// placed where slotted light-DOM content can see it.
import documentSheet from './sk-site-footer.css.js';

if (!document.adoptedStyleSheets.includes(documentSheet)) {
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, documentSheet];
}

/**
 * <sk-site-footer> — the ELEMENT.
 *
 * The component owns the grid, the divider and the spacing. Everything a reader sees is the
 * consumer's, supplied through three slots — which is #77's content-as-property direction applied
 * to a component whose content is almost entirely site-specific.
 *
 * SLOTTED CONTENT IS LIGHT DOM, so it renders before the element upgrades. That is why slots were
 * chosen over an array property here: a `.columns` property could not carry an attribute, and the
 * wrapper generator's own guard says a field with no observed attribute cannot reach the element
 * on a React first render — which for a full-width footer is a visible layout shift.
 */
const meta: Meta = {
  title: 'Elements/SkSiteFooter',
  tags: ['autodocs'],
  parameters: { a11y: { disable: false }, layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj;

const columns = () => `
  <nav class="sk-site-footer__column" aria-label="Product links">
    <div class="sk-site-footer__heading">Product</div>
    <ul class="sk-site-footer__links">
      <li><a href="#" class="sk-site-footer__link">Platform</a></li>
      <li><a href="#" class="sk-site-footer__link">Docs</a></li>
    </ul>
  </nav>
  <nav class="sk-site-footer__column" aria-label="Connect links">
    <div class="sk-site-footer__heading">Connect</div>
    <ul class="sk-site-footer__links">
      <li><a href="#" class="sk-site-footer__link">Contact</a></li>
      <li><a href="#" class="sk-site-footer__link">GitHub</a></li>
    </ul>
  </nav>
`;

const footer = () => `
  <sk-site-footer>
    <div slot="brand" class="sk-site-footer__column">
      <div class="sk-site-footer__brand"><span class="sk-site-footer__wordmark">Your Brand</span></div>
      <p class="sk-site-footer__tagline">One sentence on what you do.</p>
    </div>
    ${columns()}
    <span slot="legal">© 2026 Your Company. All rights reserved.</span>
  </sk-site-footer>
`;

export const Default: Story = { render: footer };

/** `class="sk-light"`, NOT `data-theme="light"` — the attribute form activates nothing (#93). */
export const LightMode: Story = {
  parameters: { backgrounds: { default: 'sk-light' }, layout: 'fullscreen' },
  render: () => `
    <div class="sk-light" style="background: var(--sk-surface-page); display: block; width: 100%; padding: 0 var(--sk-space-7);">
      ${footer()}
    </div>
  `,
};

// NOTE FOR THE NEXT READER: do not spell the rejected import form literally in a comment here.
// The gate greps the file, not the syntax tree, so quoting the bad statement in prose fails the
// gate on the comment that explains the fix — which is exactly what happened, and is the same
// shape as #143's `::part(tag)` comment defeating the ratchet it was describing.
