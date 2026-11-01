# Clean Goose (PWA)

Say or type an item, get its cleaning instructions. Content is transcribed from `CLEANING.pdf`.

## Use it

- **Type or dictate** in the search box. Spelling doesn't need to be exact ("kite footies", "hakka", "jelly cat" all work).
- **Mic button**: one tap, say the item, and the answer appears.
- **Hands-free**: tap once. It listens, shows and **reads** the answer, then listens again.
  Only the top match is read; say **"next"** for the others, **"repeat"**, or **"stop"**. The screen stays awake while it's on. It turns off after 3 quiet minutes or when you leave the app.
- **Read aloud**: when on, voice searches are also spoken. Every card has its own 🔊 button.
- **Settings** (sliders icon, top right):
  - **Appearance**: Light, Dark or Auto (follows the phone).
  - **Read aloud**: *Everything*, *Straightforward* (just the gist, e.g. "Wash: delicate cycle, cold. Dry: tumble dry low.") or *Just the name* (confirms the match and, in hands-free, listens again right away; say "read it" for details). The screen always shows everything.
  - **Laundry: read**: Wash & dry, Wash only or Dry only.
  - In hands-free you can also say these: "straightforward", "just the name", "everything", "wash only", "dry only", "both".
- **Back**: the phone's back swipe steps back through previous searches and sections. It doesn't close the app.

### Voice recognition
iPhone's built-in web speech recognition stops hearing after the first use ([WebKit bug 321436](https://bugs.webkit.org/show_bug.cgi?id=321436)). So on iPhone the app uses its **own** recognition:
- It records the request and stops by itself when you go quiet.
- It transcribes the audio on the phone with a small speech model, [Moonshine Tiny](https://huggingface.co/onnx-community/moonshine-tiny-ONNX), in [`stt.js`](stt.js) and [`stt-worker.js`](stt-worker.js).
- The model is a one-time ~28 MB download, and after that it works offline.

Android keeps using Chrome's built-in recognition, which works. **Settings → Voice recognition** can switch either phone to the other kind.
**Settings → Voice log** shows what was heard (useful for adding mishearings to `aliases`).

Tests: [`tests/stt.html`](tests/stt.html) transcribes the clips in `tests/audio/`. [`tests/voice.html`](tests/voice.html) simulates speech engines; its comments describe the modes.

## Edit the content
All instructions live in [`data.js`](data.js). Search terms, nicknames and likely voice mishearings for each item go in its `aliases` list.
When several products share the same steps, give each its own entry with the `each(shared, [...])` helper, so a search for one doesn't show the others.
After editing, run the tests and bump `VERSION` in [`sw.js`](sw.js) so installed copies update:

```bash
npm test
```

## Icon
The illustration is [`icons/source/clean-goose.png`](icons/source/clean-goose.png). To use new art, replace that file (square PNG, about 1024px or larger) and run `npm run icons` (needs Python with Pillow and NumPy). Then bump `VERSION` in `sw.js`.

## Run locally
```bash
python -m http.server 8080
```
Then open http://localhost:8080. Voice tests: http://localhost:8080/tests/voice.html (simulated speech).

## Publish
The app needs HTTPS (for install, offline mode and the microphone). Any static host works: GitHub Pages, Netlify, Cloudflare Pages.
Upload these: `index.html`, `styles.css`, `app.js`, `search.js`, `data.js`, `stt.js`, `stt-worker.js`, `sw.js`, `manifest.webmanifest`, `fonts/`, `icons/`.
Leave out `CLEANING.pdf`, `tests/` and `.claude/`.
