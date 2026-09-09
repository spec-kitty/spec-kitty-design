import type { Meta, StoryObj } from '@storybook/web-components';
import './sk-action-row.js';
import '../button/sk-button.js';
import '../entity-marker/sk-entity-marker.js';
import '../pill-tag/sk-pill-tag.js';
import '../section-header/sk-section-header.js';
import '../status-indicator/sk-status-indicator.js';

const row = ({
  id = 'activity-17',
  selectable = true,
  selected = false,
  href = '',
  presentation = '',
  controls = '',
  title = 'team-landing-pivots',
  reference = 'spec-kitty/e2e-team-landing',
  metadata = '2 hours ago',
  marker = '<sk-entity-marker slot="marker" label="Spec Kitty repository">SP</sk-entity-marker>',
  supporting = '',
  tags = `
    <sk-pill-tag slot="tags">WP status changed</sk-pill-tag>
    <sk-status-indicator slot="tags" tone="success">Fresh</sk-status-indicator>
  `,
  extra = '',
}: {
  id?: string;
  selectable?: boolean;
  selected?: boolean;
  href?: string;
  presentation?: string;
  controls?: string;
  title?: string;
  reference?: string;
  metadata?: string;
  marker?: string;
  supporting?: string;
  tags?: string;
  extra?: string;
} = {}) => `
  <sk-action-row
    row-id="${id}"
    ${selectable ? 'selectable' : ''}
    ${selected ? 'selected' : ''}
    ${href ? `href="${href}"` : ''}
    ${presentation ? `presentation="${presentation}"` : ''}
    ${extra}
  >
    ${marker}
    <span slot="title">${title}</span>
    <code slot="reference">${reference}</code>
    ${tags}
    <time slot="metadata">${metadata}</time>
    ${supporting}
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
          'A controlled, consumer-composed row with static, selectable-button, and native-route modes; only selectable-button mode emits an activation request.',
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
    frame(`
      <sk-section-header>
        <span slot="eyebrow">Recent activity</span>
        <h2 slot="title">Consumer-owned feed</h2>
        <p slot="description">Two equal event projections remain two native list items.</p>
      </sk-section-header>
      ${list(`
        <li>${row({ id: 'native-one', title: 'Consumer-owned event' })}</li>
        <li>${row({ id: 'native-two', title: 'Consumer-owned event' })}</li>
      `)}
    `),
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
      `<div style="display:grid;gap:var(--sk-space-4);">
        ${row({
          extra: 'data-with-controls="true"',
          supporting: '<span slot="supporting">Consumer-supplied supporting context</span>',
          controls: `
            <a slot="controls" href="#details" data-native-link style="color:var(--sk-fg-default);">Details</a>
            <button slot="controls" type="button" data-native-button>Pin</button>
            <sk-button slot="controls" size="sm" data-sk-button>Inspect</sk-button>
          `,
        })}
        ${row({
          id: 'activity-route-controls',
          selectable: false,
          href: '#activity-route-controls',
          presentation: 'flush',
          title: 'Native route with independent controls',
          extra: 'data-route-controls="true"',
          controls: `
            <button slot="controls" type="button">Pin route</button>
          `,
        })}
      </div>`,
    ),
};

export const Route: Story = {
  render: () => frame(row({ selectable: false, href: '#activity-17' })),
};

export const RouteFlush: Story = {
  render: () => frame(row({ selectable: false, href: '#activity-17', presentation: 'flush' })),
};

export const ButtonFlush: Story = {
  render: () => frame(row({ presentation: 'flush' })),
};

export const SelectedFlush: Story = {
  render: () =>
    frame(`
      <div style="display:grid;gap:var(--sk-space-4);">
        <div>
          <p style="margin:0 0 var(--sk-space-2);color:var(--sk-fg-muted);">Selected, flush</p>
          ${row({ id: 'selected-flush', selected: true, presentation: 'flush' })}
        </div>
        <div>
          <p style="margin:0 0 var(--sk-space-2);color:var(--sk-fg-muted);">Not selected, flush</p>
          ${row({ id: 'button-flush-comparison', presentation: 'flush' })}
        </div>
      </div>
    `),
};

export const RouteSelected: Story = {
  render: () => frame(row({ selectable: false, selected: true, href: '#activity-17' })),
};

export const UnknownPresentation: Story = {
  parameters: {
    docs: {
      description: {
        story: 'An unsupported presentation value warns once and falls back to the bordered row.',
      },
    },
  },
  render: () => frame(row({ presentation: 'unknown-presentation' })),
};

export const ForcedColors: Story = {
  render: () =>
    frame(`
      <div data-forced-colors-comparison style="display:grid;gap:var(--sk-space-4);">
        <div>
          <p style="margin:0 0 var(--sk-space-2);color:var(--sk-fg-muted);">Selected, bordered</p>
          ${row({ id: 'forced-colors-bordered', selected: true })}
        </div>
        <div>
          <p style="margin:0 0 var(--sk-space-2);color:var(--sk-fg-muted);">Selected, flush</p>
          ${row({ id: 'forced-colors-flush', selected: true, presentation: 'flush' })}
        </div>
        <div>
          <p style="margin:0 0 var(--sk-space-2);color:var(--sk-fg-muted);">Route, flush</p>
          ${row({
            id: 'forced-colors-route-flush',
            selectable: false,
            href: '#forced-colors-route-flush',
            presentation: 'flush',
            extra: 'data-forced-colors-route-flush="true"',
          })}
        </div>
      </div>
    `),
};

export const LongContent: Story = {
  parameters: { layout: 'fullscreen' },
  render: () => `
    <div style="box-sizing:border-box;width:min(320px,100vw);background:var(--sk-surface-page);">
      ${row({
        id: 'long-content',
        title: 'A deliberately long consumer-owned activity title remains readable',
        reference: 'spec-kitty/a-very-long-unbroken-reference-without-a-natural-break-point',
        metadata: '2 hours ago',
        tags: `
          <sk-pill-tag slot="tags">WP status changed</sk-pill-tag>
          <sk-pill-tag slot="tags" variant="purple">Presence unverified</sk-pill-tag>
          <sk-pill-tag slot="tags" variant="green">Fresh</sk-pill-tag>
          <sk-status-indicator slot="tags" tone="success">Available</sk-status-indicator>
        `,
        extra: 'data-long-content="true"',
        controls: '<button slot="controls" type="button">Inspect evidence</button>',
      })}
    </div>
  `,
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

export const CardStates: Story = {
  render: () =>
    frame(
      list(`
        <li>${row({ extra: 'layout="card"', supporting: '<span slot="supporting">Claimed by Mia · live signal supplied by the consumer</span>' })}</li>
        <li>${row({ id: 'card-selected', selected: true, extra: 'layout="card"', supporting: '<span slot="supporting">Claimed by Ada · stale status supplied by the consumer</span>' })}</li>
        <li>${row({ id: 'card-static', selectable: false, marker: '', tags: '', extra: 'layout="card"' })}</li>
        <li>${row({ id: 'card-controls', extra: 'layout="card"', controls: '<button slot="controls" type="button">Inspect</button>' })}</li>
      `),
    ),
};

export const CardLongContent: Story = {
  parameters: { layout: 'fullscreen' },
  render: () => `
    <div style="box-sizing:border-box;width:calc(var(--sk-space-12) * 2);background:var(--sk-surface-page);">
      ${row({
        id: 'card-long-content',
        title: 'A deliberately long consumer-owned compact work-item title remains readable',
        reference: 'spec-kitty/a-very-long-unbroken-reference-without-a-natural-break-point',
        supporting: '<span slot="supporting">Claimed by a consumer whose complete supporting line can wrap naturally</span>',
        extra: 'layout="card" data-card-long-content="true"',
      })}
    </div>
  `,
};

const t10CompactItem = () =>
  row({
    id: 't10-compact-item',
    title: 'Review compact Work Package extensions',
    reference: 'WP01 · action-row and status presentation',
    marker: '<sk-entity-marker slot="marker" label="Mia" size="sm" shape="circle">MI</sk-entity-marker>',
    tags: '<sk-status-indicator slot="tags" tone="success" pulsing><span slot="marker">●</span>Live claim</sk-status-indicator>',
    supporting: '<span slot="supporting">Claimed by Mia · evidence supplied by the application</span>',
    controls: '<button slot="controls" type="button">Review</button>',
    extra: 'layout="card" data-t10-compact-item="true"',
  });

export const T10CompactItem: Story = {
  render: () => frame(t10CompactItem()),
};

export const T10CompactItemLightMode: Story = {
  parameters: { backgrounds: { default: 'sk-light' }, a11y: { disable: false } },
  render: () => frame(t10CompactItem(), true),
};

export const LightMode: Story = {
  parameters: {
    backgrounds: { default: 'sk-light' },
    a11y: { disable: false },
  },
  render: () => `${frame(row({ extra: 'data-light-mode="true"' }), true)}
    ${frame(
      row({
        id: 'activity-light-route-flush',
        selectable: false,
        href: '#activity-light-route-flush',
        presentation: 'flush',
        extra: 'data-light-route-flush="true"',
      }),
      true,
    )}`,
};
