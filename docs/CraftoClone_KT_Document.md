# CraftoClone Knowledge Transfer Document

Date: 2026-05-10

## 1. Purpose of This Document

This document is an in-depth knowledge transfer for the `CraftoClone` mobile application. It is intended to help a new developer, project owner, QA engineer, or support engineer understand:

- what the app does
- how the app is structured
- how the major user journeys work
- where data comes from and how it is stored
- how template rendering and poster generation work
- how premium subscription, FCM, and native integrations are wired
- what technical risks and cleanup items exist in the current codebase

The document is based on the current repository state in `D:\salim\CraftoClone`.

## 2. Product Summary

`CraftoClone` is a React Native mobile app that allows users to:

- log in using mobile OTP
- choose a preferred language
- set up a basic profile with name and photo
- browse categorized templates
- personalize templates with text, photo, logos, and profile details
- preview posters before export
- save posters to device storage
- share posters, with WhatsApp-focused sharing for non-premium users
- unlock premium editing capabilities through Razorpay-based subscription handling

At a high level, this is a personalized poster/video template application with localization, auth, premium upsell, export, and notification support.

## 3. High-Level Architecture

The app has five major layers:

1. Presentation layer
   Screens and reusable components render the UI, handle gestures, and connect to Redux.

2. State layer
   Redux Toolkit stores the current template, editor state, login flag, premium state, and customization state.

3. Service/API layer
   Axios-based API services call the backend for auth, templates, categories, language options, favorites, subscriptions, FCM registration, and presigned uploads.

4. Device integration layer
   Native/device features include image picking, file save/share, Firebase Cloud Messaging, video playback, view capture, and Razorpay checkout.

5. Persistence layer
   AsyncStorage stores auth tokens, language preference, user profile, and registered FCM token tracking.

### Simplified runtime flow

`App.js`
-> wraps Redux, Safe Area, Gesture Handler, i18n bootstrapping
-> `AppNavigator.js`
-> restores language and local login state
-> shows auth flow or app flow

Auth flow:
`LoginScreen` -> `OtpVerificationScreen` -> `LanguageSelectionScreen` -> `UserSetupScreen`

Main app flow:
`HomeScreen` -> `EditorScreen` -> `PreviewScreen`

## 4. Repository Structure

Important folders and files:

- `App.js`
  Root app component, provider wiring, FCM token sync trigger.

- `src/navigation/AppNavigator.js`
  Chooses between auth stack and main app stack.

- `src/store/`
  Redux store and `posterSlice`, which holds almost all editor and session UI state.

- `src/screens/`
  Main user-facing screens.

- `src/components/`
  Reusable UI pieces, template media rendering, configured layer rendering, poster preview, subscription modal, etc.

- `src/apiService/`
  Backend API wrapper functions.

- `src/services/`
  Higher-level business logic around subscription, media save/share, static templates, and FCM.

- `src/utils/`
  Constants, user storage helpers, template normalization, photo frame layout logic, and helper utilities.

- `src/i18n/`
  Internationalization setup and locale files.

- `android/` and `ios/`
  Native platform projects.

- `patches/`
  `patch-package` patch for `react-native-view-shot`.

## 5. Technology Stack

Core stack from `package.json`:

- React `19.2.3`
- React Native `0.84.1`
- React Navigation `7.x`
- Redux Toolkit
- Axios
- i18next and react-i18next
- AsyncStorage
- react-native-image-picker
- react-native-view-shot
- react-native-share
- react-native-fs
- react-native-video
- react-native-firebase/app
- react-native-firebase/messaging
- react-native-razorpay
- react-native-config

This is a JavaScript-first React Native project. TypeScript config exists, but the active codebase is primarily `.js`.

## 6. App Boot Sequence

### 6.1 App entry

`App.js` does the following:

- initializes i18n by importing `src/i18n`
- wraps the app in:
  - `GestureHandlerRootView`
  - Redux `Provider`
  - `SafeAreaProvider`
  - `SafeAreaView`
- mounts `AppNavigator`
- mounts `FcmTokenManager`

### 6.2 Startup restoration

`AppNavigator.js` performs app initialization:

- reads stored language from AsyncStorage
- validates it against supported languages
- changes i18n language
- reads stored user profile
- sets Redux `isLoggedIn` to `true` if local profile says the user is logged in

Until initialization is complete, a splash spinner is shown.

### 6.3 Navigation decision

- If `state.poster.isLoggedIn` is `false`, user sees auth screens.
- If `true`, user goes to main app screens.

## 7. Authentication Flow

### 7.1 LoginScreen

File: `src/screens/LoginScreen/index.js`

