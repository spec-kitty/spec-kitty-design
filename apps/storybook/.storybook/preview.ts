import '../../../packages/tokens/src/tokens.css';
import type { Preview } from '@storybook/web-components';

const preview: Preview = {
  parameters: {
    a11y: { config: { rules: [{ id: 'color-contrast', enabled: true }] } },
    layout: 'centered',
  },
};

export default preview;
