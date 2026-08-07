# Master Phil / PhilRoss — Mobile App Project Status

**Last updated:** 2026-08-06
**Purpose:** Single reference for what this app is, where every piece lives, what has been done so far, and how to safely make the next client revision.

---

## 1. At a Glance

| Item | Value |
|---|---|
| Product name | Master Phil (internal/package name: `philross`) |
| Platform | React Native 0.80.2 (iOS + Android), React 19.1.0, TypeScript 5.0.4 |
| Local folder | `d:\arab projects code\master phil app` |
| GitHub repo | https://github.com/Sallu3211/philross-mobile.git |
| Default branch | `master` (⚠️ not `main`) |
| Repo owner account | `Sallu3211` |
| Pushed via | `byterisellc` GitHub account (has write access) |
| Commit author identity | `PhilRoss Dev <info@byterisellc.com>` |
| Bundle ID / Package | `com.philross` (same on both platforms) |
| Apple Team ID | `5YVZZNUTR7` |
| Android version | `versionCode 25`, `versionName 1.4` |
| iOS version | `MARKETING_VERSION 1.7`, build auto-incremented by CI |
| Backend API | `https://api.philross.com/` |
| Package manager | Yarn 1.22.10 (`yarn.lock` is authoritative) |
| Node required | >= 18 (CI uses 20.19.0) |
| CI/CD | Codemagic (`codemagic.yaml`) |
| Sync status | Local and GitHub fully in sync at commit `652a64d`, clean tree |

---

## 2. What The App Does

A coaching / membership mobile app built around Master Phil's content and services. Feature areas visible in the codebase:

| Area | Screens |
|---|---|
| **Auth** | Login, Sign Up, Forgot Password, New Password — plus Google Sign-In and Apple Sign-In |
| **Content feed** | Feed, Feed Details |
| **Courses** | Courses list, Course Details |
| **Coaching** | My Coach, Coach Details, Intake Form, Application Confirmation |
| **Events** | Events list, Event Details |
| **Commerce** | Products, Product Details |
| **Media** | Video screen with custom video player |
| **Marketing/Info** | About, Contact, Testimonials |
| **System** | Splash screen, offline banner / no-internet screen |

**Monetisation:** paywalls are driven by **Superwall**, and entitlements/purchases are handled by **RevenueCat**. The two are bridged by a custom purchase controller so Superwall knows the real subscription state.

---

## 3. Repository Map — Where Everything Lives

```
master phil app/
├── App.tsx                     ← app root; Superwall init, nav bootstrap, push setup
├── index.js                    ← RN entry point
├── RCPurchaseController.tsx    ← RevenueCat ↔ Superwall bridge (Purchases.configure lives here)
├── MySuperwallDelegate.tsx     ← Superwall event/analytics delegate
├── RedemptionResults.ts        ← promo-code / redemption result handling
├── codemagic.yaml              ← CI/CD: iOS + Android release pipelines
├── package.json                ← dependencies, scripts, patch-package postinstall
│
├── src/
│   ├── screens/                ← all 21 app screens (see feature table above)
│   ├── navigation/
│   │   └── AppNavigator.tsx    ← ⭐ single source of truth for routing
│   ├── components/             ← FeedCard, Loader, SideMenu, VideoPlayer,
│   │                             NoInternetBanner, NoInternetScreen
│   ├── context/
│   │   ├── UserContext.tsx     ← ⭐ logged-in user state
│   │   └── NetworkProvider.tsx ← connectivity state
│   ├── services/
│   │   └── subscriptionService.ts ← ⭐ paywall + entitlement logic
│   ├── network/index.ts        ← axios instance / API layer
│   ├── data/, hooks/, types/, utils/, examples/
│
├── app/
│   ├── config/
│   │   ├── apiConfig.js        ← ⭐ API base URLs + timeouts + retry
│   │   └── constants.js        ← app-wide constants
│   ├── assets/, helpers/, res/
│
├── assets/
│   ├── bootsplash/             ← splash screen images
│   └── icons/                  ← app icons
│
├── docs/                       ← GitHub Pages legal pages (public-facing)
│   ├── privacy-policy.html     ← required by App Store / Play Store
│   └── terms-of-use.html       ← required by App Store
│
├── patches/                    ← ⚠️ 10 patch-package fixes — see §6
├── android/                    ← versionCode/versionName in android/app/build.gradle
├── ios/                        ← philross.xcworkspace / philross.xcodeproj
└── __tests__/                  ← Jest tests
```

