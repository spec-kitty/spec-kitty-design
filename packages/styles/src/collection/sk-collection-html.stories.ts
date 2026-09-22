import './sk-collection.css';
import '../card/sk-card.css';
import { SkCardStatusDangerHTML } from '../card';
import {
  SkCollectionClosedHTML,
  SkCollectionEmptyHTML,
  SkCollectionFiftyItemsHTML,
  SkCollectionLongTextHTML,
  SkCollectionNoCountHTML,
  SkCollectionNoFooterHTML,
  SkCollectionOneItemHTML,
  SkCollectionOpenHTML,
} from './index';
import type { Meta, StoryObj } from '@storybook/web-components';

const COLLECTION_HEADING_MARKER = '>Sample collection<';
const CARD_CONTENT_MARKER = '>Card content<';

const withHeading = (markup: string, heading: string) => {
  if (!markup.includes(COLLECTION_HEADING_MARKER)) {
    throw new Error(
      `sk-collection story: generated markup no longer contains ` +
        `${JSON.stringify(COLLECTION_HEADING_MARKER)} — withHeading() would have silently ` +
        `returned it unchanged. Update the marker alongside sk-collection-open.html.`,
    );
  }
  return markup.replace(COLLECTION_HEADING_MARKER, `>${heading}<`);
};

const inDangerCard = (collection: string) => {
  if (!SkCardStatusDangerHTML.includes(CARD_CONTENT_MARKER)) {
    throw new Error(
      `sk-collection story: SkCardStatusDangerHTML no longer contains ` +
        `${JSON.stringify(CARD_CONTENT_MARKER)} — inDangerCard() would have silently ` +
        `returned it unchanged. Update the marker alongside the generated card markup.`,
    );
  }
  return SkCardStatusDangerHTML.replace(CARD_CONTENT_MARKER, `>${collection}<`);
};

const blockedCollection = () => inDangerCard(withHeading(SkCollectionOpenHTML, 'Blocked'));

const lightFrame = (markup: string) => `
  <div class="sk-light" style="background: var(--sk-surface-page); padding: var(--sk-space-6); display: inline-block; width: 100%;">
    ${markup}
  </div>
`;

const wireToggle = (canvasElement: HTMLElement) => {
  const toggle = canvasElement.querySelector<HTMLButtonElement>('.sk-collection__toggle');
  const stateLabel = toggle?.querySelector<HTMLElement>('.sk-collection__state-label');
  const bodyId = toggle?.getAttribute('aria-controls');
  const body = bodyId ? canvasElement.querySelector<HTMLElement>(`#${bodyId}`) : null;
  if (!toggle || !stateLabel || !body) {
    throw new Error('sk-collection story: toggle, state label, and controlled body must resolve');
  }
  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(expanded));
    body.hidden = !expanded;
    stateLabel.textContent = expanded ? 'Collapse collection' : 'Expand collection';
  });
};

const meta: Meta = {
  title: 'Primitives/SkCollection (HTML)',
  tags: ['autodocs'],
  parameters: { a11y: { disable: false } },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => SkCollectionOpenHTML,
  play: async ({ canvasElement }) => wireToggle(canvasElement),
};

export const Closed: Story = { render: () => SkCollectionClosedHTML };
export const OneItem: Story = { render: () => SkCollectionOneItemHTML };
export const FiftyItems: Story = { render: () => SkCollectionFiftyItemsHTML };
export const Empty: Story = { render: () => SkCollectionEmptyHTML };
export const NoCount: Story = { render: () => SkCollectionNoCountHTML };
export const NoFooter: Story = { render: () => SkCollectionNoFooterHTML };
export const LongText: Story = { render: () => SkCollectionLongTextHTML };

export const Narrow: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  render: () => SkCollectionLongTextHTML,
};

export const ForcedColors: Story = { render: () => SkCollectionOpenHTML };
export const Blocked: Story = { render: () => blockedCollection() };
export const BlockedLightMode: Story = { render: () => lightFrame(blockedCollection()) };
export const BlockedForcedColors: Story = { render: () => blockedCollection() };

export const LightMode: Story = {
  parameters: { backgrounds: { default: 'sk-light' } },
  render: () => lightFrame(SkCollectionOpenHTML),
};
