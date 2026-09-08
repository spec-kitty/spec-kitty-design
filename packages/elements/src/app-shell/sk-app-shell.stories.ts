import type { Meta, StoryObj } from '@storybook/web-components';
import './sk-app-shell.js';
import type { SkAppShell } from './sk-app-shell.js';

const storyFrameStyle = [
  'box-sizing: border-box',
  'min-height: 100vh',
  'color: var(--sk-fg-body)',
  'background: var(--sk-surface-page)',
  'font-family: var(--sk-font-sans)',
].join('; ');

const linkStyle = 'color: var(--sk-fg-default); font: inherit;';
const shellFixtureStyle = `
  <style>
    sk-app-shell::part(shell) { min-height: 100vh; }
  </style>`;

const composition = () => `
  <sk-app-shell>
    <nav slot="personal-rail" aria-label="Product areas">
      <a href="#work" style="${linkStyle}">Work</a>
      <a href="#settings" style="${linkStyle}">Settings</a>
    </nav>
    <aside slot="context-sidebar" aria-label="Current workspace">
      <a href="#overview" style="${linkStyle}">Overview</a>
      <a href="#activity" style="${linkStyle}">Activity</a>
    </aside>
    <header slot="page-header">
      <p>Workspace</p>
      <h1>Delivery overview</h1>
    </header>
    <section aria-label="Delivery summary"><p>Consumer-owned page content.</p></section>
  </sk-app-shell>`;

const responsiveComposition = (
  presentation: 'compact' | 'rail-preserving',
  open = false,
  longLabels = false,
) => `
  <sk-app-shell presentation="${presentation}"${open ? ' open' : ''}>
    <nav slot="personal-rail" aria-label="Product areas"><a href="#work" style="${linkStyle}">Work</a></nav>
    <aside slot="context-sidebar" aria-label="Current workspace"><a href="#overview" style="${linkStyle}">Overview</a></aside>
    <div slot="compact-header" style="display: flex; align-items: center; gap: var(--sk-space-3);">
      <button type="button" aria-expanded="${String(open)}" aria-controls="repository-navigation">
        <svg aria-hidden="true" focusable="false" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <line x1="2" y1="4" x2="14" y2="4"></line>
          <line x1="2" y1="8" x2="14" y2="8"></line>
          <line x1="2" y1="12" x2="14" y2="12"></line>
        </svg>
        <span>Menu</span>
      </button>
      <strong>Collaborative Demo Team</strong>
    </div>
    <nav slot="compact-navigation" id="repository-navigation" aria-label="Repository navigation" style="display: grid; gap: var(--sk-space-3);">
      <a href="#overview" style="${linkStyle}">Overview</a>
      <a href="#work" style="${linkStyle}">Work</a>
      <a href="#connectors" style="${linkStyle}">Connectors</a>
      <a href="#missions" style="${linkStyle}">${longLabels ? 'A deliberately long consumer-owned repository destination that wraps without truncation or horizontal page overflow' : 'Missions'}</a>
      ${longLabels ? `<a href="#charter" style="${linkStyle}">Charter and project governance</a>
      <a href="#glossary" style="${linkStyle}">Glossary and canonical terminology</a>
      <a href="#timeline" style="${linkStyle}">Timeline and exact commit evidence</a>
      <a href="#settings" style="${linkStyle}">Repository settings and integrations</a>` : ''}
    </nav>
    <header slot="page-header">
      <p>Repository dossier</p>
      <h1>Missions</h1>
      <p>Consumer-owned repository content remains the destination.</p>
    </header>
    <section aria-label="Mission summary"><p>Consumer-owned page content.</p></section>
  </sk-app-shell>`;

const storyFrame = (content: string, className = '') =>
  `<div${className ? ` class="${className}"` : ''} style="${storyFrameStyle}">${shellFixtureStyle}${content}</div>`;

const interactiveResponsiveFrame = (
  presentation: 'compact' | 'rail-preserving',
  open = false,
  width?: number,
  className = '',
  longLabels = false,
) => {
  const frame = document.createElement('div');
  frame.className = className;
  frame.style.cssText = `${storyFrameStyle};${width ? ` width: ${width}px; max-width: 100%;` : ''}`;
  frame.innerHTML = `${shellFixtureStyle}${responsiveComposition(presentation, open, longLabels)}`;
  const shell = frame.querySelector('sk-app-shell') as SkAppShell;
  const trigger = shell.querySelector<HTMLButtonElement>('[slot="compact-header"] button')!;
  shell.compactTrigger = trigger;
  const setOpen = (next: boolean) => {
    shell.open = next;
    trigger.setAttribute('aria-expanded', String(next));
  };
  trigger.addEventListener('click', () => setOpen(!shell.open));
  shell.addEventListener('sk-app-shell-dismiss', () => setOpen(false));
  shell.querySelector('[slot="compact-navigation"]')?.addEventListener('click', (event) => {
    if ((event.target as Element).closest('a')) setOpen(false);
  });
  return frame;
};

