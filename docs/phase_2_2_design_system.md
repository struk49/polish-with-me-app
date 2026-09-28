# POLISH WITH ME — PHASE 2.2 DESIGN SYSTEM

## 1. Design vision

**Modern Polish editorial + friendly language learning.**

Polish with Me should feel like learning with a thoughtful contemporary tutor: clear, adult-friendly, calm, encouraging, and unmistakably connected to Polish language and culture without relying on flags, folk motifs, or novelty decoration on every screen.

The interface should borrow from editorial design—strong type hierarchy, deliberate whitespace, structured sections, and confident use of a small colour palette—while retaining the warmth and immediacy required for daily practice. Polish words, examples, and conversations are the visual subject. Interface chrome supports them rather than competing with them.

The system formalizes the product that already exists: five tabs, 61 lessons, 862 vocabulary items, 90 phrases, quizzes, XP, streak, speech, AI Tutor, Progress, and RevenueCat Pro. It does not change product behavior or information architecture.

## 2. Design principles

1. **Polish content leads.** Polish phrases and learning prompts receive the strongest typographic emphasis; translation, pronunciation, metadata, and controls support them.
2. **Polish, not stereotypical.** Use Polish red, precise typography, language, and restrained cultural references. Avoid decorative clichés, flag saturation, and souvenir aesthetics.
3. **Warm, not childish.** Rounded forms and encouraging feedback are welcome; cartoon excess, confetti everywhere, oversized gamification, and novelty rewards are not.
4. **Progress is calm evidence.** XP, streak, lessons completed, levels, and quiz results should make growth legible without turning every screen into a dashboard.
5. **Red has a job.** Red identifies brand, primary action, active navigation, and Pro. It is not a default background for every card or feature.
6. **State is explicit.** Available, selected, completed, locked, correct, incorrect, loading, and disabled states must be distinguishable by more than colour.
7. **Consistency serves speed.** Repeated controls should behave and look the same so learners can focus on Polish rather than relearning the interface.

## 3. Brand foundation

### Promise

“Learning Polish with a helpful modern tutor.”

### Visual personality

- editorial rather than dashboard-like;
- structured rather than dense;
- approachable rather than playful-for-playfulness’s-sake;
- confident rather than loud;
- contemporary Polish rather than generically European;
- content-rich without visual clutter.

### Emotional tone

- **Welcoming:** plain language, generous spacing, friendly prompts.
- **Intelligent:** clear hierarchy, correct terminology, restrained decoration.
- **Motivating:** visible progress, direct next actions, quiet completion acknowledgement.
- **Trustworthy:** stable patterns, explicit billing wording, legible states, no manipulative urgency.
- **Calm:** neutral surfaces carry most of the interface; red is concentrated at decisive moments.

### Brand characteristics

The core signature is the relationship between warm neutral paper-like backgrounds, crisp dark typography, Polish red, and prominently typeset Polish language. Subtle red rules, badges, active icons, or initial letters can carry identity. A screen should remain recognizably Polish with Me even after removing any flag emoji.

## 4. Colour system

The proposed palette evolves the existing `#C8102E` light-mode identity and dark-mode red while reducing hard-coded feature colours. Values are specification targets and must be contrast-tested in implementation on their actual paired surfaces.

### Semantic tokens

