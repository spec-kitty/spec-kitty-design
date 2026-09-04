import '../pill-tag/sk-pill-tag.css';
import './sk-card.css';
import type { Meta, StoryObj } from '@storybook/web-components';
import { SkCardHTML, SkCardBlueHTML, SkCardPurpleHTML, SkCardInsetHTML } from './index';

/**
 * Renders from the GENERATED exports, not from hand-written markup.
 *
 * These stories were the fourth of the four places card markup lived, and #72's own
 * docstring named them — nine `<article class="sk-card…">` literals survived a commit
 * claiming "card markup authored exactly once". A pre-merge lens counted them.
 *
 * Converting them does two things: it makes that claim true, and it gives the generated
 * SkCard*HTML exports their first consumer. They had none, which is why a generator defect
 * that emitted `SkCardPurpleHTML` with no purple class went unnoticed.
 *
 * `wrap()` adds only presentation the story needs — width and text colour — never structure
 * or classes. Structure comes from the generated constant.
 *
 * It THROWS when the marker is absent, because `String.replace` with a string pattern
 * returns its input UNCHANGED on no match. Two likely shape changes hit that silently:
 * renaming the default content, and padding it the way the generator already pads the
 * `.html` artifact but not `index.ts`. Either would strip `max-width` from every card
 * story with no error, and a story chaining a second `wrap()` would drop its whole body.
 * axe cannot see a missing `max-width`; a build failure is the only signal available.
 */
const MARKER = '>Card content<';
const wrap = (markup: string, body: string) => {
  if (!markup.includes(MARKER)) {
    throw new Error(
      `sk-card story: generated markup no longer contains ${JSON.stringify(MARKER)} — ` +
        `wrap() would have silently returned it unchanged. Update the marker alongside ` +
        `cardStaticHtml()'s default content.`,
    );
  }
  return markup.replace(
    MARKER,
    ` style="max-width:360px"><p style="color:var(--sk-fg-default);margin:0">${body}</p><`,
  );
};

const meta: Meta = {
  title: 'Components/Card',
  parameters: { a11y: { disable: false } },
};
export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => wrap(SkCardHTML, 'Default card content'),
};

export const Blue: Story = {
  parameters: {
    docs: {
      description: {
        story: "Hover to see the accent border activate on all 4 sides. The border is always 2px — only the colour changes, so there is no layout shift.",
      },
    },
  },
  render: () => wrap(SkCardBlueHTML, 'Blue tint card — information context. Hover to see full accent border.'),
};

export const Purple: Story = {
  parameters: {
    docs: {
      description: {
        story: "Same no-jump border technique as Blue — 2px border always present, accent colour transitions on hover.",
      },
    },
  },
  render: () => wrap(SkCardPurpleHTML, 'Purple tint card — feature context. Hover to see full accent border.'),
};

export const Inset: Story = {
  render: () => wrap(SkCardInsetHTML, 'Inset card — nested content'),
};

export const BlogCardExample: Story = {
  render: () => wrap(SkCardHTML, '').replace('<p style="color:var(--sk-fg-default);margin:0"></p>', `
      <div style="display:flex;gap:var(--sk-space-2);margin-bottom:var(--sk-space-4)">
        <span class="sk-pill-tag sk-pill-tag--green">Release</span>
        <span class="sk-pill-tag">v3.2.0</span>
      </div>
      <h3 style="font-family:var(--sk-font-display);font-size:var(--sk-text-xl);font-weight:var(--sk-weight-bold);color:var(--sk-fg-default);margin:0 0 var(--sk-space-3)">
        Spec Kitty 3.2 ships with org-layer doctrine
      </h3>
      <p style="font-size:var(--sk-text-sm);color:var(--sk-fg-muted);line-height:1.55;margin:0 0 var(--sk-space-4)">
        The new org-level DRG allows teams to publish proprietary governance
        without forking the CLI.
      </p>
      <a href="#" style="font-size:var(--sk-text-sm);color:var(--sk-color-yellow);text-decoration:none">Read the post →</a>
  `),
};

export const LightMode: Story = {
  parameters: { backgrounds: { default: 'sk-light' } },
  render: () => `
    <div class="sk-light" style="background: var(--sk-surface-page); padding: var(--sk-space-6); display: flex; gap: var(--sk-space-4); flex-wrap: wrap;">
      ${wrap(SkCardHTML, 'Default')}
      ${wrap(SkCardBlueHTML, 'Blue')}
      ${wrap(SkCardPurpleHTML, 'Purple')}
      ${wrap(SkCardInsetHTML, 'Inset')}
    </div>
  `,
};
