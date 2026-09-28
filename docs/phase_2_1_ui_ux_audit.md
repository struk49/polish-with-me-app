# POLISH WITH ME — PHASE 2.1 UI/UX AUDIT

## 1. Executive summary

Polish with Me is a compact but feature-complete Expo Router mobile application with five primary tabs, two core learning-detail routes, a purchase modal, a privacy screen, and a global error experience. The product already includes a substantial curriculum: 61 lessons (18 A1, 16 A2, 15 B1, 12 B2), 862 vocabulary items, and 90 phrasebook entries across 11 subject categories plus the All filter.

The UI already has a recognizable visual language: Polish red as the primary action colour, Inter typography, warm off-white/light and charcoal/dark palettes, bordered white/charcoal cards, rounded geometry, Ionicons, restrained haptics, and consistent 20 px screen gutters on most learning screens. Light, dark, and system themes are supported and persisted.

The strongest parts to preserve are the direct curriculum structure, clear Polish/phonetic/English hierarchy, immediate quiz feedback, usable phrase search and audio, entitlement-aware routing, local progress persistence, theme support, and the clear one-time-purchase paywall.

The main Phase 2 opportunities are presentation and consolidation rather than adding features. Cards, buttons, section labels, progress bars, status badges, audio rows, and screen headers are recreated independently across routes. Typography and radii are coherent in spirit but not tokenized. Home repeats progress information already available in Progress while not providing a true “continue” decision. Progress contains stale achievement copy (“Complete all 8 lessons”) despite the current 61-lesson curriculum. Accessibility coverage is partial: a few icon controls have explicit labels, but most custom Pressables do not expose roles, states, hints, or minimum hit areas.

No app render or new screenshot was produced. The repository has dependencies installed, but generating a trustworthy Android screenshot would require starting an Expo/native runtime and device or emulator. That was unnecessary for this source audit and was not attempted.

## 2. Current app architecture

The mobile app uses Expo Router with a root Stack and nested five-tab navigator.

- Root providers: `SafeAreaProvider` → `ThemeProvider` → `ErrorBoundary` → `QueryClientProvider` → `GestureHandlerRootView` → `KeyboardProvider` → `SubscriptionProvider` → `ProgressProvider`.
- Root Stack: tabs, lesson detail, quiz, paywall modal, and privacy policy.
- State and persistence:
  - progress, scores, streak, known words, and XP: `ProgressContext`, persisted in AsyncStorage under `@polish_progress_v1`;
  - theme preference: `ThemeContext`, persisted under `@polish_theme_v1`;
  - RevenueCat CustomerInfo: React Query cache and RevenueCat SDK;
  - AI daily client usage and installation identifier: AsyncStorage in `lib/aiTutor.ts`;
  - curriculum and phrase content: static `data/lessons.ts`.
- Typography: Inter 400, 500, 600, and 700 loaded in the root layout.
- Visual theme: `constants/colors.ts` plus `useColors()`.
- Interaction libraries: React Native Pressable, Expo Haptics, Expo Speech, Reanimated, native alerts, Expo symbols, and Ionicons.

There is no dedicated onboarding flow, profile screen, account system, or standalone settings screen. Appearance, feedback, and reset are embedded in Progress. Privacy Policy exists as a route, but no in-app navigation entry point was found.

## 3. Screen inventory

| Route / file | Purpose and entry | Major UI and data | States and Pro behaviour |
|---|---|---|---|
| `/(tabs)` → `app/(tabs)/index.tsx` | Home and curriculum browser; first tab and app root | Welcome header, theme toggle, streak, Start Here card, four statistics, overall progress, grammar legend, collapsible A1–B2 sections, lesson rows | No bespoke loading/error/empty state because ProgressProvider blocks rendering until storage loads. A1 opens lessons; A2/B1/B2 show lock/PRO and route to paywall. |
| `/(tabs)/practice` → `practice.tsx` | Vocabulary flash-card practice; Practice tab | Mastered-word count, lesson picker, flip card, Polish/phonetic/English/example, session counter/progress, Not yet/Got it actions, completion summary | No error or empty state; assumes ordered lessons and words exist. Picker hides Pro lessons for free users. Reanimated 280 ms flip and haptics. |
| `/(tabs)/phrasebook` → `phrasebook.tsx` | Searchable spoken phrase reference; Phrases tab | Search, horizontal category chips, Polish/phonetic/English rows, speech icon | Explicit “No phrases found” empty state. Speech failure uses Alert. Speaking changes border/icon. No Pro restriction. |
| `/(tabs)/ai-tutor` → `ai-tutor.tsx` | Guided or remote conversation practice; AI Tutor tab | Header/quota, explanation card, A1–B2 level selector, scenarios, chat, reset, multiline input/send | Usage loads silently; send uses hourglass icon; remote failure inserts a local fallback reply. Free limit 3/day, Pro 15/day; numeric quota is shown, but no persistent Free/Pro label. |
| `/(tabs)/progress` → `progress.tsx` | Progress dashboard plus appearance, feedback, and reset; Progress tab | XP level card, streak, XP bar, four statistics, eight achievements, theme selector, feedback email, reset | Zero values form the empty state; no dedicated first-use explanation. Reset confirms with destructive Alert. Not Pro-gated. |
| `/lesson/[id]` → `lesson/[id].tsx` | Lesson detail and vocabulary learning; Home lesson row or Start Here | Level/difficulty/completion metadata, title/description/stats, grammar or pronunciation note, word rows, examples, speech, known-word toggle, sticky quiz CTA | Entitlement readiness shows centered spinner. Invalid ID shows “Lesson not found.” Paid direct routes redirect to paywall. Speech errors use Alert. |
| `/quiz/[id]` → `quiz/[id].tsx` | Lesson quiz and results; lesson sticky CTA | Progress bar/counter, Polish prompt and phonetic hint, four answer rows, immediate correct/error styling, Next, score result, wrong-word review, retry/continue | Entitlement readiness shows spinner; invalid/empty quiz shows “Quiz not available.” Paid direct routes redirect to paywall. Results are part of this route rather than a separate screen. |
| `/paywall` → `paywall.tsx` | Lifetime Pro upgrade; locked lesson routes | Close, benefit hero, dynamic store price, curriculum benefits, A1-free note, purchase CTA, Restore, confirmation modal | Offering/purchase/restore loading uses spinners/disabled controls. Store, purchase, restore, missing-entitlement errors use Alerts. Successful verified entitlement returns to prior route. |
| `/privacy-policy` → `privacy-policy.tsx` | Static legal disclosure; direct route/external entry only | Conditional back header, last-updated date, eight text sections, bullets, footer | No loading/error/empty state. Scrollable. No in-app link was found. |
| `+not-found` → `+not-found.tsx` | Unknown route recovery | “Oops” stack title, message, Home link | Static fallback. Uses system bold rather than the loaded Inter family. |

