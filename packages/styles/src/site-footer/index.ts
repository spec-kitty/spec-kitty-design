const year = new Date().getFullYear();

export const SkSiteFooterHTML = `
<footer class="sk-site-footer">
  <div class="sk-site-footer__grid">
    <div>
      <div class="sk-site-footer__brand">
        <img src="../../packages/tokens/assets/logo.webp" alt="Spec Kitty logo" width="28" height="28" />
        <span class="sk-site-footer__wordmark">Spec Kitty</span>
      </div>
      <p class="sk-site-footer__tagline">
        The missing workflow layer that keeps AI coding aligned with product intent.
        Built for product and engineering teams that ship with confidence.
      </p>
    </div>
    <nav aria-label="Product links">
      <div class="sk-site-footer__heading">Product</div>
      <ul class="sk-site-footer__links">
        <li><a href="#" class="sk-footer-link">Platform</a></li>
        <li><a href="#" class="sk-footer-link">Getting started</a></li>
        <li><a href="#" class="sk-footer-link">About</a></li>
        <li><a href="#" class="sk-footer-link">Blog</a></li>
        <li><a href="#" class="sk-footer-link">Docs</a></li>
      </ul>
    </nav>
    <nav aria-label="Connect links">
      <div class="sk-site-footer__heading">Connect</div>
      <ul class="sk-site-footer__links">
        <li><a href="#" class="sk-footer-link">Training</a></li>
        <li><a href="#" class="sk-footer-link">Contact</a></li>
        <li><a href="#" class="sk-footer-link">GitHub</a></li>
        <li><a href="#" class="sk-footer-link">LinkedIn</a></li>
      </ul>
    </nav>
  </div>
  <hr class="sk-site-footer__divider" />
  <p class="sk-site-footer__legal">© ${year} Spec Kitty. All rights reserved.</p>
</footer>
`;
