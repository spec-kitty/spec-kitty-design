const thumbnailSrc =
  'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 1200 675%22%3E%3Crect width=%221200%22 height=%22675%22 fill=%22%2314202E%22/%3E%3Cpath d=%22M0 520 C240 410 410 600 630 460 C810 344 980 390 1200 250 L1200 675 L0 675 Z%22 fill=%22%23F5C518%22 opacity=%220.45%22/%3E%3Cpath d=%22M0 330 C260 250 440 420 690 280 C910 156 1030 220 1200 96%22 fill=%22none%22 stroke=%22%23A9C7E8%22 stroke-width=%2244%22 stroke-linecap=%22round%22 opacity=%220.75%22/%3E%3C/svg%3E';

const blogCardContent = ({
  includeImage = true,
  includeEyebrow = true,
  title = 'Designing agent-ready workflows without losing the thread',
}: {
  includeImage?: boolean;
  includeEyebrow?: boolean;
  title?: string;
} = {}) => `<article class="sk-card sk-blog-card">
  ${
    includeImage
      ? `<img class="sk-blog-card__thumbnail" src="${thumbnailSrc}" alt="Abstract yellow and blue architecture diagram">`
      : ''
  }
  <div class="sk-blog-card__content">
    ${includeEyebrow ? '<p class="sk-blog-card__eyebrow">Field notes</p>' : ''}
    <h3 class="sk-blog-card__title">${title}</h3>
    <p class="sk-blog-card__excerpt">A practical look at keeping product intent, implementation details, and review evidence connected as teams adopt agentic coding workflows.</p>
    <p class="sk-blog-card__meta">May 3, 2026 · 6 min read</p>
    <a class="sk-blog-card__read-more" href="#">Read the article</a>
  </div>
</article>`;

export const SkBlogCardDefaultHTML = blogCardContent();

export const SkBlogCardWithoutImageHTML = blogCardContent({ includeImage: false });

export const SkBlogCardWithoutEyebrowHTML = blogCardContent({ includeEyebrow: false });

export const SkBlogCardLongTitleHTML = blogCardContent({
  title:
    'How catalog completeness, semantic token discipline, and reviewable examples make a design system easier to trust',
});