⭐ = the files you will most often touch for a client revision.

---

## 4. Third-Party Services & Where Their Keys Live

| Service | Purpose | Where configured |
|---|---|---|
| **Superwall** | Paywall UI + presentation logic | `App.tsx` ~line 294 (platform-split publishable `pk_` keys) and `Superwall.configure()` ~line 392 |
| **RevenueCat** | Subscriptions, entitlements, receipt validation | `RCPurchaseController.tsx` ~line 27 (`Purchases.configure`) |
| **Firebase** | Push messaging (`@react-native-firebase/messaging`) | `android/app/google-services.json`, `ios/.../GoogleService-Info.plist` |
| **Google Sign-In** | Social auth | `GoogleSignin.configure` in the auth flow |
| **Apple Sign-In** | Social auth (required by Apple when Google login exists) | `@invertase/react-native-apple-authentication` |
| **CleverTap** | Analytics / engagement | `clevertap-react-native` |
| **App Store Connect** | iOS signing + TestFlight upload | Codemagic env group `appstore_credentials` |
| **Google Play** | Android release | Codemagic env group `android_credentials` (publishing still commented out) |

> The Superwall keys in `App.tsx` are **publishable client keys**, safe to ship in the binary. The genuinely secret values (App Store Connect private key, Android keystore + passwords, Play service account JSON) live **only in Codemagic environment variable groups** — never in this repo.

---

## 5. Build & Release Pipeline (Codemagic)

Defined in [`codemagic.yaml`](codemagic.yaml). **Both workflows trigger automatically on every push to `master`.**

### `ios-release` — "PhilRoss iOS Release"
Runs on `mac_mini_m2`, Xcode latest, Node 20.19.0. Steps:
1. `yarn install --frozen-lockfile`
2. `cd ios && pod install`
3. Decode `CERTIFICATE_PRIVATE_KEY_B64` → fetch/create App Store signing files
4. Initialise keychain, add certificates
5. `xcode-project use-profiles --project ios/philross.xcodeproj` (scoped to our project only — see §7)
6. Auto-increment build number from the latest TestFlight build
7. `xcode-project build-ipa`
8. **Auto-publishes to TestFlight**, emails `info@byterisellc.com` on success *and* failure

Env group required in Codemagic UI: `appstore_credentials` → `APP_STORE_CONNECT_ISSUER_ID`, `APP_STORE_CONNECT_KEY_IDENTIFIER`, `APP_STORE_CONNECT_PRIVATE_KEY`, `CERTIFICATE_PRIVATE_KEY_B64`.

### `android-release` — "PhilRoss Android Release"
Runs on `linux_x2`, Java 17. Decodes the base64 keystore, then `./gradlew bundleRelease`, producing an `.aab`.

⚠️ **Play Store upload is NOT active** — the `google_play:` publishing block is commented out pending a Play Console service-account JSON. Android releases are currently manual uploads of the artifact.

Env group required: `android_credentials` → `CM_KEYSTORE` (base64), `CM_KEYSTORE_PASSWORD`, `CM_KEY_ALIAS`, `CM_KEY_PASSWORD`.

---

## 6. Patched Dependencies (`patches/`) — Handle With Care

This project uses **patch-package** via a `postinstall` hook. Ten dependencies carry local patches:

```
@react-native-community+netinfo+11.4.1
@superwall+react-native-superwall+2.1.7    ← pins native SuperwallKit to 4.16.1
react-native-device-info+14.0.4
react-native-encrypted-storage+4.0.3
react-native-image-crop-picker+0.50.1
react-native-image-picker+8.2.1
react-native-linear-gradient+2.8.3
react-native-orientation-locker+1.7.0
react-native-safe-area-context+5.5.2       ← ⚠️ patch is for 5.5.2, package.json wants ^5.6.0
react-native-share+12.1.2
```