Responsibilities:

- collects mobile number
- validates minimum 10 digits
- calls `requestOtp(phone)` from `authApi`
- navigates to `OtpVerification`

Backend endpoint:

- `POST /v1/auth/request-otp`

Current assumptions:

- country code is fixed to `+91`
- UI is India-specific

### 7.2 OtpVerificationScreen

File: `src/screens/OtpVerificationScreen/index.js`

Responsibilities:

- accepts a 6-digit OTP
- calls `verifyOtp`
- stores `access_token` and `refresh_token` in AsyncStorage
- navigates to `LanguageSelection`

Backend endpoint:

- `POST /v1/auth/verify-otp`

Stored auth keys:

- `access_token`
- `refresh_token`

Important behavior:

- resend currently resets the timer and shows a toast
- resend does not currently call the backend to request a fresh OTP

### 7.3 Logout

Logout is triggered from `HomeScreen`.

Observed behavior:

- calls backend `logout()`
- removes FCM token from backend if available
- removes `access_token` and `refresh_token`
- dispatches `setIsLoggedIn(false)`

Risk:

- user profile persistence remains local unless explicitly overwritten
- the next maintainer should verify whether the persisted `user_profile.isLoggedIn` flag is also reset in all logout cases

## 8. Language Selection and Localization

### 8.1 Localization system

Files:

- `src/i18n/index.js`
- `src/i18n/storage.js`
- `src/i18n/locales/*.json`

Supported bundled languages currently include:

- English
- Hindi
- Marathi
- Gujarati
- Kannada
- Telugu
- Malayalam
- Tamil

### 8.2 Language source

The app uses two sources of language information:

- static bundled locale resources for text translations
- backend-supported language list fetched via `GET /v1/languages`

`LanguageSelectionScreen` fetches available languages from backend and formats them for display.

### 8.3 Language persistence

Stored key:

- `@CraftoClone:language`

## 9. User Setup Flow

File: `src/screens/UserSetupScreen/index.js`

Responsibilities:

- allows user to choose profile image from gallery
- captures user name
- requests a presigned upload URL from backend
- updates backend profile
- stores normalized user profile locally
- hydrates Redux with:
  - user name
  - user photo
  - premium status
  - premium profile
- triggers subscription sync
- marks session as logged in via Redux

Backend endpoints involved:

- `POST /v1/s3/presigned-url`
- `PUT /v1/users/profile`
- `GET /v1/subscriptions/status`

Important implementation note:

- the S3 upload step is currently commented out
- the code requests a presigned URL and submits `profile_photo_key`, but does not actually upload the selected image to the returned storage URL inside this screen
- local UI still uses the local `imageUri`

This is one of the most important current gaps in the project.

## 10. Home Screen and Content Feed

File: `src/screens/HomeScreen/index.js`

This is the operational center of the app after login.

### 10.1 Main responsibilities

- loads categories from backend
- loads templates from backend with pagination and search
- loads favorites
- renders a reel-like feed of template cards
- handles favorite add/remove
- handles share/download shortcuts
- handles edit navigation
- opens subscription modal
- performs logout

### 10.2 Backend dependencies

- `GET /v1/categories`
- `GET /v1/templates`
- `GET /v1/favorites`
- `POST /v1/favorites`
- `DELETE /v1/favorites/:id`
- `GET /v1/subscriptions/plans`
- subscription verify/status APIs through service methods

### 10.3 Feed rendering

The Home screen renders templates in a vertically snapping list. Each item can:

- preview image or video
- show overlaid personalized user photo
- open editor
- trigger download
- share to WhatsApp
- toggle favorite

### 10.4 Template normalization

Backend items are normalized through `normalizeTemplateApiItem()` and deduplicated through `dedupeTemplates()`.

This is important because backend template payloads may vary in naming:

- `template_url` vs `templateUrl`
- `thumbnail_url` vs `thumbnailUrl`
- `config_json` vs `config`
- `image_url` vs `imageUrl`
- `video_url` vs `videoUrl`

### 10.5 Notable code smell

`HomeScreen` contains a large hardcoded `resData` object that appears to be sample/mock template payload data and is not part of clean production logic. This increases file size and makes maintenance harder.

## 11. Template System

This project supports two template models.

### 11.1 Legacy/static templates

Files:

- `src/services/templateService.js`
- `src/screens/TemplateScreen/index.js`

This older path uses hardcoded template definitions embedded in the app.

Structure typically includes:

- category
- colors
- static image/video source
- `photoFrame`
- `textFields`
- layout and pattern metadata

This appears to be an older or fallback approach.

### 11.2 Config-driven backend templates

Files:

