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
  
  // Listen for toggle button clicks
  document.addEventListener('click', function(e) {
    if (e.target && (e.target.closest('#dark-mode-toggle-wrapper'))) {
      toggleDarkMode();
    }
  });
  
  // Add keyboard support for accessibility
  document.addEventListener('keydown', function(e) {
    const toggle = document.getElementById('dark-mode-toggle-wrapper');
    if (e.key === 'Enter' && document.activeElement === toggle) {
      toggleDarkMode();
    }
  });
  
  // Function to toggle dark mode
  function toggleDarkMode() {
    const isDark = document.documentElement.classList.toggle('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    
    // Update aria attributes for accessibility
    const toggleButton = document.getElementById('dark-mode-toggle-wrapper');
    if (toggleButton) {
      toggleButton.setAttribute('aria-checked', isDark);
    }
    
    // Update theme-color meta tag for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', isDark ? '#2B2522' : '#FAF3D9');
    }
  }
}); 