const interactiveCompactFrame = (
  open = false,
  width?: number,
  className = '',
  longLabels = false,
) => interactiveResponsiveFrame('compact', open, width, className, longLabels);

const interactiveRailPreservingFrame = (
  open = false,
  width?: number,
  className = '',
  longLabels = false,
) => interactiveResponsiveFrame('rail-preserving', open, width, className, longLabels);

const compactViewportOptions = {
  compactShort: {
    name: 'Compact short viewport',
    styles: { width: '390px', height: '320px' },
  },
  compactTall: {
    name: 'Compact tall viewport',
    styles: { width: '390px', height: '900px' },
  },
};

const railPreservingViewportOptions = {
  railPreservingShort: {
    name: 'Rail-preserving short viewport',
    styles: { width: '1024px', height: '320px' },
  },
  railPreservingTall: {
    name: 'Rail-preserving tall viewport',
    styles: { width: '1024px', height: '900px' },
  },
};

const meta: Meta = {
  title: 'Elements/SkAppShell',
  tags: ['autodocs'],
  parameters: { a11y: { disable: false }, layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj;

export const Default: Story = { render: () => storyFrame(composition()) };

export const DesktopComposition: Story = { render: () => storyFrame(composition()) };

export const Narrow: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  render: () => storyFrame(composition()),
};

export const CompactClosed: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  render: () => interactiveCompactFrame(false, 390),
};

export const CompactOpen: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  render: () => interactiveCompactFrame(true, 390),
};

export const Compact390: Story = { render: () => interactiveCompactFrame(true, 390) };
export const Compact768: Story = { render: () => interactiveCompactFrame(true, 768) };
export const Compact860: Story = { render: () => interactiveCompactFrame(true, 860) };
export const Compact861: Story = { render: () => interactiveCompactFrame(true, 861) };
export const CompactLongLabels: Story = { render: () => interactiveCompactFrame(true, 390, '', true) };
export const CompactShortViewport: Story = {
  globals: { viewport: { value: 'compactShort', isRotated: false } },
  parameters: { viewport: { options: compactViewportOptions } },
  render: () => interactiveCompactFrame(true, undefined, '', true),
};
export const CompactTallViewport: Story = {
  globals: { viewport: { value: 'compactTall', isRotated: false } },
  parameters: { viewport: { options: compactViewportOptions } },
  render: () => interactiveCompactFrame(true, undefined, '', true),
};
export const ReducedMotion: Story = { render: () => interactiveCompactFrame(true, 390) };
export const ForcedColors: Story = { render: () => interactiveCompactFrame(true, 390) };

export const RailPreservingClosed: Story = {
  render: () => interactiveRailPreservingFrame(false, 1024),
};
export const RailPreservingOpen: Story = {
  render: () => interactiveRailPreservingFrame(true, 1024),
};
export const RailPreserving390: Story = {
  render: () => interactiveRailPreservingFrame(true, 390),
};
export const RailPreserving768: Story = {
  render: () => interactiveRailPreservingFrame(true, 768),
};
export const RailPreserving1024: Story = {
  render: () => interactiveRailPreservingFrame(true, 1024),
};
export const RailPreserving1100: Story = {
  render: () => interactiveRailPreservingFrame(true, 1100),
};
export const RailPreserving1101: Story = {
  render: () => interactiveRailPreservingFrame(true, 1101),
};
export const RailPreservingWide: Story = {
  render: () => interactiveRailPreservingFrame(true, 1280),
};
export const RailPreservingLongLabels: Story = {
  render: () => interactiveRailPreservingFrame(true, 1024, '', true),
};
export const RailPreservingShortViewport: Story = {
  globals: { viewport: { value: 'railPreservingShort', isRotated: false } },
  parameters: { viewport: { options: railPreservingViewportOptions } },
  render: () => interactiveRailPreservingFrame(true, undefined, '', true),
};
export const RailPreservingTallViewport: Story = {
  globals: { viewport: { value: 'railPreservingTall', isRotated: false } },
  parameters: { viewport: { options: railPreservingViewportOptions } },
  render: () => interactiveRailPreservingFrame(true, undefined, '', true),
};
export const RailPreservingReducedMotion: Story = {
  render: () => interactiveRailPreservingFrame(true, 1024),
};
export const RailPreservingForcedColors: Story = {
  render: () => interactiveRailPreservingFrame(true, 1024),
};
export const RailPreservingLightMode: Story = {
  parameters: { backgrounds: { default: 'sk-light' } },
  render: () => interactiveRailPreservingFrame(true, 1024, 'sk-light'),
};

export const EmptyRegions: Story = {
  render: () => storyFrame(`
    <sk-app-shell>
      <p>The personal rail, context sidebar, and page header are intentionally empty.</p>
    </sk-app-shell>`),
};

export const LightMode: Story = {
  parameters: { backgrounds: { default: 'sk-light' } },
  render: () => interactiveCompactFrame(true, 390, 'sk-light'),
};