Global secondary UI includes the production error fallback (`components/ErrorFallback.tsx`) with Try Again and, in development, an error-details modal. Native Alerts are used for destructive reset, speech errors, billing errors, AI limits, and unavailable email.

## 4. Bottom navigation

The exact tab order is:

1. Home — book
2. Practice — bolt/flash
3. Phrases — text bubble/chat bubble
4. AI Tutor — sparkles
5. Progress — bar chart

Implementation: `app/(tabs)/_layout.tsx`.

When `isLiquidGlassAvailable()` is true, the app uses Expo Router `NativeTabs` with SF Symbols and native labels. Active/inactive appearance and physical height are delegated to the native control.

The fallback `Tabs` implementation uses:

- active tint: theme `primary`;
- inactive tint: `mutedForeground`;
- 22 px Ionicons on Android/web and 24 px SF Symbols on iOS;
- absolute positioning;
- no top border on native platforms, a 1 px border on web;
- zero Android elevation;
- safe-area bottom padding;
- explicit height 84 only on web;
- transparent iOS background with a 100-intensity light/dark BlurView;
- solid themed background on web;
- default navigator sizing on Android and non-liquid-glass iOS.

The tab labels accurately match the destination. “Home” is implemented by a component named `LearnScreen`, but the visible label is Home. Header styling is configured globally, although tab content largely supplies its own in-content header.

Finding — platform variants are not visually identical

- Severity: Low
- Evidence: NativeTabs uses native SF Symbols and defaults; classic tabs specify tint, sizes, background and safe-area padding.
- File: `artifacts/mobile/app/(tabs)/_layout.tsx`
- Component/screen: TabLayout
- Why it matters: screenshots and spacing can differ materially by OS capability, especially on newer iOS versus Android.
- Future design direction: define intended semantic states and minimum metrics while preserving appropriate native rendering.

## 5. Home

Home is the densest screen and serves both dashboard and curriculum-navigation roles.

### Existing hierarchy

1. “Witaj! Welcome” and “Polish with Me.”
2. Theme icon and flame streak badge.
3. Red-tinted Start Here card with explanatory copy and first-lesson CTA.
4. Four equal statistics: lessons done, XP, lessons total, words total.
5. Overall Progress card and progress bar.
6. Grammar-marker legend.
7. Curriculum heading.
8. Collapsible A1, A2, B1, and B2 sections with per-level completion.
9. Lesson rows with completion, quiz score, grammar indicator, lock/PRO state, word count, and duration.

The screen scrolls vertically with a 20 px gutter and 100 px bottom allowance for the tab bar. Only A1 starts expanded. Level headers toggle inline expansion. No direct AI Tutor or Phrasebook card appears; those features are reached through bottom navigation.

Home repeats lessons done, XP, total lessons, streak, and progress information that also appears in Progress. The repetition is useful for at-a-glance continuity but makes the upper half of Home compete with the primary curriculum action.

Finding — Start Here is not progress-aware

- Severity: Medium
- Evidence: `firstLesson` selects the first A1 lesson every time, regardless of completion or quiz score.
- File: `artifacts/mobile/app/(tabs)/index.tsx`
- Component/screen: LearnScreen / Start Here
- Why it matters: returning learners are repeatedly sent to “Polish Alphabet” rather than their next incomplete or recent lesson, weakening the screen’s primary action.
- Future design direction: in a later approved phase, define a continuation rule using existing progress data without altering completion semantics.

Finding — narrow stat cards constrain labels

- Severity: Low
- Evidence: four cards share one row, use 11 px labels, and manually split labels with newlines.
- File: `artifacts/mobile/app/(tabs)/index.tsx`
- Component/screen: statsRow/statCard
- Why it matters: small phones or increased font scaling can compress values and labels; “Lessons total” and “Words total” are presentation-heavy relative to their usefulness.
- Future design direction: define a responsive stat-card primitive and a content-priority rule.

## 6. Learning experience

### Lesson selection

