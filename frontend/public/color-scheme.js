// Sets the colour scheme before the first paint, so a stored dark choice never flashes the light board.
// It is a separate file because the content security policy allows scripts from this origin only.
(function () {
  try {
    var stored = window.localStorage.getItem('mantine-color-scheme-value');
    var scheme = stored === 'light' || stored === 'dark' ? stored : 'auto';
    if (scheme === 'auto') {
      scheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-mantine-color-scheme', scheme);
  } catch {
    document.documentElement.setAttribute('data-mantine-color-scheme', 'light');
  }
})();