| Token | Light | Dark | Intended use | Contrast considerations |
|---|---|---|---|---|
| `brand.primary` | `#C8102E` | `#FF5A5F` | Primary CTA, active navigation, selected high-emphasis controls, brand details | White text on light red and near-black text on dark red must meet 4.5:1; verify final pairings. |
| `brand.primaryPressed` | `#A90D27` | `#FF7377` | Pressed primary fill | Preserve text contrast; do not indicate press by opacity alone. |
| `brand.primarySoft` | `#FBEAEC` | `#3A2025` | Selected/brand-tinted surface, subtle callout | Use `brand.primary` or `text.primary`, not white, for text. |
| `background.primary` | `#FAFAF8` | `#18181A` | Main screen background | Base canvas; primary text must exceed 7:1 where practical. |
| `background.secondary` | `#F3F2EF` | `#202023` | Grouped sections, inset regions, search background | Must remain visibly distinct from primary without looking disabled. |
| `surface.primary` | `#FFFFFF` | `#29292D` | Standard cards, rows, inputs | Pair with default border in both modes. |
| `surface.secondary` | `#F6F5F2` | `#323237` | Nested examples, inactive controls, subtle blocks | Secondary text must retain at least 4.5:1 for normal text. |
| `surface.elevated` | `#FFFFFF` | `#36363B` | Modal, sheet, floating confirmation | Elevation is expressed through border plus restrained shadow/tonal lift. |
| `text.primary` | `#1C1C1E` | `#F5F5F7` | Titles, Polish content, primary values | Target at least 7:1 against primary background. |
| `text.secondary` | `#4D4D52` | `#C9C9CF` | English translation, body, supporting explanation | Minimum 4.5:1 for normal text. |
| `text.muted` | `#6F7076` | `#A7A7AF` | Metadata, pronunciation, captions | Do not use below 12 px; verify 4.5:1 for instructional content. |
| `text.inverse` | `#FFFFFF` | `#18181A` | Text/icons on strong filled controls | Only use on a tested strong fill. |
| `border.default` | `#E2E1DE` | `#3E3E44` | Standard card/input dividers | Structural, not the sole indication of selection. |
| `border.strong` | `#B8B7B3` | `#5C5C64` | Focus, selected neutral, emphasized separation | Maintain visibility at 1–2 px. |
| `state.success` | `#187A3D` | `#55D982` | Correct answer, completion, known word | Use icon/text as well as colour. White-on-green requires verification. |
| `state.successSoft` | `#E7F5EC` | `#193526` | Correct/completed background | Pair with `state.success` and check icon. |
| `state.warning` | `#A85A00` | `#FFB14A` | Streak emphasis, caution | Not for incorrect answers. Pair with icon or text. |
| `state.warningSoft` | `#FFF2DD` | `#3B2C18` | Streak/caution surface | Use dark/light foreground appropriate to theme. |
| `state.error` | `#C52828` | `#FF6868` | Incorrect answer, destructive action, error | Never rely on red alone; include close/error icon and wording. |
| `state.errorSoft` | `#FCEAEA` | `#3D2022` | Error/incorrect background | Pair with `state.error`; avoid confusing it with brand surfaces by context and icon. |
| `progress.track` | `#E8E7E3` | `#3A3A40` | All progress tracks | Maintain track/fill separation without excessive contrast. |
| `progress.fill` | `#C8102E` | `#FF5A5F` | Overall, lesson, quiz, and XP progress | Must have an accessible numeric/text value elsewhere. |
| `pro.primary` | `#A50E28` | `#FF777B` | PRO label, lock emphasis, paywall accents | Same brand family; “PRO”/lock distinguishes purpose. No gold. |
| `pro.soft` | `#F8E7EB` | `#3A2228` | Locked lesson and restrained upgrade surface | Locked content remains legible; do not reduce whole card below 70% opacity. |
| `locked.icon` | `#73747A` | `#A8A8B0` | Lock and unavailable-control icon | Pair with visible PRO label or explanatory text. |
| `locked.surface` | `#F1F0ED` | `#252529` | Locked lesson background | Must not resemble a broken/disabled app surface. |
| `streak.primary` | `#A85A00` | `#FFB14A` | Flame and streak value | Use sparingly; retains familiar warm flame semantics. |
| `xp.primary` | `#7B3FA1` | `#C88BEA` | XP value when it must differ from overall progress | Purple is reserved for XP, not arbitrary features. |
| `interactive.disabled` | `#A5A5A9` | `#6F6F76` | Disabled text/icon and derived fill | Disabled controls still require readable labels; use opacity plus state semantics. |

### CEFR accents

CEFR levels need stable recognition because Home, lessons, Practice, and AI Tutor already expose A1–B2. These are secondary accents, not feature themes:

| Level | Strong | Soft light | Soft dark |
|---|---|---|---|
| A1 | `#187A3D` | `#E7F5EC` | `#193526` |
| A2 | `#A85A00` | `#FFF2DD` | `#3B2C18` |
| B1 | `#7540A1` | `#F1E9F8` | `#30243A` |
| B2 | `#A50E28` | `#F8E7EB` | `#3A2228` |

Every level badge includes text. Colour must never be the sole level identifier.

### Red usage rule

At most one dominant solid-red region should normally appear in a viewport. Use red for the primary action, active navigation, selection, a progress fill, or a major brand moment—not all simultaneously at equal weight. Large red surfaces are reserved for rare focal moments such as the existing Progress level hero or paywall price block; later mockups should evaluate whether a soft or neutral surface carries the same hierarchy more calmly.

## 5. Typography

Inter remains the sole interface and learning typeface. It already supports all Polish diacritics:

`ą ć ę ł ń ó ś ź ż` and `Ą Ć Ę Ł Ń Ó Ś Ź Ż`.

| Style | Family | Size / line | Weight | Letter spacing | Use |
|---|---|---:|---:|---:|---|
| Display | Inter | 36 / 44 | 700 | -0.4 | Rare result score or major learning prompt; wrap rather than truncate. |
| Screen title | Inter | 28 / 34 | 700 | -0.3 | Home, Practice, AI Tutor, Progress. |
| Section title | Inter | 20 / 26 | 700 | -0.1 | Curriculum, Achievements, review sections. |
| Card title | Inter | 16 / 22 | 600 | 0 | Lesson/scenario/card heading. |
| Polish learning phrase | Inter | 24 / 32 default; 32 / 40 hero | 700 | -0.1 | Vocabulary, phrase, flash card, quiz prompt. Must wrap. |
| Translation | Inter | 15 / 22 | 500 | 0 | English meaning beneath Polish. |
| Pronunciation | Inter | 14 / 20 | 400 italic | 0 | Phonetic support; never smaller than 13. |
| Body | Inter | 15 / 23 | 400 | 0 | Explanations and instructional copy. |
| Body small | Inter | 13 / 19 | 400 | 0 | Supporting descriptions and metadata with learning value. |
| Label | Inter | 12 / 16 | 600 | 0.8 | Short uppercase section label; avoid for sentences. |
| Button | Inter | 16 / 20 | 600 | 0 | Primary/secondary control text. |
| Caption | Inter | 12 / 17 | 400 | 0 | Counts and low-priority metadata. |
| Statistic large | Inter | 28 / 34 | 700 | -0.2 | XP, streak, score, level. |
| Statistic label | Inter | 12 / 17 | 500 | 0 | Meaning beneath/alongside the value. |