Home groups lessons by CEFR level. Each level has a coloured badge, label, description, completion fraction, and bar. Lesson rows expose title, words, estimated time, completion, quiz score, grammar availability, and entitlement status. Locked rows navigate to the paywall; unlocked rows navigate to lesson detail.

Practice uses a separate horizontal lesson-chip picker. Free users only see free lessons. Each chip includes title and word count.

### Lesson detail and vocabulary

The lesson hero presents CEFR level, difficulty, completion, description, word count, estimated time, and category. A tinted teaching panel shows either a grammar note or a pronunciation explanation. Vocabulary rows then present:

- numbered index;
- Polish in 18 px bold;
- phonetic transcription in 13 px italic muted text;
- English in 15 px medium;
- optional example and translation;
- speech and known-word actions.

The sticky footer launches or retakes the quiz. Marking a word known is immediate and persistent; it does not itself award XP.

### Practice

Flash cards emphasize Polish at 34 px, then reveal English at 28 px while retaining smaller Polish and phonetic text. Optional examples appear in a nested surface. Cards animate by collapsing and expanding on the X axis, with haptic selection. “Got it!” persists a known word and advances; “Not yet” advances without persistence. The completion card reports got-it, review, percentage, total mastered, and offers Practice Again.

### Quiz and results

Questions ask for the English meaning of a Polish word. Answers are disabled after selection. Correct and incorrect states combine colour, borders, and icons, with haptic success/error. The Next button appears only after answering. Completion persists the lesson, best score, XP, and streak through `finishQuiz`.

Results show a 160 px score circle, performance message, review cards for missed words, Try Again, and Continue. There is no separate result route.

Finding — progress bars begin at zero on the first visible item

- Severity: Low
- Evidence: Practice uses `cardIndex / total`; Quiz uses `current / questions.length`.
- File: `practice.tsx`, `quiz/[id].tsx`
- Component/screen: FlashCard and QuizScreen progress bars
- Why it matters: the user is already working on item 1 while the bar displays 0%, which can feel one step behind the counter.
- Future design direction: define whether progress means items entered or items completed and apply that definition consistently.

Finding — repeated learning-card implementations

- Severity: Medium
- Evidence: Home lesson rows, Lesson word rows, Quiz answers/review rows, Phrasebook rows, Practice flash cards, and AI scenario cards each independently define card border, radius, pressed opacity, spacing, and text hierarchy.
- File: multiple files under `artifacts/mobile/app`
- Component/screen: major learning surfaces
- Why it matters: small inconsistencies will multiply during visual refinement.
- Future design direction: establish semantic card and row primitives before screen redesign.

## 7. Progress

Progress data comes from `ProgressContext` and `lib/progressState.ts`; it is stored locally in AsyncStorage. The screen displays:

- derived numeric level: `floor(totalXP / 100) + 1`;
- total XP and XP remaining to the next 100-XP level;
- a within-level XP progress bar;
- day streak;
- completed lessons / total lessons;
- known words;
- quizzes taken;
- average best quiz score;
- eight binary achievements;
- system/light/dark appearance selection;
- feedback email action;
- destructive progress reset.

Quiz completion is the primary progress event: first completion adds 50 XP; score improvement adds rounded differential bonus XP; best scores are retained; studying updates the streak. Known words are toggled from lessons or marked from Practice. Progress and theme survive restart locally but not uninstall/device transfer.

There are no rings. Progress uses horizontal bars, a solid red level card, stat tiles, and achievement rows. Locked achievements are represented by 50% opacity rather than a lock icon; unlocked achievements gain a stronger red border and checkmark.

Finding — achievement copy is stale against the curriculum

- Severity: High
- Evidence: “Scholar” says “Complete all 8 lessons” and unlocks at `completedLessons.length >= 8`, while `LESSONS.length` is 61.
- File: `artifacts/mobile/app/(tabs)/progress.tsx`
- Component/screen: achievements / Scholar
- Why it matters: it falsely describes curriculum completion and can award an “all lessons” achievement after roughly 13% of current lessons.
- Future design direction: in a correctness-approved phase, align the achievement threshold and wording with the existing curriculum or redefine it as a named eight-lesson milestone.

Finding — settings are embedded in a progress dashboard

- Severity: Low
- Evidence: Appearance, feedback, and destructive reset follow achievements in the Progress tab.
- File: `progress.tsx`
- Component/screen: ProgressScreen
- Why it matters: the screen combines learning analytics with account-like utilities, creating a long mixed-purpose scroll.
- Future design direction: first improve sectional hierarchy; do not create a new settings feature unless separately approved.

## 8. AI Tutor

AI Tutor is a single-screen scenario-and-chat experience.

- Entry: fourth bottom tab.
- Header: conversation-practice kicker, title, and remaining/daily quota badge.
- Levels: A1, A2, B1, B2; each changes guidance sent to the tutor but is not entitlement-gated.
- Scenarios: Meet someone, Order coffee, At the shop, Directions, Family.
- Chat: right-aligned red learner bubbles; left-aligned bordered tutor bubbles with “AI tutor” or “Practice coach” metadata.
- Input: multiline field, 500-character limit, 46 px send button.
- Reset: replaces conversation with the active scenario opener.
- Loading: send button becomes an hourglass and is disabled.
- Errors: remote failures append an instructional local fallback message; missing endpoint is explained inline.
- Quota: Free receives 3 replies/day; Pro receives 15. Limit exhaustion uses an Alert.
- Keyboard: KeyboardAvoidingView is enabled only on iOS; the app also has a root KeyboardProvider.

