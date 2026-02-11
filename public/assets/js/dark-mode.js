// Dark mode toggle functionality

document.addEventListener('DOMContentLoaded', function () {
  const root = document.documentElement;
  const toggleButton = document.getElementById('dark-mode-toggle-wrapper');
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  const setThemeState = function (isDark) {
    root.classList.toggle('dark-theme', isDark);
    root.classList.toggle('light-theme', !isDark);
    if (toggleButton) {
      toggleButton.setAttribute('aria-checked', isDark ? 'true' : 'false');
    }
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', isDark ? '#1f1f1f' : '#f7f7f5');
    }
  };

  // Follow system dark mode by default. Persist only explicit dark preference.
  if (savedTheme === 'light') {
    localStorage.removeItem('theme');
  }
  const defaultDark = prefersDark || savedTheme === 'dark';
  setThemeState(defaultDark);

  if (!toggleButton) {
    return;
  }

  toggleButton.addEventListener('click', function () {
    const isDark = !root.classList.contains('dark-theme');
    setThemeState(isDark);
    if (isDark) {
      localStorage.setItem('theme', 'dark');
    } else {
      localStorage.removeItem('theme');
    }
  });

  toggleButton.addEventListener('keydown', function (event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const isDark = !root.classList.contains('dark-theme');
      setThemeState(isDark);
      if (isDark) {
        localStorage.setItem('theme', 'dark');
      } else {
        localStorage.removeItem('theme');
      }
    }
  });
});