- `src/utils/templateConfig.js`
- `src/components/ConfiguredTemplateLayers/index.js`
- `src/components/TemplateMedia/index.js`
- `src/components/PosterPreview/index.js`

This is the more important and scalable path.

Backend templates can provide `config_json` with:

- canvas width and height
- layer list
- variables
- background color
- optional crop information

Supported layer types:

- `image`
- `text`
- special user photo placeholder layer

Supported placeholders include examples such as:

- `{{user_photo}}`
- `{{headline}}`
- `{{subtext}}`
- `{{background_image}}`
- `{{logo_url}}`
- `{{frame_png}}`

### 11.3 Why this matters

The config-driven model allows the backend/admin system to control:

- poster dimensions
- exact user photo placement
- logo placement
- editable text roles
- image/text layering
- video background templates

This is the most important architectural capability in the app.

### 11.4 Media handling

`TemplateMedia` decides whether a template is:

- image-based
- video-based

For videos, the app uses `react-native-video`.
For images, it uses `Image`.

The app also supports:

- thumbnail fallback for videos
- optional background crop metadata
- audio mute toggle for video templates

## 12. Poster Rendering Engine

The rendering engine is mainly inside `src/components/PosterPreview/index.js`.

This is the most complex UI component in the repo.

### 12.1 Responsibilities

- renders poster background
- renders image or video template media
- overlays user photo
- overlays text fields
- supports drag and pinch interactions in interactive mode
- supports static mode for export capture
- supports config-driven layer rendering
- supports stickers
- supports photo animation presets
- supports footer/watermark for legacy templates

### 12.2 Interactive mode vs static mode

`PosterPreview` can work in two modes:

- interactive mode
  Used while editing and previewing with draggable text/photo/stickers.

- static/export mode
  Used for off-screen capture with `react-native-view-shot`.

### 12.3 Gesture support

Implemented with `PanResponder` and Animated values.

Objects that can be moved and/or scaled:

- user photo
- name text
- message text
- stickers

### 12.4 Photo animation

The code supports many named animation presets such as:

- slide from edges
- bounce
- fade
- rotate
- flip
- float
- drift
- pulse

Important note:

- current editor copy states that photo animation is preview-only
- selected animation is stored locally but is not currently sent to backend

## 13. Editor Screen

File: `src/screens/EditorScreen/index.js`

The editor provides advanced customization for the currently selected template.

### 13.1 Main tabs

- Photo
- Text
- Details
- Style

### 13.2 Photo tab

Capabilities:

- choose device photo
- scale photo
- choose animation preset

Premium gating:

- photo resize is premium-locked

### 13.3 Text tab

Capabilities:

- edit user name
- edit message
- show/hide name
- show/hide message
- change colors
- change sizes
- bold/italic toggles
- text shadow
- alignment

Premium gating:

- advanced text style controls are premium-locked

### 13.4 Details tab

Stores premium profile fields:

- personal section
  - mobile number
  - address
  - social handle
  - organization name
  - organization logo

- business section
  - business name
  - business description
  - business logo
  - contact mobile number
  - contact address
  - contact social handle

These values are used by config-driven templates when mapped into placeholders like `logo_url`.

### 13.5 Style tab

Capabilities:

- change photo shape
- choose overlay/accent settings
- visual style controls

### 13.6 Premium modal

When locked features are used, the editor can open `SubscriptionModal`, fetch plans, start Razorpay checkout, verify purchase, and sync premium state.

## 14. Preview and Export Flow

File: `src/screens/PreviewScreen/index.js`

Responsibilities:

- show scaled full poster preview
- auto-trigger save/share when navigated with an action param
- show different action buttons for image vs video templates
- mount a hidden full-resolution poster for capture

Behavior by template type:

- video template
  - full-width Download button

- image template
  - Save button
  - Share button

Non-premium share behavior:

- share path is oriented toward WhatsApp sharing

## 15. Capture, Save, and Share

### 15.1 Capture

Hook: `src/hooks/usePosterGenerator.js`

The app captures a referenced poster view using `captureRef` from `react-native-view-shot`.

Capture output:

- JPG
- base64 string

### 15.2 Save to gallery

Service: `src/services/imageService.js`

Flow:

- request Android storage permission when needed
- create app folder
- write image file using `react-native-fs`
- scan file on Android so it appears in gallery

### 15.3 Share

Also handled by `imageService.js`.

Capabilities:

- generic system share sheet
- direct WhatsApp share

It supports:

- file paths
- file URLs
- base64 data URLs

## 16. State Management

File: `src/store/posterSlice.js`

This slice is the core application state container.

### 16.1 Core fields

