# Mohammed Osman Ali — Portfolio

A personal portfolio built with HTML, CSS, JavaScript, and a small native WebGL sculpture. Charcoal surfaces, ivory typography, and lime accents keep the focus on the projects. There is no framework, production package dependency, or build step.

## Run locally

Open the repository folder in VS Code and use **Live Server**, or run a local static server from that folder:

```sh
# Windows, if Python is installed:
py -m http.server 8000

# macOS / Linux:
python3 -m http.server 8000
```

Visit http://localhost:8000. Use HTTP rather than opening `index.html` as a file; browsers restrict JavaScript module imports under `file://`. The static monogram still works when the module cannot load.

## Files

- `index.html`: personal content, navigation, projects, disclosures, skills, and contact destinations.
- `style.css`: theme tokens, locally hosted fonts, responsive layouts, and reduced-motion rules.
- `script.js`: progressive navigation, reveal animations, and restrained pointer tilt.
- `monogram.js`: procedural geometry, satin lighting, pointer response, and WebGL lifecycle.
- `assets/monogram.svg`: static sculpture for unavailable WebGL or reduced motion.
- `assets/*.webp`: actual project screenshots.
- `assets/fonts/`: local Latin font subsets and their SIL Open Font License notices.
- `profile-photo.png`: original portrait, unchanged.
- `docs/`: desktop/mobile previews and verification notes.

## Updating content

Edit the text and links directly in `index.html`. The education line is marked with an update comment and deliberately omits an academic year. Add projects by following an existing `article.project`, including an accurate screenshot, descriptive alternative text, project status, source link, and concise disclosure details.

The first project is **Code and Clix, in development**. Its screenshot is an offline rendering of the actual Navbar and Hero source at commit `a5c3f3f27bcdb3d8a3660e73e74c0033acdb6567`, using the project's static hero fallback. It is not a live deployment screenshot. The portfolio screenshot shows this implementation. Update either image when the underlying project changes.

Color tokens are at the top of `style.css`. Preserve readable contrast when changing them. Fonts are self-hosted; no Google Fonts requests or font service accounts are needed.

## Contact

Email links open the visitor's email application. The old demonstration form was removed because it did not deliver messages. There is no backend, service account, or API key to configure, and no message is claimed to have been sent.

The original email and GitHub destinations are preserved. The original LinkedIn URL is also preserved, but its destination/ownership could not be independently confirmed; check that it is your profile before publishing. No similarly named profile was substituted.

## 3D and motion

The elliptical O uses a single native WebGL mesh, with a lime inlay in its shader. Desktop uses 128 × 32 segments; smaller screens use 80 × 32. Pixel ratio is capped at 1.75 on desktop and 1.25 on mobile. It pauses offscreen and while the document is hidden. Reduced motion displays the static SVG and stops the animation loop. WebGL initialization failures, module loading failures, and context loss preserve the SVG; context restoration rebuilds resources.

The 3D layer is decorative, hidden from assistive technology, and never captures input over navigation or text. Project tilt is limited to approximately three degrees and only runs with a fine hover-capable pointer. Revealed content is visible even if JavaScript fails.

## Review

See [verification notes](docs/verification.md), [desktop preview](docs/preview-desktop.webp), and [mobile preview](docs/preview-mobile.webp). Automated checks are useful evidence, but do not establish complete accessibility or compatibility across every browser and device.
