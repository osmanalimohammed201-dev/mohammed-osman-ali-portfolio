/* Progressive enhancements. All content and contact links work without this file. */
(() => {
  "use strict";
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const mobile = window.matchMedia("(max-width: 767px)");
  const nav = document.querySelector(".nav");
  const toggle = document.querySelector(".menu-toggle");
  const links = document.querySelector(".nav-links");
  function closeMenu(returnFocus = false) {
    const wasOpen = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", "false");
    toggle.lastElementChild.textContent = "+";
    links.classList.remove("is-open");
    if (wasOpen && returnFocus) toggle.focus();
  }
  function configureMenu() {
    closeMenu();
    toggle.hidden = !mobile.matches;
    nav.classList.toggle("is-enhanced", mobile.matches);
  }
  toggle.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") !== "true";
    toggle.setAttribute("aria-expanded", String(open));
    toggle.lastElementChild.textContent = open ? "−" : "+";
    links.classList.toggle("is-open", open);
  });
  links.addEventListener("click", (event) => {
    const anchor = event.target.closest("a");
    if (!anchor) return;
    const target = document.querySelector(anchor.hash);
    closeMenu();
    // Move focus out of the closing menu to the requested section.
    if (mobile.matches && target) {
      target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu(true);
  });
  document.addEventListener("click", (event) => {
    if (!nav.contains(event.target)) closeMenu();
  });
  nav.addEventListener("focusout", (event) => {
    if (!nav.contains(event.relatedTarget)) closeMenu();
  });
  mobile.addEventListener("change", configureMenu);
  configureMenu();

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          if (!reducedMotion.matches)
            entry.target.classList.add("just-revealed");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.08 },
    );
    document
      .querySelectorAll("[data-reveal]")
      .forEach((el) => observer.observe(el));
  }
  const cards = [...document.querySelectorAll("[data-tilt]")];
  function resetTilt() {
    cards.forEach((card) => {
      card.style.removeProperty("--tilt-x");
      card.style.removeProperty("--tilt-y");
    });
  }
  cards.forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      if (!finePointer.matches || reducedMotion.matches) return;
      const rect = card.getBoundingClientRect();
      card.style.setProperty(
        "--tilt-x",
        `${(-(event.clientY - rect.top - rect.height / 2) / rect.height) * 6}deg`,
      );
      card.style.setProperty(
        "--tilt-y",
        `${((event.clientX - rect.left - rect.width / 2) / rect.width) * 6}deg`,
      );
    });
    card.addEventListener("pointerleave", resetTilt);
  });
  reducedMotion.addEventListener("change", resetTilt);
  finePointer.addEventListener("change", resetTilt);

  // Keep the 3D code isolated: failed WebGL never interrupts page interactions.
  import("./monogram.js")
    .then((module) => module.mountMonogram({ reducedMotion, finePointer }))
    .catch(() => {
      /* The inline SVG image remains visible. */
    });
})();