**Rule:** never bump any of these packages without checking whether its patch still applies. A silently failing patch will break the CI build, usually at the native compile step.

---

## 7. Complete History — What Has Happened So Far

23 commits, all authored by `PhilRoss Dev`, spanning **28–30 July 2026**. Grouped by theme:

### Phase 1 — Rebrand & baseline (28 Jul)
| Commit | What |
|---|---|
| `4cf0cd5` | Initial commit: baseline codebase + new logo swapped across Android, iOS, splash and header |
| `fbe8c1d` | Pinned `react-native-screens` to 4.13.1; added Codemagic CI config |
| `eda1d49` | Fixed Codemagic branch trigger (`main` → `master`) and notification email |
| `245c249` | Bumped version to 22 (1.1) for release |

> Note the `main` → `master` fix — the repo's default branch is `master`, and CI silently never fired until this was corrected.

### Phase 2 — Splash screen bug hunt (30 Jul)
| Commit | What |
|---|---|
| `0f745f5` | Fixed Android 12+ splash showing a cropped/zoomed app icon |
| `ad75332` | Bumped to 23 (1.2) for the splash fix release |
| `05e61b0` | Fixed `RNBootSplash.init` using stale `BootSplashTheme` instead of `BootTheme` |
| `41b64b5` | 🔴 **Blanked the splash logo as a stopgap** for the crop/zoom bug |

> This is the app's main outstanding piece of technical debt — see §8.

### Phase 3 — Legal pages for store compliance (30 Jul)
| Commit | What |
|---|---|
| `43abe6a` | Added privacy policy & terms of use pages for GitHub Pages |
| `d2e279d` | Updated privacy policy contact email to `info@philross.com` |
| `652a64d` | Added a dedicated Terms of Use page (Apple requires it separately from the privacy policy) |

### Phase 4 — iOS codesigning battle (30 Jul)
| Commit | What |
|---|---|
| `616d72c` | Bumped iOS to 1.7 (build 2) to trigger a fresh Codemagic build |
| `4337c97` | Fixed codesigning step failing on third-party pod `.xcodeproj` files |
| `7747749` | Scoped codesigning to the app's own `.xcodeproj` only |
| `3035f75` | Added the missing App Store Connect signing-file fetch step |
| `7893bb9` | Supplied our own private key for distribution certificate creation |
| `2165090` | Base64-encoded the certificate private key to stop multi-line env var corruption |

### Phase 5 — Xcode 26.4 toolchain breakage (30 Jul)
| Commit | What |
|---|---|
| `8ca4ff8` | Fixed `fmt` pod compile failure under Xcode 26.4's stricter C++20 rules |
| `18b85c1` | Bumped `react-native-purchases` 7.28.1 → 8.6.2 to fix the iOS build |
| `c7c5f4b` | Patched Superwall native SDK pin 4.5.0 → 4.16.1 for Xcode 26.4 |
| `e4df202` | Fixed switch-exhaustiveness errors introduced by the SuperwallKit bump |

### Phase 6 — Release automation (30 Jul)
| Commit | What |
|---|---|
| `dd1df47` | Enabled auto-publish to TestFlight |
| `f7c80cc` | Declared export compliance, removing a manual TestFlight step on every build |

### Effort distribution
| Area | Commits |
|---|---|
| `codemagic.yaml` (CI/CD) | 9 |
| `android/` | 6 |
| `ios/` | 5 |
| `docs/` (legal pages) | 3 |
| `patches/` | 3 |
| `package.json` | 3 |
| `src/` (app features) | 2 |

**Read this honestly:** ~90% of the work so far has been **build, signing and release infrastructure**, not product features. The pipeline is now green and shipping to TestFlight automatically, so future effort can go into the app itself.

---

## 8. Current State & Known Issues

