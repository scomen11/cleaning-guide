# Cleaning Guide (PWA)

Say or type an item, get its cleaning instructions. Content is transcribed from `CLEANING.pdf`.

## Use it

- **Type or dictate** in the search box. Spelling doesn't need to be exact ("kite footies", "hakka", "jelly cat" all work).
- **Mic button**: one tap, say the item, and the answer appears.
- **Hands-free**: tap once. It listens, shows and **reads** the answer, then listens again.
  Say **"next"** (other matches), **"repeat"**, or **"stop"**. The screen stays awake while it's on. It turns off after 3 quiet minutes or when you leave the app.
- **Read aloud**: when on, voice searches are also spoken. Every card has its own 🔊 button.

### iPhone note
iOS only allows in-page voice recognition in **Safari tabs**, not in apps added to the Home Screen.
- **Home Screen app**: use the 🎤 on the keyboard to dictate. Reading aloud still works.
- **Safari tab** (bookmark it): the mic button and Hands-free mode work.

Android (Chrome) supports everything, including from the home screen.

## Edit the content
All instructions live in [`data.js`](data.js). Search terms, nicknames and likely voice mishearings for each item go in its `aliases` list.
After editing, run the tests and bump `VERSION` in [`sw.js`](sw.js) so installed copies update:

```bash
npm test
```

## Run locally
```bash
python -m http.server 8080
```
Then open http://localhost:8080. Voice tests: http://localhost:8080/tests/voice.html (simulated speech).

## Publish
The app needs HTTPS (for install, offline mode and the microphone). Any static host works: GitHub Pages, Netlify, Cloudflare Pages.
Upload these: `index.html`, `styles.css`, `app.js`, `search.js`, `data.js`, `sw.js`, `manifest.webmanifest`, `fonts/`, `icons/`.
Leave out `CLEANING.pdf`, `tests/` and `.claude/`.
