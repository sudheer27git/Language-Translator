# Lingua — language translator

A two-pane text translator with language swap, text-to-speech, copy, and recent-translation history. Built with plain HTML/CSS/JS — no framework, no build step.

Translations are fetched live from the free [MyMemory](https://mymemory.translated.net/) API, so an internet connection is required. Quality can vary, especially for idioms and slang.

## Run it
Just open `index.html` in a browser.

## Features
- 24 languages, swap button to flip source/target
- Debounced live translation as you type
- Listen to source or translated text via the browser's speech synthesis
- Copy translation to clipboard
- Recent translations saved to `localStorage`, click any to reload it

## Files
- `index.html` — structure
- `style.css` — warm paper/ink theme
- `script.js` — translation calls, history, speech, and UI wiring