Rules:

- Polish is normally one type step and/or one weight stronger than English.
- English must remain readable, not faded into decorative metadata.
- Pronunciation is visually distinct through italic styling, not very low contrast.
- Normal learning content must not use `numberOfLines={1}` unless the full value is available elsewhere and truncation is non-destructive.
- Long words such as “Organizacja pozarządowa” and phrases such as “Czy ma pan/pani środek przeciwbólowy?” must wrap without shrinking.
- Support system font scaling. At large sizes, horizontal metadata groups may wrap or stack.
- Uppercase labels are limited to 1–3 words; do not uppercase Polish learning text.

## 6. Spacing

Use a compact 4 px-derived scale with one 2 px micro-step:

| Token | Value | Use |
|---|---:|---|
| `space.0` | 0 | Reset only |
| `space.0_5` | 2 | Optical micro-adjustment; never layout structure |
| `space.1` | 4 | Tight internal grouping |
| `space.2` | 8 | Icon/text gap, compact row gap |
| `space.3` | 12 | Standard element gap |
| `space.4` | 16 | Standard card padding, list gap |
| `space.5` | 20 | Default mobile screen gutter |
| `space.6` | 24 | Section separation, roomy card padding |
| `space.8` | 32 | Major content break |
| `space.10` | 40 | Large hero separation |
| `space.12` | 48 | Rare display spacing |

Application rules:

- Standard screen gutter: 20 px.
- Compact widths below 360 logical px: 16 px gutter.
- Large phones/tablets: retain readable content width; use 24 px gutter and a content max width appropriate to the screen rather than stretching cards indefinitely.
- Section spacing: 24–32 px.
- Card padding: 16 px standard; 20–24 px for a hero/feature card.
- Compact internal gap: 4–8 px.
- Standard row gap: 12 px.
- List spacing: 8–12 px depending on row density.
- Sticky footer padding: 12 px top, screen gutter sides, `16 + safeArea.bottom` bottom.
- Bottom-navigation clearance: measured tab-bar height plus safe area plus 16 px; never a guessed screen-specific 80/100/120 constant.
- Arbitrary 5, 6, 7, 10, 13, 14, and 18 px layout gaps should be mapped to the closest token unless an optical exception is documented.

## 7. Shape and radius

| Token | Value | Use |
|---|---:|---|
| `radius.small` | 8 | Compact badges, number tiles, inner examples |
| `radius.control` | 12 | Buttons, inputs, chips, icon controls |
| `radius.card` | 16 | Standard cards and list rows |
| `radius.feature` | 20 | Flash cards, hero cards, paywall/modal cards |
| `radius.pill` | 999 | Short status/count badges only |

Pills are appropriate for compact, atomic metadata such as `PRO`, `A1`, `3 day streak`, or `12/15 today`. They are not appropriate for every lesson category, long scenario title, full-width button, or multi-line description. Full cards should retain softened rectangles rather than capsule geometry.

## 8. Elevation and borders

The system remains predominantly flat.

### Flat surface

- Background token only.
- No border or shadow.
- Use for screen canvas and clearly separated large sections.

### Bordered card

- `surface.primary` fill.
- 1 px `border.default`.
- `radius.card`.
- No shadow.
- Default for lessons, phrases, stats, achievements, scenarios, and inputs.

### Elevated card

- `surface.elevated` fill.
- 1 px `border.default`.
- Light: shadow colour `#000000`, offset 0/2, opacity 0.08, radius 8, elevation 2.
- Dark: rely primarily on tonal lift and strong border; shadow opacity no more than 0.24.
- Use only when a card floats over or temporarily separates from content.

### Modal/sheet

- `surface.elevated`.
- `radius.feature` on modal; top corners only for bottom sheet.
- Overlay: black at 48% light / 64% dark.
- Shadow equivalent to elevation 3–4, restrained and non-decorative.

Selected/completed state uses a 2 px semantic border or inner indicator without changing layout dimensions. Dividers use one physical pixel where supported.

## 9. Buttons

All button variants share:

- minimum visual height: 48 px;
- minimum touch target: 48×48 px;
- `radius.control`;
- 16 px horizontal padding, 12 px for compact controls;
- Button type style;
- 8 px icon/text gap;
- one leading or trailing icon, never both unless the action meaning requires it;
- visible focus treatment: 2 px `border.strong` plus 2 px outer spacing or platform-equivalent focus indicator;
- accessibility role, name, state, and busy status.

### Primary

- Normal: `brand.primary` fill, `text.inverse` label.
- Pressed: `brand.primaryPressed`, subtle scale to 0.98 only when reduced motion is off.
- Disabled: disabled fill derived from `interactive.disabled`; readable disabled label; no press animation.
- Loading: preserve width and label context where possible; spinner plus accessible “Loading”/busy state.
- Uses: Continue, Start/Take Quiz, Next, purchase, AI send where text is not practical.

