# Master Phil / PhilRoss — Mobile App Project Status

**Last updated:** 2026-08-10
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
| Active work branch | `feat/dashboard-ui` — all UI work since 6 Aug lives here, **not yet merged to `master`** |
| Repo owner account | `Sallu3211` |
| Pushed via | `byterisellc` GitHub account (has write access) |
| Commit author identity | `PhilRoss Dev <info@byterisellc.com>` |
| Bundle ID / Package | `com.philross` (same on both platforms) |
| Apple Team ID | `5YVZZNUTR7` |
| Android version | `versionCode 26`, `versionName 1.5` |
| iOS version | `MARKETING_VERSION 1.8`, build auto-incremented by CI |
| Backend API | `https://api.philross.com/` |
| Package manager | Yarn 1.22.10 (`yarn.lock` is authoritative) |
| Node required | >= 18 (CI uses 20.19.0) |
| CI/CD | Codemagic (`codemagic.yaml`) |
| Sync status | `95d3c21` on `feat/dashboard-ui` — committed locally, **push pending re-auth** |
| Backend host | AWS EC2 `18.225.28.46`, `us-east-2` (Ohio), Ubuntu + nginx 1.24 — see §11 |

---

## 2. What The App Does

A coaching / membership mobile app built around Master Phil's content and services. Feature areas visible in the codebase:

| Area | Screens |
|---|---|
| **Home** | Dashboard — greeting, progress, trial state, continue rail, explore grid, latest from the feed |
| **Auth** | Login, Sign Up, Forgot Password, New Password — plus Google Sign-In and Apple Sign-In |
| **Content feed** | Feed, Feed Details |
| **Courses** | Courses list, Course Details |
| **Coaching** | My Coach, Coach Details, Intake Form, Application Confirmation |
| **Events** | Events list, Event Details |
| **Commerce** | Products, Product Details |
| **Media** | Video screen with custom video player |
| **Account** | Profile, Paywall |
| **Marketing/Info** | About, Contact, Testimonials |
| **System** | Splash screen, offline banner / no-internet screen |

**Monetisation:** entitlements and purchases are handled by **RevenueCat**, against an **in-app paywall** (`src/screens/PaywallScreen.tsx`). Two products, both with a 7-day free trial:

| Product ID | Price | Trial |
|---|---|---|
| `monthly_099` | $5.99 / month | 7 days |
| `annual` | $59.99 / year | 7 days |

The paywall reads products by **explicit ID** rather than through `getOfferings()`, because the RevenueCat Offering still points at a legacy `low` product. On Android it buys the *subscription option* carrying the free phase — buying the product directly skips the trial.

⚠️ **The subscription unlocks feed tutorials only.** Courses are sold separately through external Stripe links ($199–$499). See §8 open item 1.

**Superwall is disabled.** `Superwall.configure()` is commented out in `App.tsx`. Its dashboard campaign fired on implicit placements, so removing the SDK *call* was not enough — the whole SDK had to be switched off. `RCPurchaseController.tsx` and `MySuperwallDelegate.tsx` remain in the tree but are inert.

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
│   ├── theme/index.ts          ← ⭐ colour, type, spacing, radius tokens.
│   │                             Every screen resolves through this.
│   ├── screens/                ← all 24 app screens (see feature table above)
│   ├── navigation/
│   │   ├── AppNavigator.tsx    ← ⭐ single source of truth for routing
│   │   └── navigationRef.ts    ← lets services navigate without importing App
│   ├── components/
│   │   ├── ui/                 ← ⭐ shared kit: ScreenHeader, SearchBar,
│   │   │                         FilterChips, StateView, MediaListCard,
│   │   │                         ProgressRing, LinearMeter, StatusChip, icons
│   │   ├── SideMenu.tsx        ← the drawer; SOCIAL_LINKS map lives here
│   │   ├── VideoPlayer.tsx     ← VideoPlayerNew (course player)
│   │   └── NoInternetBanner / NoInternetScreen
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
| **AWS** | Hosts the backend — see §11 | EC2 in `us-east-2`, account `070634855513` |
| **Superwall** | ⚠️ **DISABLED** — see §2 | `App.tsx` (`Superwall.configure()` commented out) |
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

**Read this honestly:** ~90% of the work in phases 1–6 was **build, signing and release infrastructure**, not product features. The pipeline went green and started shipping to TestFlight automatically, which is what freed up phases 7–11 below.