The visual treatment is consistent with the rest of the app through red selection, Inter, bordered cards, and rounded controls. It differs through a tighter 16 px gutter, a hard 255 px maximum selector area, chat bubbles, and a larger fixed input region.

Finding — hard maximum height can clip scaled setup controls

- Severity: Medium
- Evidence: the complete header, information panel, level controls, help text, and scenarios are placed in a ScrollView capped at `maxHeight: 255`.
- File: `artifacts/mobile/app/(tabs)/ai-tutor.tsx`
- Component/screen: topArea
- Why it matters: large system text, translated copy, or compact-height devices can make selection controls cramped and require nested scrolling before the conversation.
- Future design direction: define responsive vertical allocation and font-scale behavior for the setup/chat split.

Finding — remote and guided modes are visually ambiguous

- Severity: Low
- Evidence: the screen can label replies “Practice coach,” shows an offline sentence, and can silently fall back after a request, but both modes otherwise share the same interaction and quota presentation.
- File: `ai-tutor.tsx`
- Component/screen: AssistantMessage and chatArea
- Why it matters: learners may not understand whether they are receiving generated correction or deterministic guided practice.
- Future design direction: define a concise, persistent mode/status treatment without exposing backend detail.

## 9. Phrasebook

Phrasebook contains 90 phrases and 12 filters including All. Search matches Polish, English, and phonetic fields case-insensitively. Category selection uses horizontally scrolling pills. Each phrase is a full-row speech target and shows:

1. Polish: 17 px semibold, foreground colour;
2. phonetic: 13 px italic, muted;
3. English: 14 px regular, muted;
4. trailing volume state icon.

Speech uses Polish locale settings, a slower 0.85 rate, queue clearing, selection haptic, toggle-to-stop, and a helpful native Alert if the Polish voice is unavailable. While speaking, the row receives a stronger primary border and active volume icon. The search result empty state contains an icon and “No phrases found.” There is no Pro restriction.

Finding — search clear control lacks explicit accessibility metadata

- Severity: Medium
- Evidence: the close-circle icon is inside a bare Pressable without role, label, or expanded hit target.
- File: `artifacts/mobile/app/(tabs)/phrasebook.tsx`
- Component/screen: searchBox
- Why it matters: the control is icon-only and 18 px visually, making it harder for screen-reader and motor-impaired users.
- Future design direction: define accessibility requirements for every icon-only action.

## 10. Pro/paywall

Locked content appears on Home lesson rows for A2, B1, and B2 through muted styling, a lock icon, and a red PRO badge. Pressing a locked lesson opens the paywall. Direct paid Lesson and Quiz routes wait for entitlement readiness and redirect if access is absent. Practice hides paid lessons from the picker rather than displaying locked items.

The paywall contains:

- modal presentation without stack header;
- icon-only close control;
- Polish flag hero;
- “Unlock Full Curriculum” and “One payment. Yours forever”;
- dynamic Google Play price in a red price panel;
- “One-time purchase” and “No subscription. No hidden fees”;
- five benefit rows with icons and checkmarks;
- explicit A1-always-free card;
- fixed purchase CTA;
- Restore previous purchase;
- confirmation modal showing the dynamic price.

The purchase CTA, Restore, and modal confirmation are disabled by the shared billing-operation state. The existing entitlement verification remains visualized through success returning to the prior route and missing-entitlement/error Alerts. Cancellation stays on the paywall. Offering loading and purchase loading use the CTA spinner; Restore uses a small spinner.

Finding — close control is visually smaller than recommended

- Severity: Medium
- Evidence: close button is 32×32 with hitSlop 8 but has no accessibility label or role.
- File: `artifacts/mobile/app/paywall.tsx`
- Component/screen: closeBtn
- Why it matters: effective touch area may be adequate, but assistive technology cannot identify the icon’s purpose reliably.
- Future design direction: standardize a minimum 44–48 px semantic icon-button primitive.

Finding — locked-state presentation varies by location

- Severity: Low
- Evidence: Home shows muted locked rows and PRO badges; Practice removes paid lessons entirely; paid direct routes show only a spinner before redirection.
- File: `index.tsx`, `practice.tsx`, `lesson/[id].tsx`, `quiz/[id].tsx`
- Component/screen: curriculum access states
- Why it matters: users receive different explanations of the same entitlement boundary.
- Future design direction: define when paid content should be visible-and-locked versus hidden, while preserving access policy.

## 11. Existing design system

### Colours

An explicit theme palette exists in `constants/colors.ts`.

| Role | Light | Dark |
|---|---|---|
| Primary/tint | `#C8102E` | `#FF453A` |
| Background | `#FAFAF8` | `#1C1C1E` |
| Foreground/text | `#1C1C1E` | `#F2F2F7` |
| Card | `#FFFFFF` | `#2C2C2E` |
| Secondary/muted | `#F4F4F4` | secondary `#3A3A3C`, muted `#2C2C2E` |
| Muted text | `#8A8A8E` | `#8D8D93` |
| Accent | `#FFF0F0` | `#3D1515` |
| Accent text | `#C8102E` | `#FF6B6B` |
| Border/input | `#E5E5EA` | `#3A3A3C` |
| Success | `#34C759` | `#30D158` |
| Warning | `#FF9500` | `#FF9F0A` |
| Destructive | `#FF3B30` | `#FF453A` |