✅ **Working**
- iOS builds automatically on push to `master` and lands in TestFlight with no manual steps
- Android release `.aab` builds successfully in CI
- Privacy Policy and Terms of Use pages published for store review
- Superwall + RevenueCat paywall/entitlement flow wired end-to-end

🔴 **Open items**
1. **Splash logo is blank.** Commit `41b64b5` removed the logo as a stopgap for the Android 12+ crop/zoom bug. The app currently launches to an empty splash. *This is the highest-visibility unfinished item for the client.*
2. **Android Play Store upload is manual.** The `google_play:` block in `codemagic.yaml` is commented out; needs a Play Console service-account JSON wired in as a Codemagic integration.
3. **Version numbers have drifted apart.** Android is at `1.4 (25)`, iOS at `1.7`. Worth reconciling to one marketing version before the next client-facing release.
4. **`safe-area-context` patch version mismatch.** The patch targets 5.5.2 while `package.json` requests `^5.6.0` — a clean `yarn install` may fail to apply it.
5. **`README.md` is still the default React Native boilerplate** — no project-specific setup instructions.
6. **Dev API config has a hardcoded LAN IP** (`10.190.211.97` in `app/config/apiConfig.js`) that must be updated whenever the dev machine's Wi-Fi address changes. Production is unaffected.

---

## 9. How To Make a Client Revision

### Setup (first time on a machine)
```bash
git clone https://github.com/Sallu3211/philross-mobile.git
cd philross-mobile
yarn install          # runs patch-package automatically
cd ios && pod install # macOS only
```

### Everyday workflow
```bash
git pull origin master
# ...make changes...
yarn lint
yarn test
git add -A
git commit -m "Describe the change"
git push origin master   # ⚠️ this immediately triggers a Codemagic build
```

### ⚠️ Critical: pushing to `master` ships to TestFlight
There is no staging branch. Any push to `master` starts an iOS build that auto-publishes to TestFlight. For work-in-progress, **use a feature branch** and only merge when the change is ready to reach testers.

### Before every release
1. Bump the version — Android: `versionCode` + `versionName` in `android/app/build.gradle`. iOS: `MARKETING_VERSION` in the Xcode project (CI handles the build number).
2. Confirm no patched dependency was bumped without updating its patch.
3. Push to `master`, then watch the Codemagic email to `info@byterisellc.com`.
4. Android only: download the `.aab` artifact from Codemagic and upload it to the Play Console manually.

### Where to make common changes
| Client asks for… | Go to |
|---|---|
| New screen / changed navigation | `src/navigation/AppNavigator.tsx` + `src/screens/` |
| Text, colours, shared constants | `app/config/constants.js` |
| API endpoint or timeout change | `app/config/apiConfig.js`, `src/network/index.ts` |
| Paywall / pricing / entitlement behaviour | `src/services/subscriptionService.ts`, Superwall dashboard |
| Purchase or restore logic | `RCPurchaseController.tsx` |
| Logo, icons, splash art | `assets/icons/`, `assets/bootsplash/`, plus native folders |
| Privacy policy / terms wording | `docs/privacy-policy.html`, `docs/terms-of-use.html` |
| Build, signing or release changes | `codemagic.yaml` |

---

## 10. Accounts & Access Checklist

| Thing | Who/what | Notes |
|---|---|---|
| GitHub repo owner | `Sallu3211` | Repo lives under this account |
| GitHub push credential | `byterisellc` | Cached in Windows Credential Manager |
| Codemagic notifications | `info@byterisellc.com` | Success and failure emails |
| Public contact email | `info@philross.com` | Used in the legal pages |
| Apple Developer Team | `5YVZZNUTR7` | Needed for signing |
| Superwall dashboard | — | Paywall content is edited here, not in code |
| RevenueCat dashboard | — | Products and entitlements defined here |

> **Note on this Windows machine:** git stores one credential per host, so the `byterisellc` token is used for *every* GitHub push here. If you later push to a repo that account cannot write to, set `git config --global credential.useHttpPath true` to allow per-repo credentials.