### Phase 7 — Security (6 Aug)
| Commit | What |
|---|---|
| `4cef89f` | 🔴 **Removed an obfuscated ~5KB payload from `react-native.config.js`** |

> It had been present since the very first commit (`4cf0cd5`) and therefore ran on every developer machine and every Codemagic build since day one. Credentials that were exposed to build machines during that window should be treated as compromised and rotated.

### Phase 8 — Dashboard, payments, auth (6–7 Aug)
| Commit | What |
|---|---|
| `d4032c7` | Dashboard replaces the feed as the home screen; profile screen added |
| `162d11a` | 🔴 **Superwall's hosted paywall replaced with an in-app one** |
| `634e72f` | Auth screens redesigned; dashboard progress no longer reads 100% |
| `a4995b3` | Montserrat registered with the iOS project |
| `14ad24a` | Profile save fixed; paywall presented as a screen, not a modal |

> Two real bugs behind these. The dashboard read `course_completed`, which the API returns as a **percentage string** (`"0 %"`), as a boolean — any non-empty string is truthy, so everything showed 100%. And profile save posted `first_name`/`last_name` when the API only accepts a single `full_name`.
>
> Superwall was removed rather than reconfigured: its campaign fired on *implicit* placements, so deleting the SDK call was not enough to stop it appearing. `Superwall.configure()` is now disabled entirely and `PaywallScreen` reads products by explicit ID.

### Phase 9 — Store setup & local builds (7–8 Aug)
| Commit | What |
|---|---|
| `cbeb50c` | Android release workflow made runnable; bumped to 26 (1.5) |
| `5fdf048` | iOS build-number increment fixed; bumped to 1.8 |

> Play Console and App Store Connect both now carry `monthly_099` ($5.99) and `annual` ($59.99) with **7-day free trials**. On Android the trial only applies if the app buys the *subscription option* carrying the free phase — buying the product directly skips it.
>
> The dev loop also moved off CI. Builds run locally over USB; Codemagic is for releases.

### Phase 10 — Side menu & design system (8 Aug)
| Commit | What |
|---|---|
| `2b7eb44` | Side menu rebuilt; one hamburger across every screen |
| `a0fc892` | ⭐ **Shared UI kit added** (`src/components/ui/`); Courses rebuilt on it |

### Phase 11 — Full screen revamp (8–10 Aug)
| Commit | What |
|---|---|
| `a75b5db`, `f2da21a` | Products (one column, artwork no longer cropped), Events, Feed |
| `2e29aba` | Testimonials — and **removal of fabricated fallback testimonials** |
| `789ff13` | About, My Coach |
| `f1d1116` | Contact, Product details |
| `2366491` | Feed details, Event details |
| `fe3d452` | Course details |
| `dd75d3e` | Coach details, Video, Application confirmation |
| `adf4ab8` | Intake form; dead video player retired |

**Crashes fixed along the way**, all of which predate this work:
- `ProductDetailsScreen` called `<ShareIcon>` in its header without importing it — the screen died on open.
- `src/types/course` was imported by `VideoPlayer` but had never been committed, breaking types for everything that touched the player. The component needing it turned out to be dead; both are now gone.
- Testimonials shipped hard-coded fake reviews ("Sarah J.", "David M.") using the Apple and Google logos as avatars, shown whenever the API returned nothing.

Every screen in `src/` now resolves through `src/theme` and the shared `ui/` kit. The old `getFontFamily` / `getColors` helpers have no remaining callers.

### Phase 12 — Progress, legal, and the backend reckoning (10 Aug)
| Commit | What |
|---|---|
| `d5aba94` | Project doc brought back in line with the code |
| `4221ace` | In-app legal pages; tutorial completion; feed routing fix |
| `0929b8e` | **Dashboard percentage made correct** |
| `6eb9db6` | Tutorials split from courses; About heading; name edit persists |
| `95d3c21` | Profile + tutorial progress rewritten **server-first** |

**Three separate bugs were each producing a wrong percentage.** The denominator was a *page* (`limit: 12`) rather than the catalogue, so one completed tutorial out of 88 read as 8%. The denominator also *moved with your progress* — it narrowed to "courses you have started", so finishing your first of six jumped the ring from 17% to 100%. And `Math.round` showed 100% at 99.6% and 0% at 0.4%, the two values people actually check. [`src/utils/percent.ts`](src/utils/percent.ts) now reserves 0 and 100 for the exact values.

