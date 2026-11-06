(() => {
  const allowed = ['blue', 'green', 'reading', 'black'];
  const key = 'pocketdrop-theme';
  function apply(theme) {
    const selected = allowed.includes(theme) ? theme : 'blue';
    document.documentElement.dataset.theme = selected;
    document.querySelectorAll('[data-theme-choice]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.themeChoice === selected));
    });
  }
  let saved;
  try { saved = localStorage.getItem(key); } catch {}
  apply(saved);
  document.addEventListener('DOMContentLoaded', () => {
    apply(document.documentElement.dataset.theme);
    document.querySelectorAll('[data-theme-choice]').forEach(button => button.addEventListener('click', () => {
      const theme = button.dataset.themeChoice;
      apply(theme);
      try { localStorage.setItem(key, theme); } catch {}
    }));
  });
  window.addEventListener('storage', event => { if (event.key === key) apply(event.newValue); });
})();
