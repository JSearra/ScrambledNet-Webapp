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

The build recipe for F-Droid is `metadata/com.jsearra.scramblednet.yml`. It is a copy of the file that goes into [fdroiddata](https://gitlab.com/fdroid/fdroiddata), and it passes `fdroid lint` and `fdroid rewritemeta`. The store listing (title, summary, description, icon, screenshots and changelogs) is read from `fastlane/metadata/android/en-US/` in this repo, so it is not duplicated in fdroiddata.

Automatic updates are enabled (`UpdateCheckMode: Tags`, `AutoUpdateMode: Version`). F-Droid picks up a new version when a tag like `v1.3.0` points at a commit where `android/app/build.gradle` has the new `versionCode` and `versionName`.

### Releasing a new version
1. Bump `versionCode` and `versionName` in `android/app/build.gradle`, and `version` in `package.json`.
2. Add `fastlane/metadata/android/en-US/changelogs/<versionCode>.txt` (500 characters max).
3. Commit, then tag and push: `git tag v1.3.0 && git push origin v1.3.0`.

### Submitting to fdroiddata
1. In your fork ([JSearra/scrambled-net](https://gitlab.com/JSearra/scrambled-net)), put the recipe at `metadata/com.jsearra.scramblednet.yml`. That file is the only change.
2. Reopen merge request [!33313](https://gitlab.com/fdroid/fdroiddata/-/merge_requests/33313), or open a new one against `fdroid/fdroiddata` `master` using the "App inclusion" template.
3. Wait for the pipeline, then answer reviewer comments promptly. Merge requests with no activity for a few weeks are closed.

The F-Droid build server runs Debian trixie and installs Node.js from Debian (`apt-get install -y npm`). Vite needs Node 20.19 or newer.

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

### Asset licenses
- **Retro theme graphics, sounds and the app icon** come from the original Scrambled Net by Ian Cameron Smith. Its source files say GPL version 2, and its About screen grants "version 2 of the License, or (at your option) any later version", which allows their use in this GPL-3.0 project.
- **Modern theme graphics** come from [jimnastic89/ModernScrambledNet](https://github.com/jimnastic89/ModernScrambledNet), a fork of the original. Its About text uses the same "version 2 or any later version" grant. The repository has no separate license file.
- **Title logo** (`public/assets/title.png`) was made for this project from the original app icon.