- `selectedTemplate`
- `userPhoto`
- `userName`
- `userMessage`
- `isLoggedIn`
- `isPremium`
- `premiumProfile`

### 16.2 Editor state

- photo position and scale
- text positions and scales
- font color overrides
- font size overrides
- bold/italic flags
- text alignment
- shadow flag
- show/hide flags
- photo shape
- accent override
- background overlay color and opacity
- sticker list

### 16.3 Home state

- `activeCategory`

### 16.4 Persistence behavior

Redux state itself is not globally persisted via a middleware package.
Instead, selected session/profile parts are restored from AsyncStorage via helper functions.

## 17. Local Persistence

### 17.1 AsyncStorage keys observed

- `access_token`
- `refresh_token`
- `user_profile`
- `@CraftoClone:language`
- `registered_fcm_token`

### 17.2 User profile structure

Managed by `src/utils/userStorage.js`.

It includes:

- `name`
- `imageUri`
- `isLoggedIn`
- `isPremium`
- nested personal/business premium profile fields

## 18. API Layer

### 18.1 Base client

File: `src/apiService/apiService.js`

Key behaviors:

- uses `react-native-config` for `BASE_URL` and `API_KEY`
- attaches bearer access token automatically
- retries failed requests after token refresh on `401`
- uses `/v1/auth/refresh` for refresh

### 18.2 Refresh token behavior

If refresh succeeds:

- new access token is stored
- original request is retried

If refresh fails:

- AsyncStorage is cleared
- request is rejected

Maintenance note:

- there is no centralized forced navigation reset on refresh failure
- current behavior logs the issue and clears storage only

### 18.3 API modules

- `authApi.js`
  - request OTP
  - verify OTP
  - logout

- `templateApi.js`
  - fetch templates

- `categoriesApi.js`
  - fetch categories

- `favoriteApi.js`
  - list/add/remove favorites

- `subscriptionApi.js`
  - plans
  - status
  - verify subscription

- `profileApi.js`
  - update user profile

- `langApi.js`
  - list supported languages

- `fcmApi.js`
  - register/remove token

- `uploadImage.js`
  - request S3 presigned upload URL

## 19. Subscription and Premium Flow

File: `src/services/subscriptionService.js`

### 19.1 Main responsibilities

- fetch premium status from backend
- map backend subscription status to local premium flag
- launch Razorpay checkout
- verify completed purchase with backend
- sync Redux and local profile premium status

### 19.2 Premium decision logic

Premium is active when backend subscription status indicates:

- `is_active = true`
- plan type exists
- plan type is not `FREE`

### 19.3 Razorpay expectations

The code expects:

- `RAZORPAY_KEY_ID` in `.env`
- valid backend subscription plan UUIDs
- INR pricing, converted to paise

### 19.4 Premium-locked features currently implied

- photo resize
- advanced text styling
- business/personal detail fields
- richer editor controls

## 20. Firebase Cloud Messaging

File: `src/services/fcmService.js`

### 20.1 When sync happens

`App.js` mounts `FcmTokenManager`.
Once `isLoggedIn` becomes true:

- app requests notification permission
- app gets FCM token
- app registers token with backend
- app subscribes to token refresh events

### 20.2 Stored key

- `registered_fcm_token`

### 20.3 Backend endpoints

- `POST /v1/fcm/register`
- `DELETE /v1/fcm/token`

### 20.4 Android permissions

Manifest includes:

- `POST_NOTIFICATIONS`
- storage/media permissions
- camera
- internet

## 21. Native Platform Notes

### 21.1 Android

Files:

- `android/app/src/main/AndroidManifest.xml`
- `android/app/src/main/java/com/craftoclone/MainApplication.kt`

Observed integrations:

- Google services plugin is applied
- `google-services.json` is present
- cleartext traffic is configurable through manifest placeholder
- storage permission support covers older Android versions

### 21.2 iOS

File:

- `ios/CraftoClone/AppDelegate.swift`

This is a standard React Native app delegate using the modern React Native factory setup.

## 22. Environment Configuration

Observed `.env` keys:

- `BASE_URL`
- `API_KEY`
- `RAZORPAY_KEY_ID`
- `Test_API_Key`
- `Test_Key_Secret`

### Important security note

The current `.env` file contains live-looking secret values inside the repository workspace. This is a security concern and should be addressed immediately by the project owner.

Recommended action:

- rotate exposed secrets
- move production secrets to a secure secret-management process
- keep only developer-safe placeholders in local tracked samples such as `.env.example`

## 23. Build and Run Notes

### 23.1 JavaScript

- `npm install`
- `npm start`
- `npm run android`
- `npm run ios`