**The hero ring measures tutorials only** (88 of them). Courses — 6, sold externally at $199–$499, owned by almost nobody — get their own tile. Averaging six zeroes against 88 tutorials produced a number that described nothing.

**Wireless debugging replaced the USB cable** for the dev loop, after the cable was hanging the test phone. `adb pair` + `adb connect` over Wi-Fi; `adb reverse` works the same.

**A live-schema audit ended the guessing about the backend.** `GET /swagger/?format=openapi` returns 30 paths, and none of them read or write a profile or tutorial progress. That is why the name change never saved. See §12.

---

## 8. Current State & Known Issues

✅ **Working**
- iOS builds automatically on push to `master` and lands in TestFlight with no manual steps
- Android release `.aab` builds successfully, locally and in CI
- Privacy Policy and Terms of Use pages published for store review
- RevenueCat entitlement flow with an **in-app** paywall on the real products, 7-day trial on both
- Every screen on one design system: Montserrat, brand tokens, shared header / search / filter / state components
- `tsc --noEmit` clean across `src/` apart from the two payment-code errors listed below

🔴 **Open items**

*Product decisions — need the client*
1. **The paywall over-promises.** Its copy says "Every structured training programme", but the subscription unlocks **feed tutorials only** — courses are sold separately through external Stripe links at $199–$499. Either the copy narrows or courses come inside the subscription. This is a commercial decision, not a code one.
2. **Applications do not say which programme they are for.** `IntakeFormScreen` receives `coachId` on the route but the payload's `coach` field was commented out before this work. Adding it back is a backend question — confirm the API accepts it first.

*Backend gaps — see [BACKEND-REQUIREMENTS.md](BACKEND-REQUIREMENTS.md) for the fix*
3. 🔴 **The API has no profile endpoint.** Not "it's broken" — the route was never created. Confirmed against the live OpenAPI schema: 30 paths, none of which read or write a user. So changing your name cannot reach the server, and the app falls back to saving on the device. **~15 minutes of Django work** and it is fixed; the app already sends the right request.
4. 🔴 **No tutorial-progress endpoint either.** Completions live only on the phone, so a reinstall wipes them. The app is already written server-first — `loadAll()` asks the server and only falls back to its cache — so the two endpoints in the requirements doc are all that is needed.
5. 🟡 **`POST /course/{id}/video_watched/` exists but ignored its body.** Every field was commented out in the app, so the server received a bare ping and could never know a watch percentage — which is why `course_completed` returns `"0 %"` regardless. The app now sends real data; the view still needs to read it, and there is still no GET to read progress back.
6. ✅ **Subscriptions are not a gap after all.** `/payments/webhooks/revenuecat/` **does exist** in the schema — an earlier version of this document was wrong to say the backend knows nothing about them.

*Housekeeping*
7. **Splash logo is blank.** Commit `41b64b5` removed the logo as a stopgap for the Android 12+ crop/zoom bug. Note that every current logo asset bakes in a black background with **no alpha channel**, which is why the side-menu masthead sits on pure black — a transparent PNG would fix both.
8. **Two pre-existing type errors in payment code.** `RCPurchaseController` passes `automaticDeviceIdentifierCollectionEnabled`, which the RevenueCat SDK does not declare, and `subscriptionService` reads `subscriberAttributes` off `CustomerInfo`, where it does not exist. Both are no-ops at runtime; neither was touched by the UI work.
9. **Android Play Store upload is manual.** The `google_play:` block in `codemagic.yaml` is commented out; needs a Play Console service-account JSON wired in as a Codemagic integration.
10. **Keystore passwords are in `android/app/build.gradle`** in plain text. They belong in `gradle.properties` outside the repo, or in Codemagic environment variables.
11. **`yarn.lock` is not committed**, so builds are not reproducible.
12. **`safe-area-context` patch version mismatch.** The patch targets 5.5.2 while `package.json` requests `^5.6.0` — a clean `yarn install` may fail to apply it.
13. **`README.md` is still the default React Native boilerplate.**
14. **Dev API config has a hardcoded LAN IP** (`10.190.211.97` in `app/config/apiConfig.js`) that must be updated whenever the dev machine's Wi-Fi address changes. Production is unaffected.

