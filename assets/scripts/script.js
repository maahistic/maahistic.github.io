// ========== TYPING EFFECT ==========

(function initTyping() {

const roles = [

'Java Full Stack Developer',

'Module Lead',

'Microservices Architect',

'Spring Boot Expert',

'Agile Practitioner'

];

const typedEl = document.getElementById('typed-text');

if (!typedEl) return;



let roleIndex = 0;

let charIndex = 0;

let isDeleting = false;

const typeSpeed = 80;

const deleteSpeed = 40;

const pauseEnd = 1800;

const pauseStart = 400;



function tick() {

const current = roles[roleIndex];

if (isDeleting) {

typedEl.textContent = current.substring(0, charIndex - 1);

charIndex--;

} else {

typedEl.textContent = current.substring(0, charIndex + 1);

charIndex++;

}



let delay = isDeleting ? deleteSpeed : typeSpeed;



if (!isDeleting && charIndex === current.length) {

delay = pauseEnd;

isDeleting = true;

} else if (isDeleting && charIndex === 0) {

isDeleting = false;

roleIndex = (roleIndex + 1) % roles.length;

delay = pauseStart;

}



setTimeout(tick, delay);

}



tick();

})();



// ========== DYNAMIC DURATION ==========

(function initDurations() {

function calcDuration(startDate, endDate) {

const start = new Date(startDate);

const end = endDate ? new Date(endDate) : new Date();

const totalMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());

const years = Math.floor(totalMonths / 12);

const months = totalMonths % 12;

return `${years} year${years !== 1 ? 's' : ''} ${months} month${months !== 1 ? 's' : ''}`;

}



const mphasisEl = document.getElementById('mphasis-duration');

const worldlineEl = document.getElementById('worldline-duration');

if (mphasisEl) mphasisEl.textContent = `April 2024 \u2013 Present (${calcDuration('2024-04-01')})`;

if (worldlineEl) worldlineEl.textContent = `October 2021 \u2013 April 2024 (${calcDuration('2021-10-01', '2024-04-01')})`;

})();



// ========== FOOTER YEAR ==========

(function initFooterYear() {

const el = document.getElementById('footer-year');

if (el) el.textContent = new Date().getFullYear();

})();



// ========== THEME TOGGLE ==========

(function initTheme() {

const btn = document.querySelector('.theme-toggle-btn');

const icon = btn && btn.querySelector('i');

if (!btn || !icon) return;



btn.addEventListener('click', () => {

const body = document.body;

if (body.classList.contains('dark-theme')) {

body.classList.replace('dark-theme', 'light-theme');

icon.classList.replace('fa-moon', 'fa-sun');

} else {

body.classList.replace('light-theme', 'dark-theme');

icon.classList.replace('fa-sun', 'fa-moon');

}

});

})();



// ========== HAMBURGER MENU ==========

(function initHamburger() {

const hamburger = document.querySelector('.hamburger');

const navLinks = document.querySelector('.nav-links');

const overlay = document.querySelector('.nav-overlay');

if (!hamburger || !navLinks) return;



function closeMenu() {

hamburger.classList.remove('active');

navLinks.classList.remove('open');

if (overlay) overlay.classList.remove('show');

}



hamburger.addEventListener('click', () => {

const isOpen = navLinks.classList.contains('open');

if (isOpen) {

closeMenu();

} else {

hamburger.classList.add('active');

navLinks.classList.add('open');

if (overlay) overlay.classList.add('show');

}

});



if (overlay) overlay.addEventListener('click', closeMenu);



navLinks.querySelectorAll('a').forEach(link => {

link.addEventListener('click', closeMenu);

});

})();



// ========== NAVBAR SCROLL SHADOW ==========

(function initNavScroll() {

const navbar = document.querySelector('.navbar');

if (!navbar) return;



window.addEventListener('scroll', () => {

navbar.classList.toggle('scrolled', window.scrollY > 50);

}, { passive: true });

})();



// ========== SCROLL SPY (active nav link) ==========

(function initScrollSpy() {

const sections = document.querySelectorAll('section[id]');

const navAnchors = document.querySelectorAll('.nav-links a');

if (!sections.length || !navAnchors.length) return;



const observer = new IntersectionObserver(entries => {

entries.forEach(entry => {

if (entry.isIntersecting) {

const id = entry.target.getAttribute('id');

navAnchors.forEach(a => {

a.classList.toggle('active', a.getAttribute('href') === `#${id}`);

});

}

});

}, { rootMargin: '-30% 0px -60% 0px' });



sections.forEach(s => observer.observe(s));

})();



// ========== REVEAL ON SCROLL ==========

(function initReveal() {

const reveals = document.querySelectorAll('.reveal');

if (!reveals.length) return;



const observer = new IntersectionObserver(entries => {

entries.forEach(entry => {

if (entry.isIntersecting) {

entry.target.classList.add('revealed');

observer.unobserve(entry.target);

}

});

}, { threshold: 0.15 });



reveals.forEach(el => observer.observe(el));

})();



// ========== SCROLL-TO-TOP BUTTON ==========

(function initScrollTop() {

const btn = document.querySelector('.scroll-top-btn');

if (!btn) return;



window.addEventListener('scroll', () => {

btn.classList.toggle('visible', window.scrollY > 400);

}, { passive: true });



btn.addEventListener('click', () => {

window.scrollTo({ top: 0, behavior: 'smooth' });

});

})();



// ========== PARTICLES ==========

(function initParticles() {

const container = document.querySelector('.particles-container');

if (!container) return;



const count = 20;

for (let i = 0; i < count; i++) {

const p = document.createElement('div');

p.classList.add('particle');

const size = Math.random() * 4 + 2;

p.style.width = `${size}px`;

p.style.height = `${size}px`;

p.style.left = `${Math.random() * 100}%`;

p.style.top = `${Math.random() * 100}%`;

p.style.opacity = `${0.05 + Math.random() * 0.15}`;

container.appendChild(p);

animateParticle(p);

}



function animateParticle(el) {

const move = () => {

const x = (Math.random() - 0.5) * 200;

const y = (Math.random() - 0.5) * 200;

const dur = 6 + Math.random() * 8;

el.style.transition = `transform ${dur}s linear`;

el.style.transform = `translate(${x}px, ${y}px)`;

setTimeout(move, dur * 1000);

};

setTimeout(move, Math.random() * 3000);

}

})();