Additional hard-coded semantic colours include A1 green `#34C759`, A2 orange `#FF9500`, B1 purple `#AF52DE`, B2/red Pro `#C8102E`, white variants, black modal overlay, and many alpha-concatenated forms such as `+ "15"`, `+ "20"`, `+ "35"`, and `+ "40"`.

Near-duplicates include `#fff`/`#FFFFFF`, light and dark red variants, theme destructive versus level/Pro red, and multiple literal white-opacity strings. Pro has no dedicated theme token; it shares the light primary/B2 literal even in dark mode.

### Typography

Inter is the intended family in weights 400, 500, 600, and 700. Observed sizes are 10, 11, 12, 13, 14, 15, 16, 17, 18, 20, 22, 24, 26, 28, 30, 34, 40, 44, and 48 px. Common hierarchy:

- screen titles: 26–28 bold;
- section titles: 18–20 bold;
- cards/row titles: 14–18 semibold/bold;
- body: 14–16 regular, often 20–22 line height;
- labels/kickers: 10–12 semibold with 1–1.5 letter spacing;
- metadata: 11–14 regular;
- hero learning terms: 34–40 bold;
- statistics: 20–48 bold.

NotFound and ErrorFallback use `fontWeight` without Inter family, so they can render in a platform font. Explicit line heights are applied selectively rather than through a type scale.

### Spacing

The dominant screen gutter is 20 px. AI Tutor uses 16 px and Privacy uses 24 px. Common card padding is 14–20; gaps cluster at 8, 10, 12, and 16. The implementation suggests an implicit 2/4 px rhythm but includes many one-off values: 3, 5, 6, 7, 13, 14, 18, 28, and 32.

### Shapes

The palette exports `radius: 12`, but screens do not consume it directly. Observed radii include 2–4 for bars, 6–10 for badges, 12–16 for controls/cards, 18–20 for hero cards/modals, 24 for the paywall hero icon, and full circles. Cards typically use a 1 px border; selected/completed states use 1.5 px.

### Shadows and elevation

The product is almost entirely flat. Standard cards use borders rather than shadows. The only substantive shadow/elevation is the global ErrorFallback Try Again button. The classic tab bar explicitly sets elevation 0. This restraint is consistent.

### Icons and imagery

- Ionicons: dominant cross-platform icon language.
- SF Symbols: iOS tab icons.
- Feather: global error UI only.
- Emoji: Polish flag on paywall, rotate/check on Practice actions, celebration on Practice completion.
- App-specific bitmap assets: app icon, adaptive icon, splash, and Pro product icon.

Finding — tokens exist only for colours

- Severity: Medium
- Evidence: colours are centralized, but typography, spacing, radii, opacity, component height, and motion values live in individual StyleSheets.
- File: `constants/colors.ts` and all route StyleSheets
- Component/screen: system-wide
- Why it matters: the app looks related today, but refinements require repetitive edits and risk drift.
- Future design direction: Phase 2.2 should define semantic tokens before changing screen composition.

## 12. Reusable components

Current reusable UI is limited:

| Component | File | Use and variants |
|---|---|---|
| ErrorBoundary | `components/ErrorBoundary.tsx` | Wraps the entire app; accepts optional fallback and error callback. |
| ErrorFallback | `components/ErrorFallback.tsx` | Production restart UI plus development details modal. |
| KeyboardAwareScrollViewCompat | `components/KeyboardAwareScrollViewCompat.tsx` | Web/native adapter; no current route import was found. |
| ThemeProvider/useTheme | `contexts/ThemeContext.tsx` | System/light/dark persistence and resolution. |
| useColors | `hooks/useColors.ts` | Resolves theme colours and exports radius. |
| ProgressProvider/useProgress | `contexts/ProgressContext.tsx` | Shared persistence and learning actions. |
| SubscriptionProvider/useSubscription | `lib/revenuecat.tsx` | Shared entitlement/offering/purchase/restore state. |

Screen-local components include Home `LessonCard`/`LevelSection`, Practice `FlashCard`, Progress `Achievement`, Phrasebook `PhraseItem`, Lesson `WordRow`, AI `AssistantMessage`, and Privacy `Section`/`P`/`Bullet`. They are reusable only within their defining route.

Repeated but unshared patterns:

- screen title/header;
- primary and secondary buttons;
- bordered card/surface;
- stat card;
- section kicker;
- selection chip;
- progress track/fill;
- level badge;
- status badge;
- lock/Pro state;
- icon button;
- Polish/phonetic/English stack;
- empty/error/loading state;
- sticky bottom CTA;
- confirmation surface.

No shared general-purpose Button, Card, Header, Badge, ProgressBar, IconButton, EmptyState, LoadingState, or learning-language row exists.

## 13. Visual consistency

### Deliberate differences

- AI chat bubbles appropriately differ from curriculum cards.
- Quiz success/error colours communicate correctness.
- CEFR levels have distinct green/orange/purple/red accents.
- Paywall uses stronger red branding and a fixed CTA to emphasize purchase.
- ErrorFallback uses a restrained generic layout because it must survive app failures.
- iOS native tabs and Android classic tabs intentionally follow platform capabilities.

### Accidental inconsistencies

- Gutters vary between 16, 20, and 24 without a documented container rule.
- Screen titles use 26 or 28; NotFound uses 20 system bold.
- Section labels range 10–12 px and 1–1.5 letter spacing.
- Cards range 12–20 radius and 10–32 padding without semantic categories.
- Pro/B2 red and primary red are hard-coded in some screens rather than resolved through the active theme.
- Empty states exist for Phrasebook but not for zero progress, no available practice content, or unavailable AI usage data.
- Loading uses blank provider screens, route spinners, button spinners, and an hourglass icon with no shared pattern.
- Error feedback alternates between inline copy, chat fallback messages, native Alerts, and the global error screen.
- Home and Progress use related metrics but different stat-card layouts.
- Theme control appears as a binary light/dark icon on Home but as a three-state selector in Progress; Home toggling from System replaces the stored preference rather than exposing System.

