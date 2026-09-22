import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect, userEvent, waitFor } from 'storybook/test';
import './sk-copy-field.js';

const COMMAND = 'npm run quality:all';
const EXACT = '  printf "naïve 🚀" | sed \'s/🚀/✓/\'\n  ';
const LONG =
  'spec-kitty implement copy-field-element-01M1Y3QH --work-package WP01 --verify-generated-artifacts-without-clipping-or-truncating-this-exact-command';

const frame = (content: unknown, light = false, width = '42rem') => html`<div
  class=${light ? 'sk-light' : ''}
  style=${`box-sizing:border-box;inline-size:${width};max-inline-size:100%;padding:var(--sk-space-6);background:var(--sk-surface-page);color:var(--sk-fg-body);`}
>${content}</div>`;

const field = (value = COMMAND, label = 'Copy quality command') => html`
  <sk-copy-field .value=${value} .label=${label}></sk-copy-field>
`;

const hostFrom = (canvasElement: HTMLElement): HTMLElement & { updateComplete: Promise<unknown> } =>
  canvasElement.querySelector('sk-copy-field') as HTMLElement & { updateComplete: Promise<unknown> };

const waitForStatus = async (host: HTMLElement, expected: string): Promise<void> => {
  await waitFor(() => {
    expect(host.shadowRoot!.querySelector('[part="status"]')).toHaveTextContent(expected);
  });
};

const withProperty = async (
  target: object,
  key: PropertyKey,
  descriptor: PropertyDescriptor,
  action: () => Promise<void>,
): Promise<void> => {
  const original = Object.getOwnPropertyDescriptor(target, key);
  Object.defineProperty(target, key, descriptor);
  try {
    await action();
  } finally {
    if (original) Object.defineProperty(target, key, original);
    else Reflect.deleteProperty(target, key);
  }
};

const withClipboard = (
  writeText: ((value: string) => Promise<void>) | undefined,
  action: () => Promise<void>,
): Promise<void> => withProperty(
  navigator,
  'clipboard',
  { configurable: true, value: writeText ? { writeText } : undefined },
  action,
);

const meta: Meta = {
  title: 'Elements/SkCopyField',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    a11y: { disable: false },
    docs: {
      description: {
        component: `A JavaScript-only, non-editable copy field. Inputs: \`value\`, \`label\`,
\`successMessage\`, \`manualMessage\`, and \`failureMessage\`. The displayed \`value\` is passed
to the asynchronous Clipboard API exactly, without trimming, parsing, or normalization. If that
write is unavailable or fails, the visible value is focused and selected once for manual copying;
selection failure is reported honestly. The \`sk-copy-field-result\` event bubbles, is composed,
is non-cancelable, and exposes only frozen \`{ outcome: 'copied' | 'manual' | 'failed' }\` detail.
Public parts: \`field\`, \`value\`, \`copy-control\`, and \`status\`. There is no static HTML form
because an inert Copy control would be misleading. Non-goals include editing, command execution,
validation, secret handling, retries, timers, global toasts, analytics, and a second button family.
Authored tokens: \`--sk-border-default\`, \`--sk-border-focus\`, \`--sk-border-width-1\`,
\`--sk-border-width-2\`, \`--sk-fg-body\`, \`--sk-fg-muted\`, \`--sk-font-mono\`,
\`--sk-font-sans\`, \`--sk-radius-md\`, \`--sk-space-2\`, \`--sk-space-3\`,
\`--sk-surface-input\`, \`--sk-text-sm\`.`,
      },
    },
  },
  render: () => frame(field()),
};

export default meta;
type Story = StoryObj;

export const Default: Story = {};

export const Hover: Story = {
  play: async ({ canvasElement }) => {
    const button = hostFrom(canvasElement).shadowRoot!.querySelector('button')!;
    await userEvent.hover(button);
  },
};

export const Focused: Story = {
  play: async ({ canvasElement }) => {
    (hostFrom(canvasElement).shadowRoot!.querySelector('button') as HTMLButtonElement).focus();
  },
};