### 23.2 Postinstall

`patch-package` runs automatically after install.

### 23.3 iOS

Use CocoaPods after native dependency changes:

- `bundle install`
- `bundle exec pod install`

### 23.4 Node requirement

`package.json` expects Node `>= 22.11.0`.

## 24. Known Issues and Technical Risks

These are the most important KT findings from the current codebase.

### 24.1 Profile image upload is incomplete

In `UserSetupScreen`, the code requests a presigned URL but the actual upload to storage is commented out. Backend may receive a file key without the file being uploaded.

Impact:

- broken or missing profile photo on backend side
- inconsistency between backend data and local UI

### 24.2 Sensitive values are present in `.env`

Secrets should not remain casually exposed in a shared repository/workspace.

Impact:

- credential leakage risk
- accidental misuse across environments

### 24.3 HomeScreen is oversized and mixes concerns

`HomeScreen` handles:

- category logic
- search
- pagination
- favorites
- subscription
- sharing
- downloading
- logout
- inline template preview rendering
- modal state

Impact:

- hard to test
- hard to onboard new developers
- high regression risk

### 24.4 Large sample response object is embedded in HomeScreen

The `resData` block should be removed or moved to fixtures/test data.

Impact:

- noisy production file
- maintainability issue

### 24.5 Legacy/static template system still exists beside backend-driven templates

`TemplateScreen` and `templateService.js` still depend on hardcoded templates while the rest of the app is increasingly backend-driven.

Impact:

- duplicate template logic
- confusion for new maintainers
- inconsistent feature behavior

### 24.6 Static template definitions contain repeated entries and duplicate IDs

`src/services/templateService.js` repeats `pol_01`, `pol_02`, and `pol_03` multiple times.

Impact:

- potential key collisions
- hard-to-track bugs in lists or selection logic

### 24.7 OTP resend is not wired to backend

Resend currently only resets timer/toast.

Impact:

- user expectation mismatch
- incomplete auth experience

### 24.8 Refresh-token failure does not appear to force a navigation reset

Storage is cleared, but UX for session expiry may not be fully controlled.

Impact:

- possible inconsistent logged-in/logged-out state presentation

### 24.9 Limited test coverage

Repository contains only a minimal default test file under `__tests__/App.test.tsx`.

Impact:

- regression risk is high for editor, auth, and export flows

## 25. Recommended Refactoring Roadmap

### Phase 1: Stabilization

- complete actual profile image upload
- move secrets out of tracked env usage
- wire OTP resend to backend
- verify logout and token-expiry behavior end to end

### Phase 2: Code organization

- split `HomeScreen` into hooks and child components
- separate feed data logic from presentation
- separate subscription flow logic into dedicated hooks
- remove dead/mock data from production screen files

### Phase 3: Template platform cleanup

- choose one primary template system
- ideally make backend config-driven templates the single source of truth
- deprecate or isolate static template service

### Phase 4: Quality

- add unit tests for `templateConfig.js`
- add integration tests for auth and editor flows
- add export/share smoke tests

## 26. Suggested Onboarding Path for a New Developer

If a new engineer joins this project, the recommended learning order is:

1. Read `App.js` and `AppNavigator.js`
2. Read `posterSlice.js`
3. Read `HomeScreen`, `EditorScreen`, and `PreviewScreen`
4. Read `PosterPreview`, `TemplateMedia`, and `ConfiguredTemplateLayers`
5. Read `templateConfig.js`
6. Read API service files and `subscriptionService.js`
7. Run the app and test:
   - login
   - language selection
   - profile setup
   - template browsing
   - poster editing
   - save/share
   - premium flow

## 27. KT Checklist for Handover Session

During a live KT meeting, the current owner should demonstrate:

- environment setup and required `.env` values
- backend availability and expected API contract
- OTP login flow
- language selection
- user setup and image picker
- home feed search/category/favorite behavior
- config-driven template rendering
- editor personalization flow
- preview save/share flow
- premium purchase verification flow
- FCM token registration behavior
- known bugs and current priorities

## 28. Final Assessment

`CraftoClone` already has a strong functional foundation:

- multi-step onboarding
- backend-driven templates
- flexible rendering engine
- export/share support
- localization
- premium subscription wiring
- FCM integration

The most important architectural strength is the config-driven template rendering path, because it allows product expansion without requiring a new app build for every template change.

The biggest risks today are not the core concept, but maintainability and operational correctness:

- incomplete upload flow
- mixed template paradigms
- heavy screen files
- exposed secrets
- low automated test coverage

If those areas are cleaned up, this project can become much easier to scale and hand over across teams.
