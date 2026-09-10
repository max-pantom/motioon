Load the repo `SPEC.md` for the full language. This sheet is the minimum the model needs in context.

Frontmatter keys — id, title, aspect, fps, duration, background, safe_area, theme, assets, audio.

Scene heading — `## scene:<id>`

Fence — ```motion with duration, transition, elements.

Element keys — id, type, text, src, role, at, duration, x, y, w, h, enter, exit.

Types — text, image, shape, html, caption.

Roles — hero, sub, caption, label.

Enter grammar — `preset duration delay easing` e.g. `fade-up 0.5 0.2 ease-out`.
