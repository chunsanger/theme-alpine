// Dark mode toggle functionality

document.addEventListener('DOMContentLoaded', function () {
  const root = document.documentElement;
  const toggleButton = document.getElementById('dark-mode-toggle-wrapper');
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  const setThemeState = function (isDark) {
    root.classList.toggle('dark-theme', isDark);
    if (toggleButton) {
      toggleButton.setAttribute('aria-checked', isDark ? 'true' : 'false');
    }
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', isDark ? '#1f1f1f' : '#f7f7f5');
    }
  };

  const defaultDark = savedTheme === 'dark' || (savedTheme === null && prefersDark);
  setThemeState(defaultDark);

  if (!toggleButton) {
    return;
  }

  toggleButton.addEventListener('click', function () {
    const isDark = !root.classList.contains('dark-theme');
    setThemeState(isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  });

  toggleButton.addEventListener('keydown', function (event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const isDark = !root.classList.contains('dark-theme');
      setThemeState(isDark);
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }
  });
});
