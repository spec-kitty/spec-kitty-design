import type { Meta, StoryObj } from '@storybook/web-components';
import './sk-action-row.js';
import '../button/sk-button.js';
import '../entity-marker/sk-entity-marker.js';
import '../pill-tag/sk-pill-tag.js';
import '../status-indicator/sk-status-indicator.js';

const row = ({
  id = 'activity-17',
  selectable = true,
  selected = false,
  controls = '',
  title = 'team-landing-pivots',
  reference = 'spec-kitty/e2e-team-landing',
  metadata = '2 hours ago',
  extra = '',
}: {
  id?: string;
  selectable?: boolean;
  selected?: boolean;
  controls?: string;
  title?: string;
  reference?: string;
  metadata?: string;
  extra?: string;
} = {}) => `
  <sk-action-row
    row-id="${id}"
    ${selectable ? 'selectable' : ''}
    ${selected ? 'selected' : ''}
    ${extra}
  >
    <sk-entity-marker slot="marker" label="Spec Kitty repository">SP</sk-entity-marker>
    <span slot="title">${title}</span>
    <code slot="reference">${reference}</code>
    <sk-pill-tag slot="tags">WP status changed</sk-pill-tag>
    <sk-status-indicator slot="tags" tone="success">Fresh</sk-status-indicator>
    <time slot="metadata">${metadata}</time>
    ${controls}
  </sk-action-row>
`;

const frame = (body: string, light = false) => `
  <div${light ? ' class="sk-light"' : ''} style="width:min(960px,calc(100vw - var(--sk-space-12)));background:var(--sk-surface-page);padding:var(--sk-space-6);">
    ${body}
  </div>
`;

const list = (body: string) => `
  <ul style="list-style:none;margin:0;padding:0;display:grid;gap:var(--sk-space-2);">
    ${body}
  </ul>
`;

const meta: Meta = {
  title: 'Elements/SkActionRow',
  tags: ['autodocs'],
  parameters: {
    a11y: { disable: false },
    docs: {
      description: {
        component:
          'A controlled, consumer-composed row that emits one activation request while native list and application behavior remain outside the element.',
      },
    },
  },
  render: () => frame(row()),
};

export default meta;
type Story = StoryObj;

export const Default: Story = {};

export const NativeList: Story = {
  render: () =>
    frame(
      list(`
    <li>${row({ id: 'native-one', title: 'First consumer-owned item' })}</li>
    <li>${row({ id: 'native-two', title: 'Second consumer-owned item', metadata: '1 day ago' })}</li>
  `),
    ),
};

export const Selected: Story = {
  render: () => frame(row({ selected: true, extra: 'data-selected-example="true"' })),
};

export const NonSelectable: Story = {
  render: () =>
    frame(
      row({
        selectable: false,
        selected: true,
        extra: 'data-non-selectable="true"',
      }),
    ),
};

export const WithControls: Story = {
  render: () =>
    frame(
      row({
        extra: 'data-with-controls="true"',
        controls: `
      <a slot="controls" href="#details" data-native-link style="color:var(--sk-fg-default);">Details</a>
      <button slot="controls" type="button" data-native-button>Pin</button>
      <sk-button slot="controls" size="sm" data-sk-button>Inspect</sk-button>
    `,
      }),
    ),
};

export const LongContent: Story = {
  render: () =>
    frame(`
    <div style="width:320px;max-width:100%;">
      ${row({
        id: 'long-content',
        title: 'A deliberately long consumer-owned activity title remains readable',
        reference: 'spec-kitty/a-very-long-unbroken-reference-without-a-natural-break-point',
        metadata: '2 hours ago',
        extra: 'data-long-content="true"',
        controls: '<button slot="controls" type="button">Inspect evidence</button>',
      })}
    </div>
  `),
};

export const SelectableStates: Story = {
  render: () =>
    frame(
      list(`
    <li>${row({ id: 'state-rest', extra: 'data-state-rest="true"' })}</li>
    <li>${row({ id: 'state-selected', selected: true, extra: 'data-state-selected="true"' })}</li>
    <li>${row({ id: 'state-static', selectable: false, extra: 'data-state-static="true"' })}</li>
  `),
    ),
};

export const LightMode: Story = {
  parameters: {
    backgrounds: { default: 'sk-light' },
    a11y: { disable: false },
  },
  render: () => frame(row({ extra: 'data-light-mode="true"' }), true),
};