### Secondary

- Normal: `surface.primary`, 1 px `border.default`, `text.primary`.
- Pressed: `surface.secondary`, `border.strong`.
- Disabled/loading follow shared rules.
- Uses: Try Again, Not yet, alternate action.

### Tertiary

- Transparent fill, `brand.primary` label/icon.
- Pressed: `brand.primarySoft`.
- Minimum 48 px touch target even if visual content is smaller.
- Uses: Reset conversation, Restore Purchases, secondary text actions.

### Destructive

- Prefer outlined/soft presentation for Reset Progress; solid error fill only in confirmation context.
- Uses `state.error` and `state.errorSoft`, with explicit destructive wording.

### Icon button

- 48×48 px default; 44×44 px absolute minimum where platform chrome requires it.
- Icon 20–24 px.
- Must have an accessibility label; tooltip/hint where ambiguity remains.
- Selected/toggled state uses soft fill plus changed icon/state, not colour alone.
- Uses: theme, audio, known word, close, search clear, send.

Purchase and Restore use the same visual state rules, but their verified billing behavior and shared operation lock remain untouched.

## 10. Cards

One foundational Card surface supports semantic variants rather than screen-specific geometry.

| Variant | Structure | State treatment | Existing uses |
|---|---|---|---|
| Standard row | 16 px padding, 16 radius, border | Pressed surface change; optional trailing action | Phrase, vocabulary, achievement |
| Lesson | leading status tile, flexible content, trailing metadata/state | Available/completed/locked variants defined below | Home curriculum |
| Feature | 20–24 px padding, 20 radius | May use soft brand surface; one primary action | Home start card, lesson hero |
| Stat | 16 px padding, minimum readable width | Value then label; no decorative red fill by default | Home/Progress metrics |
| Scenario/choice | 16 px padding, 16 radius | 2 px selected border plus check/selected semantics | AI scenarios, lesson picker |
| Information | 16 px, semantic soft surface | leading semantic icon, readable body | Grammar, pronunciation, AI help |
| Pro | neutral or `pro.soft`; standard geometry | PRO/lock identity, not gold/luxury styling | Locked lesson, upgrade prompt |

Card rules:

- Titles use Card title; body uses Body small/Body.
- Leading icon container is normally 40×40 with `radius.control`.
- Trailing icon/action must retain a 48 px touch target if interactive.
- Pressed state changes surface and border; opacity alone is insufficient.
- Disabled content remains readable and carries a reason/state label.
- Avoid nesting bordered cards more than one level. Nested examples use `surface.secondary` without another strong border.

## 11. Learning content

### Hierarchy

1. **Polish phrase:** `text.primary`, Polish learning phrase style, allowed to wrap fully.
2. **Pronunciation:** `text.muted`, Pronunciation style, directly beneath Polish with 4 px gap.
3. **English translation:** `text.secondary`, Translation style, 8 px below the Polish/pronunciation group where space permits.
4. **Explanation:** Body or Body small in an Information card.
5. **Example:** Polish first at Body/500; English second at Body small/400; `surface.secondary` container.
6. **Grammar note:** semantic Information card with school/book icon, clear title, full-width readable copy.

### Audio/listen

- Audio sits at the trailing edge of a phrase/word row or directly below a large centered flash-card phrase.
- Icon button is 48×48; speaker icon 22–24 px.
- Idle: outline speaker, neutral icon.
- Speaking: filled/high-volume icon, soft brand background, `accessibilityState.busy` or selected equivalent, and optional “Playing” announcement.
- A whole-row tap may trigger audio only where visually and semantically explained, as in Phrasebook.
- Stopping audio uses the same target and retains label clarity.

### Correct and incorrect language

Correct: success soft surface, success border, check icon, and “Correct” announcement/text where appropriate. Incorrect: error soft, error border, close icon, and the correct answer explicitly shown. Neither state may depend only on green/red.

## 12. Lesson states

### Available

- Standard Lesson card.
- Book outline icon on neutral/level-soft tile.
- Title `text.primary`; metadata `text.muted`.
- Chevron indicates navigation.

### In progress

- Standard surface with `border.strong` or level accent on a narrow leading edge.
- Book/open-book icon.
- Existing progress count or best quiz score when available; do not invent new persistence.
- Optional “In progress” badge only if the current data can support it truthfully.

### Completed

- Standard surface, subtle `state.successSoft` status tile or 2 px success/brand accent.
- Check-circle icon and “Completed” semantic state.
- Retain title contrast; do not wash out the whole card.
- Quiz score remains visible where currently shown.

### Locked / Pro

- `locked.surface` or `pro.soft`, standard border.
- Lock icon plus visible `PRO` badge.
- Title remains readable; supporting copy may use `text.muted`.
- Pressing follows existing upgrade navigation.
- Do not use low opacity as the only locked treatment and do not make the card look broken.
- A1 remains free; A2/B1/B2 remain Pro.

## 13. Quiz feedback

