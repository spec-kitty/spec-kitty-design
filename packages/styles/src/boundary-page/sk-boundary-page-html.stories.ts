import './sk-boundary-page.css';
import type { Meta, StoryObj } from '@storybook/web-components';
import {
  SkBoundaryPageForcedColorsHTML,
  SkBoundaryPageFormCardHTML,
  SkBoundaryPageLongEmailHTML,
  SkBoundaryPageLongIdentifierHTML,
  SkBoundaryPageNoActionHTML,
  SkBoundaryPageSeveralActionsHTML,
  SkBoundaryPageTerminalCardHTML,
  SkBoundaryPageWithFootnoteHTML,
  SkBoundaryPageWithoutFootnoteHTML,
  SkBoundaryPageWithoutMarkHTML,
} from './index';

// Closest existing taxonomy root per CLAUDE.md §6 ("pick the closest existing root:
// Components/, Form/, Navigation/, Primitives/, Tags/, Tokens/ — don't invent new top-level
// groups without a reason"). This frame is a page-level composed pattern, the same family as
// sk-feature-card/sk-ribbon-card, so it goes under Components/, not a new "Patterns/" root.
const meta: Meta = {
  title: 'Components/SkBoundaryPage (HTML)',
  tags: ['autodocs'],
  parameters: { a11y: { disable: false }, layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => SkBoundaryPageFormCardHTML,
};

export const FormCard: Story = {
  render: () => SkBoundaryPageFormCardHTML,
};

export const TerminalCard: Story = {
  render: () => SkBoundaryPageTerminalCardHTML,
};

export const WithoutMark: Story = {
  render: () => SkBoundaryPageWithoutMarkHTML,
};

export const WithoutFootnote: Story = {
  render: () => SkBoundaryPageWithoutFootnoteHTML,
};

export const WithFootnote: Story = {
  render: () => SkBoundaryPageWithFootnoteHTML,
};

export const SeveralActions: Story = {
  render: () => SkBoundaryPageSeveralActionsHTML,
};

export const NoAction: Story = {
  render: () => SkBoundaryPageNoActionHTML,
};

export const LongIdentifier: Story = {
  render: () => SkBoundaryPageLongIdentifierHTML,
};

export const LongEmail: Story = {
  render: () => SkBoundaryPageLongEmailHTML,
};

export const ForcedColors: Story = {
  render: () => SkBoundaryPageForcedColorsHTML,
};

/**
 * Rendered from the GENERATED FormCard export, wrapped in `class="sk-light"` — never
 * `data-theme="light"`, which activates nothing on a wrapper (CLAUDE.md §6, #93).
 * apps/storybook/src/tests/sk-boundary-page-responsive.spec.ts verifies a computed value
 * genuinely differs between this and Default rather than assuming the class does something.
 */
export const LightMode: Story = {
  parameters: { backgrounds: { default: 'sk-light' } },
  render: () => `<div class="sk-light">${SkBoundaryPageFormCardHTML}</div>`,
};
