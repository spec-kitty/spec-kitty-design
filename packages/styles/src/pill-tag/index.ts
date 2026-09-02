export type PillTagVariant = 'default' | 'green' | 'purple' | 'breaking' | 'yellow';

export function SkTagHTML(label: string, variant: PillTagVariant = 'default'): string {
  const variantClass = variant !== 'default' ? ` sk-tag--${variant}` : '';
  return `<span class="sk-tag${variantClass}">${label}</span>`;
}

export function SkEyebrowPillHTML(label: string): string {
  return `<span class="sk-eyebrow-pill">${label}</span>`;
}

// Default export for backward compatibility
export const SkPillTagHTML = SkTagHTML('v1.0.0');
