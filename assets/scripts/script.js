const container = document.querySelector('.fireflies-container');
const fireflyCount = 15;

// Create firefly element with animation
function createFirefly() {
  const firefly = document.createElement('div');
  firefly.classList.add('firefly');

  const size = Math.random() * 3 + 2; // 2px - 5px
  firefly.style.width = `${size}px`;
  firefly.style.height = `${size}px`;

  // Position in viewport initially
  firefly.style.left = `${Math.random() * 100}vw`;
  firefly.style.top = `${Math.random() * 100}vh`;

  container.appendChild(firefly);

  animateFirefly(firefly);
}

// Animate each firefly moving around
function animateFirefly(firefly) {
  const move = () => {
    const x = Math.random() * 100;
    const y = Math.random() * 100;
    const duration = 5 + Math.random() * 5;

    firefly.style.transition = `transform ${duration}s cubic-bezier(0.4, 0, 0.2, 1), opacity ${duration / 2}s ease-in-out`;
    firefly.style.transform = `translate(${x - 50}vw, ${y - 50}vh)`;
    firefly.style.opacity = `${0.5 + Math.random() * 0.5}`;
    setTimeout(move, duration * 1000);
  };
  move();
}

// Initialize fireflies
for (let i = 0; i < fireflyCount; i++) {
  createFirefly();
}

// Theme toggle button logic
const themeToggleBtn = document.querySelector('.theme-toggle-btn');
themeToggleBtn.addEventListener('click', () => {
  const body = document.body;
  if (body.classList.contains('dark-theme')) {
    body.classList.replace('dark-theme', 'light-theme');
    themeToggleBtn.textContent = '☀️';
  } else {
    body.classList.replace('light-theme', 'dark-theme');
    themeToggleBtn.textContent = '🌙';
  }
});