| State | Surface/border | Icon/text | Motion |
|---|---|---|---|
| Unanswered | `surface.primary` / `border.default` | option letter, `text.primary` | press feedback only |
| Selected before evaluation, if used | `brand.primarySoft` / `brand.primary` | selected indicator and selected semantics | 120 ms border/surface transition |
| Correct | `state.successSoft` / 2 px `state.success` | check-circle; correct label/announcement | optional 140 ms settle/pulse; success haptic |
| Incorrect | `state.errorSoft` / 2 px `state.error` | close-circle; incorrect announcement | optional 140 ms horizontal nudge ≤4 px; error haptic |
| Disabled after answer | Preserve correct/incorrect result; other options use neutral surface/text | disabled semantics, not blanket low opacity | none |
| Completed | score, correct count, learning-oriented message, review list | score is text as well as visual | short result entrance only; reduced-motion safe |

The correct answer must remain visually prominent even when the learner chose incorrectly. Answer rows must expand for long translations. The Next/See Results action appears after feedback as it does today.

## 14. Pro visual language

Pro is part of Polish with Me, not a separate luxury brand.

- Palette: `pro.primary` and `pro.soft`, derived from Polish red.
- Badge: compact `PRO` uppercase, 11–12 px semibold, 8 px radius; always accompanied by context or lock on first exposure.
- Locked lesson: readable neutral/soft-red card, lock icon, PRO badge, normal title hierarchy.
- Upgrade prompt: one clear value proposition, dynamic price, lifetime wording, and one primary purchase action.
- Paywall: warm neutral canvas, editorial headline, selective red feature area, simple benefit rows; avoid gold, gradients, crowns, sparkles-as-luxury, or countdown pressure.
- Premium feature indicator: use only when a feature is genuinely entitlement-gated. AI’s larger quota may show a restrained PRO label near its quota explanation, without implying that AI Tutor itself is wholly locked.
- Successful purchase transition remains navigation after verified active `pro`; design must never imply access before CustomerInfo verification.
- Restore remains visually tertiary but discoverable and accessible.

## 15. Progress visual language

The system presents only existing progress concepts.

### Progress bar

- Height 8 px for dashboard/level progress; 6 px for quiz/practice sequences.
- Track `progress.track`, fill `progress.fill`, rounded ends.
- Always accompanied by a count, percentage, or accessible value.
- Animate fill changes 200–300 ms when reduced motion is off.

### XP

- Numeric value uses Statistic large; “XP” is Statistic label or part of the value.
- Use `xp.primary` when XP appears beside other semantic metrics; use brand progress fill within the existing level hero where hierarchy is already established.
- Do not add coins, gems, or currencies.

### Streak

- Flame icon plus numeric days.
- `streak.primary` on neutral/soft-warning background.
- Always show unit (“day streak” or “days”), not only a flame and number.
- Never use shame or loss-pressure copy.

### Level

- Existing numeric learner level remains a large statistic, not confused with CEFR A1–B2.
- CEFR uses LevelBadge with A1/A2/B1/B2 text and stable accent.

### Completed count and overall progress

- Use `completed / total` plus a descriptive label.
- Overall completion uses a horizontal bar by default. A ring is not necessary; if a future mockup uses one for a single hero summary, it must also contain the percentage as text and must not duplicate a nearby bar.
- Home uses a concise progress summary; Progress may show the fuller set of XP, streak, lesson, known-word, quiz, and achievement metrics.

## 16. Icons

Ionicons remains the primary cross-platform library. SF Symbols may remain in native iOS tabs where the current implementation requires them; choose semantic equivalents. Feather remains limited to the global fallback unless consolidation is approved.

| Size | Use |
|---:|---|
| 16 | inline metadata, compact badge |
| 20 | standard row/action icon |
| 24 | icon-only control, navigation, primary action |
| 32 | feature statistic/empty state |
| 40 | rare empty/result illustration |

Rules:

- Use outline icons for inactive/navigation-neutral state and filled icons for active/completed state when equivalents exist.
- Keep icon/text gap at 8 px standard, 4 px compact.
- Icon-only controls require 48×48 targets, accessible names, and visible state.
- Do not mix unrelated icon styles in the same surface.
- Emoji may remain as emotional or cultural content, such as the completion celebration or Polish reference, but functional rotate/check controls should use Ionicons.
- Icons supplement text; a lock, check, or close must not be the only explanation of a consequential state.

## 17. Bottom navigation

Preserve exact order and labels: Home, Practice, Phrases, AI Tutor, Progress.

- Container: `surface.elevated` or platform material/blur with equivalent tonal hierarchy.
- Top edge: one physical pixel `border.default`; no decorative shadow on Android beyond elevation 0–1.
- Active icon/label: `brand.primary`, filled icon where available, Label/600.
- Inactive icon/label: `text.muted`, outline icon, Label/500.
- Labels remain visible; do not switch to icon-only navigation.
- Icon sizes: 22–24 px.
- Each tab target: at least 48 px high and wide.
- Respect bottom safe area; content clearance derives from actual bar height.
- Light: solid/elevated warm surface or platform light blur.
- Dark: elevated charcoal or platform dark blur; border separates it from content.
- Native Liquid Glass may retain platform rendering, but semantic active/inactive colours, labels, order, and accessibility must match classic tabs.

## 18. Headers

### Standard screen header

