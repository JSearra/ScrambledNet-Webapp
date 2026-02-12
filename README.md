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

This app is prepared for submission to F-Droid.

### Steps to Submit

1.  **Fork F-Droid Data**: 
    Go to [https://gitlab.com/fdroid/fdroiddata](https://gitlab.com/fdroid/fdroiddata) and fork the repository.

2.  **Add Metadata**:
    Copy the file `metadata/com.jsearra.scramblednet.yml` from this repository into the `metadata/` folder of your forked `fdroiddata` repository.

3.  **Create Merge Request**:
    Submit a Merge Request (MR) on GitLab to include your new file. The F-Droid build server will attempt to build your app using the instructions in the metadata file.

### Compliance
- **License**: ensuring the project is Open Source (GPL-3.0).
- **Assets**: Ensure all assets (images/sounds) are compatible with the license.
- **Dependencies**: Uses standard npm packages and Capacitor, which are F-Droid compatible.

## Credits
- Original Game Idea: KNetWalk / Ian Cameron Smith
- Modern Assets: [jimnastic89/ModernScrambledNet](https://github.com/jimnastic89/ModernScrambledNet)
- Webapp Conversion: Jonathan Searra
