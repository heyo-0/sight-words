# Sight Words

A tiny flashcard web app for early readers. One big lowercase word per card, swipe or tap to move on, four levels, no accounts, no scores, works offline once installed.

## Files

| File | What it is |
|---|---|
| `index.html` | The page |
| `style.css` | Styling |
| `app.js` | Swipe/tap logic, levels, shuffle, confetti, read-aloud |
| `words.js` | **The word lists. This is the only file you should ever need to edit.** |
| `manifest.json`, `sw.js`, `icon*.png/svg` | Lets it install to a home screen and work offline |
| `fonts/` | Andika, a font designed for beginner readers (SIL Open Font Licence, see `fonts/OFL.txt`) |

## Try it on your computer

Double-clicking `index.html` works for a quick look, but the offline/service-worker parts only run from a web server. If you have Python installed, open a terminal in this folder and run:

```
python -m http.server 8000
```

then open http://localhost:8000 in a browser.

## Put it online with GitHub Pages (free)

1. Go to https://github.com/new. Repository name: `sight-words`. Set it to **Public**. Click **Create repository**.
2. On the new repo page click **uploading an existing file** (or **Add file > Upload files**).
3. Drag **everything inside** this folder into the upload area, including the `fonts` folder. Wait for the uploads to finish, then click **Commit changes**.
4. Go to **Settings > Pages**. Under **Build and deployment**, set Source to **Deploy from a branch**, Branch to **main** and folder to **/ (root)**. Click **Save**.
5. Wait a minute or two, then refresh the Pages settings page. It will show the address, which will be `https://YOUR-USERNAME.github.io/sight-words/`.

That address is what you open on the phones and tablets.

## Add it to a home screen

**iPhone / iPad (Safari):** open the address, tap the **Share** button (the square with an arrow), then **Add to Home Screen**, then **Add**.

**Android (Chrome):** open the address, tap the **three dots** menu, then **Add to Home screen** (or **Install app**), then **Add**.

After that it opens full screen from its own icon and works with no internet connection.

## Using it

- **Swipe left** or **tap the right half** of the screen: next word
- **Swipe right** or **tap the left half**: previous word
- **Level button** (top left): pick a level
- **a→z**: switch between shuffled order and alphabetical order
- **Shuffle**: mix the current level up again
- **Speaker**: reads the word aloud (only when tapped)
- On a computer: left/right arrow keys, space bar, and `S` to shuffle

## Editing the word lists

Open `words.js` in any text editor. Each level is a plain list like:

```js
words: [
  "the", "of", "and", "a", "to",
```

Add, remove or reorder words as you like. Keep them lowercase, in quotes, separated by commas. Save the file, upload the new `words.js` to GitHub (Add file > Upload files, it will replace the old one), and the app updates.

Devices that already have the app installed keep a cached copy. To make sure they pick up new words, open `sw.js` and change `sight-words-v1` to `sight-words-v2` (and so on each time), then upload `sw.js` too. The next time the app is opened with an internet connection it refreshes itself.

## Where the words come from

Levels 1 to 4 are built from Fry's 1000 Instant Words (the 1,000 most common words in English, in frequency bands), topped up with the Dolch lists and common Prep / Year 1 classroom words. Proper nouns, contractions and grammar jargon have been removed. Roughly:

- Level 1: Fry 1 to 200 plus simple beginner words (276 words)
- Level 2: Fry 201 to 400 plus Dolch grade words and everyday words (272 words)
- Level 3: Fry 401 to 700 plus common -ing / -ed forms (274 words)
- Level 4: Fry 701 to 1000 plus longer Year 2 words (280 words)