- 20 px horizontal gutter.
- Screen title style, left aligned.
- Optional one-line subtitle/body beneath with 4–8 px gap.
- Optional trailing action uses IconButton or Tertiary button.
- Top spacing derives from safe area, not per-screen platform constants.

### Back header

- Minimum 56 px content height plus safe area.
- 48×48 back IconButton, centered title where platform convention calls for it.
- Optional trailing action reserves symmetric space so title remains optically centered.
- Lesson/Quiz may continue using native Stack headers if visually mapped to these tokens.

### Contextual header

- Used when status belongs with the title: streak on Home, quota on AI Tutor, score/progress in Quiz.
- Title remains primary; status is a Badge or compact metadata group.
- No more than one trailing status/action cluster.

## 19. Chips and badges

### Chip

Interactive filter or selection. Height at least 40 px visually and 48 px touch target. `radius.control`, 12–16 px horizontal padding. Selected state uses soft/strong fill plus border or check and selected semantics. Uses: Phrase category, Practice lesson, AI level/scenario where compact.

### Badge

Non-interactive status. Compact, intrinsic width, `radius.small` or pill for numeric count. Uses: A1–B2, PRO, Completed, Known, quota, streak. Badges must not be used for long explanations.

### Plain metadata

Use icon + Caption/Body small without a container for lesson duration, word count, category, quiz count, or secondary values. This prevents excessive “pill UI.”

Specific treatments:

- LevelBadge: level text plus stable CEFR accent-soft fill.
- ProBadge: `PRO`, pro-soft fill, pro-primary text.
- CompletedBadge: check-circle + “Completed,” success-soft.
- XP badge: only for compact summaries; otherwise plain statistic.
- Streak badge: flame + number/unit, warning-soft.
- AI quota: chat icon + `remaining/limit today`; add PRO only when explaining the increased quota.

## 20. Motion

Motion is functional and brief.

| Token | Duration | Use |
|---|---:|---|
| `motion.instant` | 80 ms | colour/opacity response |
| `motion.fast` | 140 ms | button press, answer state |
| `motion.standard` | 220 ms | card selection, progress update |
| `motion.emphasis` | 320 ms | completion/result entrance |

Easing:

- enter/state: standard ease-out;
- exit: ease-in;
- progress: ease-in-out;
- no spring/bounce by default.

Allowed uses: pressed control feedback, flash-card flip, quiz correctness, progress fill, completion check, result entrance, and platform tab/stack transitions. Do not animate every card on screen load, loop decorative motion, delay the Next action, or use animation to conceal loading.

Haptics remain purposeful: selection for flip/filter, success/error for quiz, medium impact for starting a quiz, warning for destructive reset. Avoid stacking haptic events.

Reduced motion:

- replace scale/flip/nudge with crossfade or immediate state change;
- disable automatic animated scrolling where it can disorient;
- retain state feedback through icon, text, and colour;
- preserve platform reduced-motion preference.

## 21. Responsive rules

1. Design baseline: 360–430 logical px phone widths; verify at 320/360 and large Android sizes.
2. Gutter: 16 px below 360 width, 20 px standard, 24 px on large layouts with controlled content width.
3. No normal learning phrase or translation is truncated. Rows expand vertically and controls remain aligned to the top/center as appropriate.
4. Horizontal metric grids adapt: four Home stats may become two columns or a compact summary at small width/large text; do not shrink labels below the type scale.
5. Horizontal chip lists scroll and keep first/last gutter. Selected items must be programmatically announced.
6. Sticky footers use measured content height plus safe area. Scroll content receives matching bottom inset.
7. Keyboard-visible layouts keep the focused input and send action above the keyboard on Android and iOS.
8. Long Polish and English examples wrap inside the card; no fixed card height.
9. Metadata rows may wrap or stack at 200% font scaling.
10. Large result graphics must shrink or move below text on compact-height devices.

### AI Tutor rule replacing the fixed 255 px assumption

The setup region must be content-sized with a bounded *proportion*, not a fixed pixel height. On regular-height phones, header, quota, level, and scenarios occupy no more than roughly 40% of available height before chat. On compact height, large font, or keyboard-visible states, setup collapses into a summary/control row or remains independently scrollable with a clearly persistent chat region. The message list receives a minimum useful height of 160 px before the keyboard appears. No essential selector may be clipped, and focus must move predictably between setup, messages, and input.

## 22. Accessibility

These are implementation requirements, not optional polish:

- Minimum touch target: 48×48 px preferred; never below 44×44 px.
- Normal text contrast: at least 4.5:1; large text at least 3:1; meaningful icons/borders at least 3:1 against adjacent colours.
- Test contrast on both light and dark surfaces; alpha-derived colours must be measured after compositing.
- Do not rely on colour alone. Correct/incorrect, selected, completed, locked, Pro, and speaking states require icon/text and programmatic state.
- Every Pressable exposes the correct role and accessible name. Icon-only controls require explicit labels such as “Close upgrade,” “Play Polish pronunciation,” or “Clear search.”
- Expose `selected`, `expanded`, `disabled`, `busy`, and checked/toggled state where applicable.
- Progress exposes current/min/max or descriptive values such as “12 of 61 lessons completed, 20 percent.”
- Quiz feedback is announced after answer selection without moving focus unexpectedly.
- Polish and English content should carry language semantics where React Native/platform support permits; audio labels name the Polish content.
- Respect font scaling through at least 200% for essential content and controls. Do not solve overflow by disabling scaling.
- Logical focus order follows visual order. Modal focus is trapped and returned to the invoking control.
- Disabled controls remain readable and explain their state when the reason is not obvious.
- Motion respects reduced-motion settings.
- Haptics are supplemental, never the only feedback.

