# camgaudian.github.io

Personal CS portfolio website, live at [gaudian.dev](https://gaudian.dev).

The site is styled like a code editor: a file explorer, tabs, a command palette (Ctrl/Cmd + K), and a
terminal-style contact window. It's plain HTML, CSS, and JavaScript with no build step or dependencies,
served by GitHub Pages.

## Structure

```
index.html        Page markup and all content (experience, projects, skills, contact)
style.css         All styles
main.js           Navigation, scroll spy, modals, command palette, contact terminal
assets/
  resume.pdf      Resume shown in the resume modal
  img/            Portrait, favicon, and project screenshots
CNAME             Custom domain for GitHub Pages
```

## Running locally

Open `index.html` directly in a browser, or serve the folder so the resume preview loads the same way it
does in production:

```
python -m http.server 8000
```

Then visit http://localhost:8000.

## Common updates

- **Resume:** replace `assets/resume.pdf` with the new file, keeping the same name. No HTML changes needed.
- **Projects:** each project has a card inside a project browser dialog and a details dialog in
  `index.html`. It also needs an entry in the sidebar file tree.
- **Footer date:** update "Last updated" at the bottom of the editor content in `index.html`.
