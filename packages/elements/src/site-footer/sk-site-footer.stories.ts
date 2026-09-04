import type { Meta, StoryObj } from '@storybook/web-components';
import './sk-site-footer.js';
// THE DOCUMENT SHEET, because this story slots NESTED markup and a real consumer would.
// `::slotted()` reaches only DIRECTLY assigned children, so the adopted sheet styles the column
// boxes and nothing inside them. Without this import the slotted links fall back to the UA's
// `-webkit-link` blue, which axe measured at a genuine contrast violation on the dark page —
// found by the gate, not reasoned about. sk-nav-pill does not need this because its consumers
// slot the anchors DIRECTLY, so its ::slotted() rules match them.
import '../../../styles/src/site-footer/sk-site-footer.css';

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