### Consolidation candidates

Cards, buttons, icon buttons, chips, section headers, status badges, progress bars, stat tiles, language rows, and standard feedback states are high-confidence candidates. Consolidation should preserve screen-specific content and interactions rather than force every surface into one visual form.

## 14. UX findings

### Finding — Home lacks a real resume action

- Severity: Medium
- Evidence: Start Here always routes to the first A1 lesson.
- File: `index.tsx`
- Component/screen: Start Here
- Why it matters: experienced learners must scan expanded sections to continue.
- Future design direction: derive a continue target from existing completion data in a later approved phase.

### Finding — stale “all 8 lessons” achievement

- Severity: High
- Evidence: Scholar unlocks at eight while the app contains 61 lessons.
- File: `progress.tsx`, `data/lessons.ts`
- Component/screen: Scholar achievement
- Why it matters: misleading completion feedback undermines trust in progression.
- Future design direction: reconcile milestone wording and threshold separately from visual redesign.

### Finding — privacy policy is not discoverable in-app

- Severity: Medium
- Evidence: `/privacy-policy` exists in the root stack, but no `router.push`, Link, or visible navigation entry to it exists in mobile routes.
- File: `app/_layout.tsx`, `app/privacy-policy.tsx`
- Component/screen: Privacy Policy
- Why it matters: users cannot readily revisit legal/data information from the app UI.
- Future design direction: identify an appropriate existing utility section for a link; do not create a broad profile feature solely for this.

### Finding — selected Pro Practice content is not revalidated in-place

- Severity: Medium
- Evidence: `visibleLessons` reacts to entitlement, but `selectedLesson` remains independent; `words` always comes from the selected lesson.
- File: `practice.tsx`
- Component/screen: PracticeScreen
- Why it matters: if entitlement changes while a paid lesson is already selected, its cards can remain visible until selection or screen lifecycle changes.
- Future design direction: handle entitlement-driven selection validity in a later correctness-approved task, preserving the verified access policy.

### Finding — mixed primary purpose on Progress

- Severity: Low
- Evidence: analytics, achievements, theme, feedback, and reset share one continuous screen.
- File: `progress.tsx`
- Component/screen: ProgressScreen
- Why it matters: the learning narrative weakens after achievements and destructive reset sits in a frequently visited learning tab.
- Future design direction: improve grouping and visual separation before considering navigation changes.

### Finding — action feedback is uneven

- Severity: Low
- Evidence: quiz answers and flashcards use haptics and explicit states; known-word toggling changes an icon; Home expansion has no haptic; AI loading uses only an hourglass; billing errors use Alerts.
- File: multiple route files
- Component/screen: cross-screen interactions
- Why it matters: state-change confidence varies across core tasks.
- Future design direction: define feedback rules by action importance, latency, and reversibility.

## 15. Polish-language presentation

Polish content is generally treated well:

- Inter supports Polish diacritics and the data visibly includes Ą, Ć, Ę, Ł, Ń, Ó, Ś, Ź, and Ż.
- Polish is consistently placed before English.
- Primary vocabulary Polish is larger and/or heavier than its translation.
- Phonetic guidance is italic and muted.
- Examples preserve Polish-first order with English below.
- Lesson detail supplies explicit pronunciation guidance.
- Speech actions use Polish locale selection and slower rates.
- Quiz prompts make Polish the largest element and test English meaning.
- Incorrect results include a Polish/phonetic/English review stack.
- AI examples and messages support multiline content and 21 px line height.

Potential learning-friction points:

- Phrasebook uses only 17 px Polish and 14 px English; hierarchy is present but subtle.
- Lesson example Polish is 13 px, smaller than main English translation, which can reduce focus on the target language.
- Long words and sentences mostly wrap naturally, but several horizontal layouts place text beside fixed actions.
- Quiz answer options have no explicit maximum lines; long English definitions can increase row height, which is acceptable within a scroll view.
- Phonetic spellings are custom plain text rather than IPA; the audit does not assess content correctness.
- Screen readers receive no language metadata to switch pronunciation between Polish and English text.

Finding — language is visually distinguished but not semantically identified

- Severity: Medium
- Evidence: Polish and English are separate Text elements, but no language/accessibility-language metadata is supplied.
- File: lesson, practice, phrasebook, quiz, and AI routes
- Component/screen: Polish learning text
- Why it matters: screen readers may pronounce Polish using the device’s default English voice.
- Future design direction: Phase 2.2 accessibility rules should define semantic language handling where supported.

## 16. Responsive behaviour

Strengths:

- Major content screens scroll.
- Lesson and quiz content wrap and allow variable card height.
- Lesson metadata flex-wraps.
- Practice gives its card content a nested scroll region to protect action buttons on short screens.
- Safe-area insets are used for tab content, sticky footers, paywall, privacy, Practice, AI input, and global error UI.
- Bottom content generally reserves 80–120 px for the absolute tab bar or fixed CTA.
- Phrasebook and curriculum lists use FlatList/scrolling patterns suitable for long data.

Risks:

