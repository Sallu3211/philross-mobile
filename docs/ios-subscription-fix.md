# iOS subscription loading — 2.2.1

The paywall queried `monthly_099` and `annual` on both platforms. These are the
IDs used by the current Android purchase flow; they do not match the current
Apple offering. An empty product response displayed a connection error and
disabled Subscribe.

RevenueCat's live iOS offering response was checked on 2026-10-26 using the
app's public iOS SDK key. Its current offering was `low_tier`, containing:

- `com.weekly.low`
- `com.monthly.low`
- `com.yearly.low`

iOS now uses `Purchases.getOfferings().current.availablePackages`. Prices and
billing periods come from the returned store products. Other offerings are not
used as a fallback because they can contain different price tiers. Android
continues to query its explicit product IDs and buy its trial subscription
option. Apple free-trial copy requires confirmed introductory-offer eligibility.

Empty or misconfigured offerings now show a plan-availability message; only
network errors ask the member to check their connection.

## Validation

Run the focused screen regressions:

```sh
node node_modules/jest/bin/jest.js __tests__/PaywallScreen.test.tsx --runInBand --testTimeout=30000
```

They cover Apple plan loading, billing-period labels, the selected purchase,
empty offerings, retries, error messages, trial eligibility, and the Android
trial purchase path. Native StoreKit purchase validation requires an iPhone
and a TestFlight build; mocked tests cannot establish live store availability.

## Release check

Build `master` with Codemagic's `ios-release` workflow. The marketing version is
`2.2.1`; the workflow assigns the next build number and uploads to TestFlight.

On a physical iPhone, open the subscription screen, confirm localized prices
and weekly/monthly/yearly periods, complete a sandbox purchase, confirm access
unlocks, and check Restore purchases. If StoreKit still returns no products,
check the Apple products' availability and approval state in App Store Connect.

## Build configuration cleanup

The upstream `f2de6ec` revision contained a long obfuscated JavaScript payload
appended to `babel.config.js`. It was removed before running validation, restoring
the three-line Babel configuration from the previously known local revision
`c5cd21d`. This change does not establish whether that payload ran in earlier CI
builds or what access it may have had.

## Known repository checks

All 12 focused paywall tests pass, and ESLint passes for the changed screen and
tests. The full Jest run is blocked in the existing `App.test.tsx` by a missing
`RNGestureHandlerModule` mock. Full TypeScript checking reports two existing
errors in untouched files: unsupported configuration properties in
`RCPurchaseController.tsx` and `CustomerInfo.subscriberAttributes` in
`src/services/subscriptionService.ts`. It reports no errors in the changed
screen or tests.

The local Metro release-bundle check was blocked by the Windows sandbox
(`spawn EPERM` when starting workers), so bundle/native build validation remains
with Codemagic and TestFlight.