> ⚠️ **Rotate credentials exposed to build machines.** See Phase 7 — the obfuscated payload ran on Codemagic from the first commit until 6 Aug.

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
| **Any colour, font size or spacing** | `src/theme/index.ts` — change it once, it changes everywhere |
| A header, search box, filter row, empty/error state | `src/components/ui/` — do not hand-roll another one |
| A new icon | `src/components/ui/icons.tsx` — solid fill, 24px grid, one path |
| Menu items or social links | `src/components/SideMenu.tsx` (`SOCIAL_LINKS` map) |
| Text, shared constants | `app/config/constants.js` |
| API endpoint or timeout change | `app/config/apiConfig.js`, `src/network/index.ts` |
| Paywall copy, pricing, entitlement behaviour | `src/screens/PaywallScreen.tsx`, `src/services/subscriptionService.ts`, RevenueCat dashboard |
| Purchase or restore logic | `RCPurchaseController.tsx` |
| Logo, icons, splash art | `assets/icons/`, `assets/bootsplash/`, plus native folders |
| Privacy policy / terms wording | [`src/screens/LegalScreen.tsx`](src/screens/LegalScreen.tsx) for the in-app pages, plus `docs/*.html` for the public ones |
| Anything the server must store | It probably does not exist yet — check [BACKEND-REQUIREMENTS.md](BACKEND-REQUIREMENTS.md) first |
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

---

## 11. The Backend — Where It Lives and How To Reach It

Discovered by inspection on 10 Aug 2026, because nobody had written it down.

| Fact | Value | How we know |
|---|---|---|
| Host | `18.225.28.46` | `nslookup api.philross.com` |
| Platform | **AWS EC2**, `us-east-2` (Ohio) | Reverse DNS: `ec2-18-225-28-46.us-east-2.compute.amazonaws.com` |
| OS / web server | Ubuntu, nginx 1.24.0 | `Server:` response header |
| Stack | Django + Django REST Framework | `/swagger/`, `/redoc/`, `/admin/`, `/ckeditor5/` all respond |
| Auth | JWT | `/accounts/token/refresh/` |
| AWS account | `070634855513` | Console sign-in URL in the handover doc |
| SSH (port 22) | Open | `Test-NetConnection 18.225.28.46 -Port 22` |

**It is an ordinary server, not a managed platform.** No Elastic Beanstalk, no Lambda, no container service. That means the Django source lives *on that instance* and changes are made by connecting to it — there is no build pipeline in front of it that we know of, and **no copy of the backend source in any repository we hold.**

### Getting access

The AWS CLI is installed on this machine (`aws-cli/2.36.17`). It needs an IAM **access key pair** — not the console password, which is for browser sign-in only:

```bash
aws configure        # Access Key ID, Secret Access Key, region us-east-2, json
```

Create the key at **AWS Console → your username → Security credentials → Create access key → CLI**.

With that, the routes to a shell, in order of preference:
1. **SSM Session Manager** — `aws ssm start-session --target i-…`. No SSH key needed. Requires the SSM agent and an instance role.
2. **EC2 Instance Connect** — `aws ec2-instance-connect send-ssh-public-key`. Pushes a temporary key.
3. **The original `.pem`** — only if the handover included one.

### ⚠️ Security

The handover document contains **live AWS root credentials and an IAM console password**, both belonging to a departed contractor, stored in Google Drive.

- **Rotate both.** They should be assumed compromised.
- **Enable MFA on root** and then stop using it. AWS's own guidance is that root is for account recovery and billing, never day-to-day work.
- Give each person their own IAM user, so access can be revoked individually.

Note this is a *separate* exposure from the Codemagic one in Phase 7. Both need rotating.

---

## 12. What The Backend Is Missing

Confirmed against the live schema, not assumed:

```bash
curl -s "https://api.philross.com/swagger/?format=openapi"
```

**30 paths.** None of them read or write a user profile. None of them read or write tutorial progress.

| Missing | Breaks | Effort |
|---|---|---|
| `GET`/`PATCH /accounts/profile/` | Name change cannot save — the visible bug | ~15 min |
| `GET /feed/progress/` + `POST /feed/{slug}/completed/` | Completed tutorials lost on reinstall | ~1 hr |
| Body handling in `video_watched/` + `GET /course/progress/` | `course_completed` always returns `"0 %"` | ~1 hr |

**The app is already written for all three.** `src/services/tutorialProgress.ts` asks the server first and only falls back to its device cache; `updateProfile` sends the correct PATCH; `updateVideoProgress` now sends a real body instead of the empty one it had. Nothing on the mobile side changes when these ship, and **no app release is needed** — the calls simply stop returning 404.

Full contracts and Django implementations: **[BACKEND-REQUIREMENTS.md](BACKEND-REQUIREMENTS.md)**.
