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

## Credits
- Original Game Idea: KNetWalk / Ian Cameron Smith
- Modern Assets: [jimnastic89/ModernScrambledNet](https://github.com/jimnastic89/ModernScrambledNet)
- Webapp Conversion: Jonathan Searra
