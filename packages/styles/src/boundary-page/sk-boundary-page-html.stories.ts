import './sk-boundary-page.css';
// The composed status pill is authored as the STYLES-LAYER span form
// (`<span class="sk-pill-tag sk-pill-tag--status-<tone>">`), not the `<sk-pill-tag>` custom
// element — see sk-boundary-page.css's own header comment. A styles-layer class needs its
// stylesheet loaded wherever it is used; unlike sk-entity-marker (composed as the real custom
// element, which carries its own shadow CSS), sk-pill-tag's document-form classes have no
// shadow root to bring the rules along, so this import is required for the composed pill to
// render any tone at all. This is an intra-project import (both files belong to the single nx
// `styles` project, tag `scope:styles`), not a cross-project one, so it is not constrained by
// `@nx/enforce-module-boundaries`'s `scope:styles` -> `scope:tokens`-only rule.
import '../pill-tag/sk-pill-tag.css';
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
 * apps/storybook/src/tests/sk-boundary-page-responsive.spec.ts's 'sk-boundary-page theming'
 * describe block verifies a computed value (card background, title color) genuinely differs
 * between this and Default rather than assuming the class does something.
 */
export const LightMode: Story = {
  parameters: { backgrounds: { default: 'sk-light' } },
  render: () => `<div class="sk-light">${SkBoundaryPageFormCardHTML}</div>`,
};
