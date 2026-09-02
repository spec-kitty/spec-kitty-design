export type SkRibbonVariant = 'yellow' | 'green' | 'purple' | 'blue' | 'red';

export function skRibbonCardHTML(options: {
  title: string;
  body: string;
  ribbonLabel?: string;
  ribbonVariant?: SkRibbonVariant;
  /**
   * Apply a brand-colour border to the card frame in addition to (or
   * instead of) the ribbon. Closes #10 acceptance for the colorized-border
   * treatment. When set, the card uses --sk-color-<variant> on the border.
   */
  borderVariant?: SkRibbonVariant;
}): string {
  const { title, body, ribbonLabel, ribbonVariant = 'yellow', borderVariant } = options;
  const ribbon = ribbonLabel
    ? `<div class="sk-ribbon-card__ribbon sk-ribbon-card__ribbon--${ribbonVariant}">${ribbonLabel}</div>`
    : '';
  const borderClass = borderVariant ? ` sk-ribbon-card--border-${borderVariant}` : '';
  return `<article class="sk-ribbon-card${borderClass}">
  ${ribbon}
  <div class="sk-ribbon-card__content">
    <h4 class="sk-h4">${title}</h4>
    <p>${body}</p>
  </div>
</article>`;
}

export const SkRibbonCardDefaultHTML = skRibbonCardHTML({
  title: 'SemVer release channel',
  body: 'Production-ready releases with our standard breaking-change policy.',
});

export const SkRibbonCardWithRibbonHTML = skRibbonCardHTML({
  title: 'Full-day rollout workshop',
  body: 'Get product, engineering, and reviewers aligned on Spec Kitty in your environment.',
  ribbonLabel: 'Primary Workshop',
  ribbonVariant: 'yellow',
});

// Colorized-border variants (WP01 / issue #10). Each pairs a coloured
// ribbon with a matching coloured card border so the accent reads as a
// single intentional treatment instead of two separate decorations.
export const SkRibbonCardBorderYellowHTML = skRibbonCardHTML({
  title: 'Full-day rollout workshop',
  body: 'Get product, engineering, and reviewers aligned on Spec Kitty in your environment.',
  ribbonLabel: 'Primary Workshop',
  ribbonVariant: 'yellow',
  borderVariant: 'yellow',
});

export const SkRibbonCardBorderGreenHTML = skRibbonCardHTML({
  title: 'SemVer release channel',
  body: 'Production-ready releases with our standard breaking-change policy.',
  ribbonLabel: 'Now stable',
  ribbonVariant: 'green',
  borderVariant: 'green',
});

export const SkRibbonCardBorderPurpleHTML = skRibbonCardHTML({
  title: 'Skills Pack beta',
  body: 'Try the new evolution of Spec Kitty with reusable agent skills baked in.',
  ribbonLabel: 'v2.x Preview',
  ribbonVariant: 'purple',
  borderVariant: 'purple',
});