- Home’s four-card stats row has no wrap behavior.
- Progress uses two columns at `47.5%` plus a fixed gap; this is workable on standard phones but can compress under large text.
- AI’s `maxHeight: 255` setup pane is sensitive to font scaling and small aspect ratios.
- Quiz’s 160 px score circle and 40–48 px hero/stat text consume substantial vertical space.
- Fixed 46 px AI send button and several 32–40 px visual controls do not all guarantee recommended touch size.
- Classic Android tab height is left to navigator defaults while content adds its own fixed 80–100 px allowances, so unusual navigation-bar configurations could create too much or too little space.
- Android AI KeyboardAvoidingView has no explicit behavior; correctness depends on platform window resizing and the keyboard-controller provider.
- Most text allows system scaling by default, but fixed heights/max heights and dense horizontal rows are not designed around large accessibility fonts.

## 17. Accessibility

Positive evidence:

- Home theme toggle has role and dynamic label.
- Lesson speech and known-word buttons have role and labels.
- Progress theme choices expose selection state and labels.
- Global error detail controls have roles and labels.
- Important quiz states use icons in addition to colour.
- Most primary buttons have visible text.
- Disabled billing and send controls use actual `disabled` state.

Gaps:

- Most Pressables lack `accessibilityRole="button"`.
- Custom selected chips generally do not expose `accessibilityState.selected`.
- Locked lesson rows do not expose disabled/locked state or an explanatory hint.
- Collapsible level headers do not expose expanded/collapsed state.
- Phrase cards do not describe that tapping plays audio or expose speaking state.
- Search clear, paywall close, AI Reset, and several icon controls lack explicit labels.
- Progress bars have no adjustable/progress semantics or values.
- Quiz answers do not expose correct/incorrect state programmatically.
- Achievement lock/unlock is communicated primarily through opacity and a conditional icon.
- `mutedForeground` text is used extensively at 10–13 px; exact contrast depends on surface, but small muted text warrants measurement in both themes.
- No reduced-motion preference is consulted for card flip, modal, stack, or automatic list scrolling.
- No explicit accessibility-language metadata is used for Polish speech content.

Finding — custom controls lack a shared accessibility contract

- Severity: High
- Evidence: accessibility props appear on a minority of Pressables and are absent from recurring cards, chips, level accordions, phrase audio rows, progress bars, and quiz states.
- File: all major route files
- Component/screen: system-wide custom controls
- Why it matters: screen-reader navigation, state discovery, and motor accessibility are inconsistent across core learning tasks.
- Future design direction: require semantics, state, label/hint, focus behavior, contrast, and minimum hit area in every Phase 2.2 interactive primitive.

## 18. Existing visual assets

Mobile bitmap assets:

| Asset | Dimensions | Purpose |
|---|---:|---|
| `assets/images/icon.png` | 1024×1024 | App icon |
| `assets/images/adaptive-icon.png` | 1024×1024 | Android adaptive icon foreground |
| `assets/images/splash.png` | 768×1408 | Splash artwork |
| `assets/images/pro-unlock-product-icon.png` | 1024×1024 | Pro product/store artwork |

No stored app screenshots, Play Store screenshot set, Figma exports, native test renders, or prior full-screen UI mockups were found. `artifacts/mockup-sandbox` is an empty/generic component-preview host with a broad generic UI component library; no Polish with Me mockup components are present, so it is not evidence of an alternate design.

No review screenshots were generated. Rendering was not needed to establish the inventory, and no emulator/device session was already available through the repository. No configuration, dependency, or build operation was performed.

## 19. Preservation map

Phase 2 must explicitly preserve:

- five-tab navigation order and access to Home, Practice, Phrases, AI Tutor, and Progress unless a later phase separately approves navigation change;
- all 61 lessons, their order, CEFR levels, descriptions, grammar notes, categories, estimated duration, words, examples, and translations;
- all 90 phrasebook entries, categories, search fields, filtering, and Polish speech behavior;
- Polish-first visual learning hierarchy, phonetics, English translations, examples, and pronunciation controls;
- quiz distractor generation, answer correctness, immediate feedback, final scoring, review words, retry, and completion behavior;
- lesson completion, best quiz scores, known words, XP, streak, study dates, and AsyncStorage persistence;
- first-completion XP and score-improvement XP rules;
- achievement functionality until any correctness change is separately approved;
- light/dark/system theme behavior and persisted preference;
- A1 free; A2, B1, and B2 Pro;
- Google Play `pro_unlock` → RevenueCat CustomerInfo → active `pro` entitlement authority;
- dynamic price, lifetime wording, purchase confirmation, purchase/restore entitlement verification, cancellation/errors, restore, lifecycle synchronization, concurrency protection, refund/revocation handling, and fail-closed access;
- direct-route lesson and quiz gating;
- AI server security and rate-limit architecture, installation identifier, last-eight-message request shape, timeouts, local guided fallback, client usage display, and Free/Pro quota behavior;
- Progress feedback email and destructive reset confirmation;
- privacy content and global error recovery;
- haptics where they currently reinforce answers, practice, selection, and reset;
- safe-area handling, keyboard support, and scrolling behavior;
- no-account/local-first product model.

## 20. Design opportunity map

### KEEP

