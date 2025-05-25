const container = document.querySelector('.fireflies-container');
const fireflyCount = 15;

function createFirefly() {
  const firefly = document.createElement('div');
  firefly.classList.add('firefly');

  const size = Math.random() * 3 + 2; // 2px - 5px
  firefly.style.width = `${size}px`;
  firefly.style.height = `${size}px`;

  firefly.style.left = `${Math.random() * 100}vw`;
  firefly.style.top = `${Math.random() * 100}vh`;

  container.appendChild(firefly);

  animateFirefly(firefly);
}

function animateFirefly(firefly) {
  const move = () => {
    const x = Math.random() * 100;
    const y = Math.random() * 100;
    const duration = 5 + Math.random() * 5;

    firefly.style.transition = `transform ${duration}s ease-in-out, opacity 2s`;
    firefly.style.transform = `translate(${x - 50}vw, ${y - 50}vh)`;
    firefly.style.opacity = `${0.5 + Math.random() * 0.5}`;

    setTimeout(move, duration * 1000);
  };

  move();
}

for (let i = 0; i < fireflyCount; i++) {
  createFirefly();
}
