// Injects the cascade probe's competing DOCUMENT rule, identically on both sides.
//   competing=equal  -> `img { object-fit: contain }`            specificity (0,0,1)
//   competing=higher -> `.page-scope img { object-fit: contain }` specificity (0,1,1)
// Appended last, so document order cannot be what decides it.
(() => {
  const competing = new URLSearchParams(location.search).get('competing') ?? 'none';
  if (competing === 'none') return;
  const style = document.createElement('style');
  style.textContent =
    competing === 'equal'
      ? 'img { object-fit: contain; }'
      : '.page-scope img { object-fit: contain; }';
  document.head.append(style);
})();
