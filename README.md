# Scrambled Net Webapp

A web-based version of the classic Scrambled Net puzzle game, packaged for Android using Capacitor.

## Features
- Classic puzzle gameplay
- Multiple difficulty levels: Novice, Normal, Expert, Master, Insane
- Retro and Modern themes
- Sound effects

## Build Instructions (Android)

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Build Web App**:
    ```bash
    npm run build
    ```

3.  **Sync Android Project**:
    ```bash
    npx cap sync android
    ```

4.  **Run**:
    Open the `android/` folder in Android Studio and run the app.

## F-Droid Publication

This project includes the necessary metadata for F-Droid publication in `metadata/`.

### Status
- **Build:** ✅ SUCCESS
- **Metadata:** ✅ Verified
- **CI Pipeline:** ✅ Passed

### How to Submit
1.  Go to your GitLab fork: [JSearra/scrambled-net](https://gitlab.com/JSearra/scrambled-net)
2.  Click **"Create merge request"**.
3.  Set the target branch to `fdroid/fdroiddata` (master).
4.  Title: `Add Scrambled Net`
5.  Description: `New app submission. Build verified.`
6.  Submit!

### Compliance
- **License**: ensuring the project is Open Source (GPL-3.0).
- **Assets**: Ensure all assets (images/sounds) are compatible with the license.
- **Dependencies**: Uses standard npm packages and Capacitor, which are F-Droid compatible.

## Translations

The game ships in 39 languages: the 24 official EU languages plus Afrikaans, Arabic, Catalan, Chinese (Simplified and Traditional), Indonesian, Japanese, Korean, Malay, Norwegian Bokmål, Persian, Russian, Turkish, Ukrainian and Vietnamese. Arabic and Persian switch the page to right-to-left (see `isRtl` in `src/i18n.ts`); the game board itself is not mirrored. It follows the device language when a matching translation exists and otherwise uses English. Players can override it with the globe button at the bottom of the main menu.

Each language is one file in `src/locales/<code>.json`. To add or fix one, copy `en.json`, translate the values (keep the keys and the HTML tags in `instructions.intro` and `privacy.text`) and run `npm test`. The tests check that every file has exactly the same keys as English. A new file appears in the language picker automatically.

## Microsoft Store (Windows) Publication

The Windows version is the PWA wrapped in an MSIX package with [PWABuilder](https://www.pwabuilder.com). The package loads the deployed site, so web updates reach Store users without a new submission. Only manifest, icon or listing changes need a resubmission.

### Prerequisites
- The site is deployed over HTTPS (Netlify, see `netlify.toml`) at a stable URL. The package is tied to that URL.
- The web manifest (`vite.config.js`) provides an `id`, `categories`, `any` and `maskable` icons (`public/assets/icon-*.png`) and `wide`/`narrow` screenshots (`public/screenshots/`).
- The privacy policy is served at `<site>/privacy.html` (source: `public/privacy.html`) and linked from the in-game Instructions screen.

### Steps
1. **Partner Center**: Register at [partner.microsoft.com](https://partner.microsoft.com/dashboard) (Microsoft Store program) and **reserve the app name** "Scrambled Net".
2. In the app's **Product management → Product identity**, copy the *Package/Identity Name*, *Publisher ID* (`CN=...`) and *Publisher display name*.
3. **Package**: Open [pwabuilder.com](https://www.pwabuilder.com), enter the deployed URL, then **Package for stores → Windows**. Paste the three identity values and set the version (e.g. `1.1.0.0`, increase it for every resubmission).
4. **Test**: Install the test package from the downloaded zip (see its README) and check that the game works offline.
5. **Submit** a new submission in Partner Center:
   - **Category**: Games → Puzzle & trivia
   - **Age ratings**: Complete the IARC questionnaire (no violence, no user interaction, no data collection)
   - **Privacy policy URL**: `<site>/privacy.html`
   - **Store listing**: Description from `fastlane/metadata/android/en-US/`, screenshots from `public/screenshots/wide-*.png` (1366×768)
   - **Packages**: Upload the `.msixbundle` from PWABuilder
6. Submit for certification (usually a few hours to a few days).

### Regenerating screenshots
Run `npm run build && npx vite preview`, set the browser viewport to 1366×768 (or 720×1280 for the narrow one), and capture the start screen and a game in progress into `public/screenshots/` with the same file names.

## Credits
- Original Game Idea: KNetWalk / Ian Cameron Smith
- Modern Assets: [jimnastic89/ModernScrambledNet](https://github.com/jimnastic89/ModernScrambledNet)
- Webapp Conversion: Jonathan Searra
