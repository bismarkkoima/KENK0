# Releasing Kenko

Everything in the app is already configured for store builds:

| Setting | Value |
| --- | --- |
| App name | Kenko |
| iOS bundle ID / Android package | `com.bismarkkoima.kenko` (permanent once published) |
| Version | 1.0.0 (build numbers increase automatically on production builds) |
| Icon & splash | `assets/images/` — icon source SVGs can be regenerated if needed |
| Android permissions | Camera, Internet, Vibrate, Physical activity, Notifications (storage, overlay and microphone are blocked) |
| iOS usage texts | Camera (barcode scanning), Motion (steps); no export-compliance prompt |

Build profiles live in `eas.json`:

- **preview** — Android `.apk` / iOS ad-hoc build you can install directly on test phones.
- **production** — store builds (Android App Bundle, iOS App Store build).

## 1. One-time setup

```bash
npm install -g eas-cli
eas login            # your Expo account (free: https://expo.dev/signup)
eas init             # links this project to your Expo account (adds a projectId to app.json)
```

Commit the change `eas init` makes to `app.json`.

## 2. Test build on your phone

**Android** — installs straight onto any Android phone:

```bash
eas build --profile preview --platform android
```

When it finishes, open the link or scan the QR code on the phone, download the `.apk` and
install it (allow "Install unknown apps" for your browser once).

**iPhone** — needs an [Apple Developer account](https://developer.apple.com/programs/)
(US$99/year):

```bash
eas device:create    # register your iPhone (open the link on the phone)
eas build --profile preview --platform ios
```

Open the install link on the registered iPhone.

## 3. Store builds

```bash
eas build --profile production --platform all
```

### Google Play

1. Create a [Google Play developer account](https://play.google.com/console/signup)
   (one-time US$25).
2. In Play Console, create the app **Kenko**, category **Health & Fitness**.
3. Upload the first `.aab` by hand (Play requires this once), or set up a service account key
   and run `eas submit --platform android` (uploads to the Internal testing track).
4. Fill in the store listing (`docs/store-listing.md`), content rating questionnaire, target
   audience (13+), **Data safety** form (answers below) and the **Health apps** declaration.
5. Privacy policy URL: publish `docs/privacy-policy.md` somewhere public — for example enable
   GitHub Pages for this repo, or make the repo public and use the file's GitHub link.

### App Store

1. In [App Store Connect](https://appstoreconnect.apple.com), create the app with bundle ID
   `com.bismarkkoima.kenko`.
2. `eas submit --platform ios` uploads the build to TestFlight.
3. Fill in the listing (`docs/store-listing.md`), privacy policy URL, and **App Privacy**
   ("Data Not Collected" — see below), then submit for review.

## Data safety / App Privacy answers

Kenko has no servers and doesn't collect data in the stores' sense ("collected" means sent off
the device to the developer or third parties for their use).

- **Google Play Data safety:** _Does your app collect or share any of the required user data
  types?_ → **No.** Data is processed only on the device. Note in the description that food
  searches go to Open Food Facts (a search query, not personal data).
- **Data encrypted in transit:** Yes (HTTPS for food lookups).
- **Users can request deletion:** Yes — uninstalling deletes all data; entries can be deleted
  in the app.
- **Apple App Privacy:** **Data Not Collected.**

## After launch

- Ship JavaScript-only fixes instantly with EAS Update (`npx expo install expo-updates`, then
  `eas update`), or rebuild with `eas build` for native changes.
- Bump `version` in `app.json` for each store release (e.g. 1.0.1); build numbers increase
  automatically.