## 23. Light/dark themes

Both themes are first-class.

### Light

- Warm off-white background evokes editorial paper without beige decoration.
- White primary surfaces and subtle warm-grey secondary surfaces establish hierarchy.
- Polish red is deep enough for text/icons and confident primary controls.
- Cards generally use borders rather than shadows.
- Locked and Pro soft surfaces retain readable text rather than broad opacity reduction.

### Dark

- Near-black warm-neutral background, not pure black.
- Cards step through charcoal tones; borders become more important than shadows.
- Red is lighter and slightly warmer to remain visible without vibrating against black.
- Text uses off-white rather than pure white for long reading; `text.primary` remains strongest.
- Semantic soft surfaces are deep tinted neutrals, not translucent neon.
- Progress tracks remain visible; fills avoid excessive glow.
- Pro stays in the brand-red family and is distinguished through label/lock, not brightness alone.

Theme parity means the same semantic hierarchy and interaction states, not literal colour inversion. Every component example and future mockup must be reviewed in both modes before approval.

## 24. Proposed token architecture

No production token file is created in Phase 2.2. Future React Native mapping should remain small and semantic:

```text
theme
├── colors
│   ├── brand: primary, primaryPressed, primarySoft
│   ├── background: primary, secondary
│   ├── surface: primary, secondary, elevated
│   ├── text: primary, secondary, muted, inverse
│   ├── border: default, strong
│   ├── state: success, successSoft, warning, warningSoft, error, errorSoft
│   ├── progress: track, fill
│   ├── pro: primary, soft
│   ├── locked: icon, surface
│   ├── metric: streak, xp
│   └── level: a1, a2, b1, b2 (strong/soft)
├── typography
│   ├── display, screenTitle, sectionTitle, cardTitle
│   ├── polishPhrase, polishPhraseHero, translation, pronunciation
│   ├── body, bodySmall, label, button, caption
│   └── statisticLarge, statisticLabel
├── spacing: 0, 0_5, 1, 2, 3, 4, 5, 6, 8, 10, 12
├── radii: small, control, card, feature, pill
├── borders: hairline, default, selected
├── elevation: flat, card, elevated, modal
├── icons: inline, standard, control, feature
├── controls: minHeight, minTouchTarget
└── motion: instant, fast, standard, emphasis, easing
```

Component styles consume semantic tokens only. Screen code should not choose raw hexadecimal values, construct opacity suffixes, or invent local radii. Exceptions such as CEFR accents must come through named tokens.

## 25. Future component system

The smallest sensible reusable set is:

| Proposed component | Responsibility and variants | Existing screens |
|---|---|---|
| `AppScreen` | Safe-area-aware scroll/static container, standard gutter, tab/sticky-footer clearance, optional max width | All routes |
| `ScreenHeader` | Standard, back, and contextual header; subtitle and trailing action/status | Home, Practice, AI Tutor, Progress, privacy, lesson/quiz shell |
| `AppButton` | Primary, secondary, tertiary, destructive; icon, loading, disabled | All action screens, paywall |
| `IconButton` | Accessible 48 px audio, close, theme, clear, send, known state | Home, Lesson, Phrasebook, AI Tutor, paywall |
| `AppCard` | Standard, feature, information, selected, semantic state surface | All major screens |
| `ChoiceChip` | Filter/selection chip with selected semantics | Phrasebook, Practice, AI levels |
| `StatusBadge` | Level, Pro, completed, known, streak/quota variants | Home, Lesson, Practice, AI, paywall |
| `ProgressBar` | Overall, level/XP, sequence; value semantics and optional animation | Home, Practice, Quiz, Progress |
| `StatTile` | Value, label, optional icon; compact and standard responsive layouts | Home, Progress, practice results |
| `LanguageBlock` | Polish, pronunciation, translation, optional example; size variants | Lesson, Practice, Phrasebook, Quiz review |
| `AudioAction` | Speech idle/playing/error semantics; icon-only or row-trigger mode | Lesson, Phrasebook |
| `LessonCard` | Available, in-progress, completed, locked/Pro; metadata and score | Home curriculum |
| `FeedbackState` | Loading, empty, unavailable, offline, error, success with optional action | Phrasebook, routes, AI, billing surfaces |
| `StickyActionBar` | Safe-area-aware bottom CTA region | Lesson, paywall, future quiz action placement |
| `ChatBubble` | Learner, tutor, guided-fallback; content-first and accessible role/name | AI Tutor |

Screen-specific compositions such as Progress level hero, paywall price panel, flash card, quiz result, and achievement remain compositions of primitives rather than universal components prematurely.

## 26. Design examples

### Available A1 lesson

