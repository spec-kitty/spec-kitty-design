import type { Meta, StoryObj } from '@storybook/web-components';
import './sk-evidence-chain.js';
import '../card/sk-card.js';
import '../grid/sk-grid.js';
import type { EvidenceStage, SkEvidenceChain } from './sk-evidence-chain.js';

const genericStages = Object.freeze([
  Object.freeze({ id: 'received', label: 'Items received', displayValue: '128' }),
  Object.freeze({
    id: 'reviewed',
    label: 'Items reviewed',
    displayValue: '91%',
    annotation: 'Sampled',
  }),
  Object.freeze({
    id: 'accepted',
    label: 'Items accepted',
    displayValue: '84',
    annotation: 'Within range',
  }),
  Object.freeze({
    id: 'remaining',
    label: 'Items remaining',
    displayValue: 'pending / unknown',
  }),
] satisfies ReadonlyArray<EvidenceStage>);

const twoStages = Object.freeze(genericStages.slice(0, 2));
const sixStages = Object.freeze([
  ...genericStages,
  Object.freeze({ id: 'archived', label: 'Items archived', displayValue: '72' }),
  Object.freeze({ id: 'reported', label: 'Items reported', displayValue: '68' }),
] satisfies ReadonlyArray<EvidenceStage>);

const createChain = (stages: unknown): SkEvidenceChain => {
  const element = document.createElement('sk-evidence-chain') as SkEvidenceChain;
  element.stages = stages as ReadonlyArray<EvidenceStage>;
  return element;
};

const meta: Meta = {
  title: 'Elements/SkEvidenceChain',
  tags: ['autodocs'],
  parameters: { a11y: { disable: false } },
  render: () => createChain(genericStages),
};

export default meta;
type Story = StoryObj;

export const Default: Story = {};

export const ApprovedExample: Story = {
  render: () => {
    const stages = Object.freeze([
      Object.freeze({
        id: 'investment',
        label: 'Investment',
        displayValue: '€1,840',
        annotation: '€166 unattributed',
        tone: 'info',
      }),
      Object.freeze({
        id: 'completed',
        label: 'Completed',
        displayValue: '42 WPs',
        annotation: '34 first pass',
        tone: 'success',
      }),
      Object.freeze({
        id: 'deployed',
        label: 'Deployed',
        displayValue: '6 missions',
        annotation: 'Production evidence',
        tone: 'success',
      }),
      Object.freeze({
        id: 'verified',
        label: 'Verified',
        displayValue: '2 outcomes',
        annotation: '4 awaiting evidence',
        tone: 'neutral',
      }),
    ] satisfies ReadonlyArray<EvidenceStage>);
    const grid = document.createElement('sk-grid');
    grid.setAttribute('gap', '4');
    const card = document.createElement('sk-card');
    card.append(createChain(stages));
    grid.append(card);
    return grid;
  },
};

export const TwoStages: Story = {
  render: () => createChain(twoStages),
};

export const SixStages: Story = {
  render: () => createChain(sixStages),
};

export const Narrow: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.style.maxWidth = '360px';
    wrapper.append(createChain(genericStages));
    return wrapper;
  },
};

export const LongContent: Story = {
  render: () => createChain(Object.freeze([
    Object.freeze({
      id: 'long-label',
      label: 'A deliberately long localized label supplied without rewriting',
      displayValue: '000000000000000000000000000000000000000001',
      annotation: 'A deliberately extended supporting annotation from the consumer',
      tone: 'info',
    }),
    Object.freeze({
      id: 'long-value',
      label: 'Another supplied label',
      displayValue: '9,876,543,210,123.000 units awaiting classification',
    }),
  ] satisfies ReadonlyArray<EvidenceStage>)),
};

export const Empty: Story = {
  render: () => createChain(Object.freeze([])),
};

export const InvalidInput: Story = {
  render: () => createChain(Object.freeze([
    Object.freeze({ id: 'duplicate', label: 'First item', displayValue: '1' }),
    Object.freeze({ id: 'duplicate', label: 'Second item', displayValue: '2' }),
  ])),
};

export const LightMode: Story = {
  parameters: { backgrounds: { default: 'sk-light' } },
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.className = 'sk-light';
    wrapper.style.cssText = 'background: var(--sk-surface-page); padding: var(--sk-space-6);';
    wrapper.append(createChain(genericStages));
    return wrapper;
  },
};
