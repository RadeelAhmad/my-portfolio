# my-portfolio

Radeel Ahmad's personal portfolio and security blog — a single-page site styled as a terminal/desktop, built with plain HTML, CSS, and JavaScript. No framework, no build step, no dependencies.

Live at: [radeel.vercel.app](https://radeel.vercel.app/)

## Features

- Terminal-style landing page with a typed `whoami --verbose` intro sequence
- Windowed "desktop" UI for **About**, **Experience**, **Projects**, **Blog**, and **Certificates**
- Blog posts written in Markdown, fetched and rendered client-side with [marked.js](https://marked.js.org/)
- Mostly Hack The Box machine walkthroughs, plus general security write-ups
- Certificate gallery and experience timeline rendered from data in `js/app.js`
- Responsive, dark terminal theme with toast notifications and ambient system messages

## Tech stack

- HTML5 / CSS3 (no preprocessor)
- Vanilla JavaScript (no framework, no bundler)
- [marked.js](https://marked.js.org/) via CDN for Markdown rendering

## Project structure

```
.
├── index.html              # single-page app shell
├── css/style.css            # all styling
├── js/app.js                 # UI logic, blog/experience/certificate data + rendering
├── blog/
│   ├── posts/                # blog post markdown files
│   └── images/                # images referenced by blog posts
├── assets/
│   └── certificates/          # certificate images
├── favicon.svg / favicon-panda.jpg
```

## Running locally

This is a static site — no build step, no `npm install`. Just serve the directory:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

(Opening `index.html` directly via `file://` won't work, since blog posts are loaded with `fetch()`, which requires an HTTP server.)

## Adding a blog post

1. Add a new Markdown file to `blog/posts/`, following the frontmatter and formatting style of an existing post (title, author, `pubDatetime`, tags, description).
2. Drop any referenced images into `blog/images/htb/` (or a relevant subfolder) and reference them as `/blog/images/htb/<file>`.
3. Register the post in the `BLOG_POSTS` array in `js/app.js`, keeping entries sorted newest-first by date.

## Deployment

Hosted on [Vercel](https://vercel.com/), auto-deploying from the `main` branch. Since this is a plain static site, Vercel's Framework Preset should be set to **Other** with no build/install command.

## License

All rights reserved. Content (blog posts, certificates, personal information) belongs to Radeel Ahmad and is not licensed for reuse.
