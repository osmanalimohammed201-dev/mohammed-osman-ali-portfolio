/* ============================================================
   SCRIPT.JS — everything that MOVES or REACTS on the page
   ============================================================
   This file has 3 small features:
   1. The typing animation in the hero section
   2. Fading in the About Me card when you scroll to it
   3. A friendly message when the contact form is submitted
   ============================================================ */

// ---- 1. Typing animation in the hero section ----
// EDIT ME: change these lines to whatever taglines you like
const linesToType = [
  "Aspiring Web Developer",
  "MPC Student, Shaheen Junior College",
  "Learning Python, HTML, CSS & JavaScript",
  "Building one project at a time"
];

const typedEl = document.getElementById('typedLine');
let lineIndex = 0, charIndex = 0, deleting = false;

function typeLoop() {
  const current = linesToType[lineIndex];
  let display = deleting
    ? current.substring(0, charIndex--)
    : current.substring(0, charIndex++);

  typedEl.innerHTML = display + '<span class="cursor"></span>';

  let delay = deleting ? 35 : 65;

  if (!deleting && charIndex === current.length + 1) {
    delay = 1400; // pause at end of line
    deleting = true;
  } else if (deleting && charIndex === 0) {
    deleting = false;
    lineIndex = (lineIndex + 1) % linesToType.length;
    delay = 400;
  }
  setTimeout(typeLoop, delay);
}
typeLoop();

// ---- 2. Fade in the About Me card when it scrolls into view ----
const aboutCard = document.getElementById('aboutCard');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      aboutCard.classList.add('visible');
    }
  });
}, { threshold: 0.2 });
observer.observe(aboutCard);

// ---- 3. Contact form (demo only — shows a friendly note on submit) ----
document.getElementById('contactForm').addEventListener('submit', function (e) {
  e.preventDefault();
  const note = document.getElementById('formNote');
  note.textContent = "Thanks! (This is a demo — hook this up to Formspree/EmailJS to receive real messages.)";
  note.style.color = "var(--cyan)";
  this.reset();
});
