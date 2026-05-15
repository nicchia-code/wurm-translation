# MTG Tournament Rules Reference

A mobile-first GitHub Pages app for quickly checking the official English Oracle rules text of Magic: The Gathering cards via the [Scryfall API](https://scryfall.com/docs/api).

## Use

1. Open the site on a phone.
2. Enter one card name per line.
3. Tap **Show rules**.
4. Use **Copy link** to create a shareable URL with the card list embedded.

The app is intended for cards you have in other languages and need an English reference for during a tournament. Card data is requested directly from Scryfall in the browser; no backend is required.

## GitHub Pages deployment

This repository includes `.github/workflows/pages.yml`, which deploys the static site to GitHub Pages on pushes to `main` or `master`, and can also be run manually from the Actions tab.

In the repository settings, set **Pages → Source** to **GitHub Actions**.