`[A1] Polish Alphabet` uses an A1 soft-green level badge, primary title, muted “32 words · 8 min,” book outline tile, and trailing chevron. Standard white/charcoal bordered card; no heavy green fill.

### Locked A2 lesson

`[lock] Everyday Conversations   PRO` uses `locked.surface`, readable title, A2 badge, word/time metadata, lock icon, and ProBadge. Pressing follows the existing paywall route. The card is not globally faded.

### Completed B1 lesson

`[check] Travel & Culture   90%` uses a success-soft status tile, explicit completed semantics, B1 badge, and existing best quiz score. Reward is visible but quiet.

### Language phrase

```text
Dzień dobry!
jen DOH-bry
Good morning!
                                    [speaker]
```

Polish uses 24/32 bold, phonetic 14/20 italic muted, English 15/22 medium secondary, with a 48 px speaker control.

### Quiz incorrect

The chosen wrong row uses error-soft, 2 px error border, close-circle and “Incorrect” announcement. The correct row simultaneously uses success-soft, success border, check-circle, and remains readable. “Next Question” stays the single primary CTA.

### Progress summary

```text
Level 4                         🔥 7 day streak
340 XP                         60 XP to level 5
[████████████████░░░░]
```

The hero presents existing values only. Red or XP purple is used once as the dominant accent; streak retains warm amber.

### AI Tutor quota

`[chat] 12/15 today · PRO` appears as a compact badge. AI level A1–B2 uses ChoiceChip/LevelBadge semantics. Tutor bubbles remain neutral; learner messages use brand primary. Guided fallback is labelled “Practice coach” with an information icon, not styled as an error.

### Paywall

Warm neutral background, editorial “Unlock Full Curriculum,” dynamic store price, concise one-time/lifetime wording, neutral benefit rows with red accents, one Primary purchase button, and a Tertiary Restore action. No gold, gradient, urgency timer, or entitlement shortcut.

## 27. Deferred product/UX issues

These are recorded but not solved or incorporated as silent behavior changes in the design system:

1. **Achievement correctness:** “Complete all 8 lessons” conflicts with the 61-lesson curriculum and unlock threshold.
2. **Home continuation logic:** Start Here always opens the first A1 lesson rather than resuming from progress.
3. **Privacy discoverability:** Privacy Policy exists but has no in-app navigation entry point.

Each requires a separate, narrow product/engineering decision. Phase 2 mockups must represent current behavior unless the corresponding issue is approved first.

## 28. Phase 2.3 Home design brief

### Objective

Create a visual mockup for the existing Home experience using this design system. Do not implement it and do not change what Home does.

### Current information that must be represented

- “Witaj! Welcome” and Polish with Me title;
- theme action;
- day streak;
- Start Here instruction and its current first-A1-lesson action;
- lessons done, total XP, lessons total, words total;
- overall completion percentage and count;
- grammar-note legend;
- A1, A2, B1, B2 curriculum sections;
- per-level progress;
- lesson title, word count, duration, grammar marker, completion, quiz score, and locked/Pro state;
- A1 free and A2/B1/B2 Pro behavior.

### Visual priority

1. **Primary:** the current Start Here learning action and curriculum.
2. **Secondary:** concise current progress—streak, XP, completion—without competing with the learning action.
3. **Tertiary:** totals, grammar legend, and detailed metadata.

This is hierarchy only. The deferred resume-logic issue must not be “fixed” in the mockup specification.

### Components to use

- AppScreen
- ScreenHeader with streak status and theme IconButton
- Feature AppCard for Start Here
- AppButton
- compact StatTile/ProgressBar summary
- section label/title
- LevelBadge and per-level ProgressBar
- LessonCard in available, completed, and locked/Pro states
- ProBadge and StatusBadge
- accessible accordion/expand control

### Visual direction

Use the warm editorial background and neutral cards. Reserve solid red for the Start Here primary action or one key active element. Let lesson titles and CEFR structure carry the lower screen. Reduce the feeling of four miniature dashboard boxes competing above the curriculum while still showing every existing value somewhere in the approved mockup.

### Responsive and accessibility constraints

- 16 px gutter on compact phones, 20 px standard.
- Summary metrics wrap to two columns or a compact row at small widths/large fonts.
- Lesson titles and descriptions wrap; no truncation of normal curriculum content.
- Accordion headers expose expanded state and retain a 48 px target.
- Locked/completed status uses text/icon plus colour.
- Theme and other icon-only actions have explicit labels.
- Progress bars expose percentage/count semantics.
- Bottom content clearance derives from the five-tab bar and safe area.
- Mock up at least light, dark, compact Android, and 200% font-scale states before implementation approval.

### Preservation boundary

Do not change navigation, lesson order, progress calculations, Start Here routing, entitlement logic, purchase flow, theme behavior, or curriculum. Phase 2.3 produces a visual mockup and review artifact only.

### Phase 2.2 verification

- Existing files modified: none.
- New file created: `docs/phase_2_2_design_system.md`.
- Dependencies installed: none.
- Configuration changed: none.
- Production code changed: none.
- RevenueCat/billing code changed: none.
- Learning/progress logic changed: none.
- All pre-existing Phase 1 and Phase 2.1 work remains preserved.
