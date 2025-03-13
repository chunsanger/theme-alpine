// Dark mode toggle functionality
document.addEventListener('DOMContentLoaded', function() {
  // Get the saved theme from localStorage or use the system preference as default
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const defaultDark = savedTheme === 'dark' || (savedTheme === null && prefersDark);
  
  // Set initial theme
  if (defaultDark) {
    document.documentElement.classList.add('dark-theme');
  }
  
  // Update toggle button state
  const toggleButton = document.getElementById('dark-mode-toggle');
  if (toggleButton) {
    toggleButton.checked = defaultDark;
    toggleButton.setAttribute('aria-checked', defaultDark);
  }
  
  // Listen for toggle button clicks
  document.addEventListener('click', function(e) {
    if (e.target && (e.target.id === 'dark-mode-toggle' || e.target.closest('#dark-mode-toggle-wrapper'))) {
      toggleDarkMode();
    }
  });
  
  // Function to toggle dark mode
  function toggleDarkMode() {
    const isDark = document.documentElement.classList.toggle('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    
    // Update button state
    const toggleButton = document.getElementById('dark-mode-toggle');
    if (toggleButton) {
      toggleButton.checked = isDark;
      toggleButton.setAttribute('aria-checked', isDark);
    }
  }
}); 