export const SkNavPillHTML = `<nav class="sk-nav-pill" aria-label="Primary navigation">
  <div class="sk-nav-pill__items">
    <a href="#" class="sk-nav-pill__item">Platform</a>
    <a href="#" class="sk-nav-pill__item sk-nav-pill__item--active" aria-current="page">Getting Started</a>
    <a href="#" class="sk-nav-pill__item">About</a>
    <a href="#" class="sk-nav-pill__item">Blog</a>
  </div>
  <div class="sk-nav-pill__cta">
    <button class="sk-nav-pill__cta-btn" type="button">Book Demo</button>
  </div>
</nav>`;

// `skToggleDrawer` is GONE (#73). Its behaviour is `<sk-nav-pill>` in @spec-kitty/elements:
// `open()` / `close()` / `toggle()` and a `sk-nav-pill-toggle` event, with no global
// `id="sk-nav-drawer"` contract and nothing to attach to `window`. No compatibility shim —
// nothing is published, so nothing imported it.
