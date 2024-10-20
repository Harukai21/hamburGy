function toggleDarkMode() {
  document.body.classList.toggle('light-mode');

  // Change the icon based on the mode
  const modeIcon = document.getElementById('mode-icon');
  if (document.body.classList.contains('light-mode')) {
      modeIcon.src = 'assets/moon-icon.png';  // Change to moon icon for dark mode
  } else {
      modeIcon.src = 'assets/sun-icon.png';   // Change back to sun icon for light mode
  }
}

function redirectToFacebook() {
  window.location.href = 'https://www.facebook.com/valneer.2024'; // Replace with your Facebook link
}