export const Active: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Addressable native active-state surface. The browser test holds a trusted mouse press and asserts `:active` while the pointer remains down.',
      },
    },
  },
};

export const DisabledEmpty: Story = {
  render: () => frame(field('', 'Copy empty value')),
};

export const LongWrappingCommand: Story = {
  render: () => frame(field(LONG, 'Copy implementation command'), false, '20rem'),
};

export const QuotesAndUnicode: Story = {
  render: () => frame(field(EXACT, 'Copy quoted Unicode value')),
};

export const CopiedSuccess: Story = {
  play: async ({ canvasElement }) => {
    const writes: string[] = [];
    await withClipboard(async (value) => { writes.push(value); }, async () => {
      const host = hostFrom(canvasElement);
      (host.shadowRoot!.querySelector('button') as HTMLButtonElement).click();
      await waitForStatus(host, 'Value copied.');
      expect(writes).toEqual([
        host.shadowRoot!.querySelector('[part="value"]')!.textContent,
      ]);
    });
  },
};

export const ManualFallback: Story = {
  play: async ({ canvasElement }) => {
    await withProperty(
      globalThis,
      'isSecureContext',
      { configurable: true, value: false },
      async () => {
        const host = hostFrom(canvasElement);
        (host.shadowRoot!.querySelector('button') as HTMLButtonElement).click();
        await waitForStatus(host, 'Value selected. Use your system copy shortcut to copy it.');
      },
    );
  },
};

export const Failure: Story = {
  play: async ({ canvasElement }) => {
    await withProperty(
      globalThis,
      'isSecureContext',
      { configurable: true, value: false },
      async () => withProperty(
        globalThis,
        'getSelection',
        { configurable: true, value: () => null },
        async () => {
          const host = hostFrom(canvasElement);
          (host.shadowRoot!.querySelector('button') as HTMLButtonElement).click();
          await waitForStatus(host, 'Unable to copy or select the value.');
        },
      ),
    );
  },
};

export const RepeatedAndMultiple: Story = {
  render: () => frame(html`
    <div style="display:grid;gap:var(--sk-space-4);">
      <sk-copy-field value="same value" label="Copy repeated value"></sk-copy-field>
      <sk-copy-field value="second value" label="Copy secondary value"></sk-copy-field>
    </div>
  `),
  play: async ({ canvasElement }) => {
    const writes: string[] = [];
    await withClipboard(async (value) => { writes.push(value); }, async () => {
      const hosts = [...canvasElement.querySelectorAll('sk-copy-field')];
      for (const host of hosts) {
        const outcomes: string[] = [];
        host.addEventListener('sk-copy-field-result', (event) => {
          outcomes.push((event as CustomEvent<{ outcome: string }>).detail.outcome);
        });
        const button = host.shadowRoot!.querySelector('button') as HTMLButtonElement;
        for (let attempt = 1; attempt <= 2; attempt += 1) {
          button.click();
          await waitFor(() => expect(outcomes).toHaveLength(attempt));
          await waitForStatus(host, 'Value copied.');
        }
        expect(outcomes).toEqual(['copied', 'copied']);
      }
      expect(writes).toEqual(['same value', 'same value', 'second value', 'second value']);
    });
  },
};

export const Narrow: Story = {
  render: () => frame(field(LONG, 'Copy narrow implementation command'), false, '18rem'),
};

export const ForcedColors: Story = {
  render: () => frame(field('forced-colors copy result', 'Copy forced-colors result')),
  play: async ({ canvasElement }) => {
    const writes: string[] = [];
    await withClipboard(async (value) => { writes.push(value); }, async () => {
      const host = hostFrom(canvasElement);
      (host.shadowRoot!.querySelector('button') as HTMLButtonElement).click();
      await waitForStatus(host, 'Value copied.');
      expect(writes).toEqual(['forced-colors copy result']);
    });
  },
};

export const DefaultDark: Story = {};

export const LightMode: Story = {
  render: () => frame(field(), true),
};