- Curriculum grouped by CEFR level: clear mental model and directly backed by data.
- Polish → phonetic → English stack: consistent with the learning goal.
- Lesson grammar/pronunciation panel: context appears before vocabulary.
- Immediate quiz colour/icon/haptic feedback: clear and multimodal.
- Quiz missed-word review: useful without adding a feature.
- Phrasebook search, categories, and tap-to-speak: compact and functional.
- Theme palette and dark mode: coherent base identity.
- Flat bordered surfaces with minimal shadow: calm and readable.
- Dynamic lifetime paywall wording and verified entitlement flow.
- AI scenario/level setup plus guided fallback transparency.

### POLISH

- Home hierarchy: retain its data and curriculum, but clarify the primary continuation action and reduce competition among summary blocks.
- Progress presentation: retain metrics and achievements, improve grouping and correct stale copy in a separately approved correctness task.
- AI responsive split: preserve controls and chat while improving vertical adaptability and mode clarity.
- Phrase rows and lesson language hierarchy: preserve content and audio while strengthening target-language emphasis and touch semantics.
- Loading/error/empty treatments: preserve behavior but make state presentation systematic.
- Paywall accessibility and spacing: preserve visual proposition and billing behavior.

### CONSOLIDATE

- Screen containers and headers.
- Primary, secondary, destructive, and text buttons.
- Icon buttons with minimum hit areas.
- Cards, rows, and selected/pressed variants.
- Chips and segmented controls.
- CEFR, grammar, completion, Pro, known, and achievement badges.
- Progress bars and metric tiles.
- Polish/phonetic/English content blocks.
- Sticky action footers.
- Standard loading, empty, inline error, and retry states.
- Motion/haptic recipes.

### REDESIGN LATER

- Home’s fixed Start Here behavior and dense top dashboard.
- Progress’s mixed analytics/settings structure.
- Achievement system presentation after the stale “8 lessons” rule is resolved.
- AI Tutor’s fixed-height selector/chat composition.
- Cross-screen paid-content discoverability rules (visible locked versus hidden).
- Accessibility semantics across all custom controls.

These items require future approval; none are implemented by this audit.

## 21. Phase 2.2 design-system requirements

Phase 2.2 should define:

1. Semantic colour tokens for brand, text, surfaces, borders, feedback, CEFR levels, Pro, locked, selected, pressed, disabled, overlays, and progress in light/dark themes.
2. A typography scale covering display learning text, screen title, section title, card title, body, translation, phonetic, metadata, label, button, and statistics, with minimum line heights and large-font behavior.
3. A spacing scale and standard screen gutters, including rules for 16/20/24 px contexts.
4. Radius categories for small badge, control, card, hero/modal, and circle instead of one unused global radius plus local literals.
5. Border, divider, and elevation rules preserving the current flat visual character.
6. Button variants: primary, secondary, destructive, text, icon, sticky CTA, loading, disabled, and pressed.
7. Card/row variants: default, selected, completed, locked, error, success, interactive, and learning-content.
8. Navigation specifications for classic and native tabs, including semantic parity and content bottom spacing.
9. Progress components for overall, level, quiz/card sequence, XP, metric tiles, and accessibility values.
10. Language-learning patterns for Polish, phonetic, English, examples, long text, audio, and known-word state.
11. Entitlement visual patterns for lock, Pro badge, upgrade prompt, hidden-versus-visible policy, and entitlement loading.
12. Feedback-state patterns for loading, empty, unavailable, offline/fallback, error, success, and retry.
13. Form/input patterns for search and multiline chat, including keyboard, clear, disabled, character limit, and send state.
14. Motion and haptic rules, including duration, purpose, automatic scrolling, and reduced-motion handling.
15. Accessibility requirements: 44–48 px hit targets, roles, names, hints, selected/expanded/disabled/busy state, progress values, correct/incorrect announcements, language metadata, contrast, focus order, and font scaling.
16. Responsive rules for small Android phones, large fonts, compact heights, long Polish/English copy, sticky footers, and tab-bar clearance.
17. Content-density and hierarchy rules for dashboards so Home and Progress can share data without appearing duplicated.
18. Icon policy for Ionicons, SF Symbols, Feather fallback, emoji, filled/outline states, and standard sizes.

## 22. Recommended Phase 2 sequence

1. Approve Phase 2.2 tokens and accessibility foundations without altering navigation, data, billing, or learning logic.
2. Build a small set of primitives: Screen, Header, Button/IconButton, Card/Row, Chip/Badge, ProgressBar, StatTile, and feedback states.
3. Validate primitives in light/dark themes, small Android dimensions, large font scaling, and long Polish copy.
4. Polish Home and Progress together because they share metrics and hierarchy decisions.
5. Polish Lesson, Practice, Quiz, and Phrasebook as one learning-language family.
6. Polish AI Tutor separately around keyboard, compact-height, fallback-mode, and chat requirements.
7. Apply the approved primitives to paywall presentation without touching billing or entitlement logic.
8. Perform a dedicated accessibility and responsive pass across every route.
9. Capture real-device Android screenshots and compare states: empty/new learner, progressed learner, free/locked, Pro, light/dark, loading/error, quiz correct/incorrect/results, AI fallback, and large text.
10. Run regression verification for progress, quiz correctness, RevenueCat lifecycle/concurrency, access policy, AI quotas/security, speech, persistence, and safe areas.

### Audit verification

- Existing production files modified by Phase 2.1: none.
- New file created: `docs/phase_2_1_ui_ux_audit.md`.
- Dependencies installed: none.
- Configuration changed: none.
- Production code changed: none.
- Billing/RevenueCat code changed: none.
- Learning/progress logic changed: none.
- Existing Phase 1 uncommitted changes were preserved and not attributed to this audit.
