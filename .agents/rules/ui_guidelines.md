# UI & Asset Integration Rules (ui_Mau & Stitch)

## 1. Brand Asset Utilization
- Always prioritize brand assets located in `frontend/src/assert/` (e.g., `logo.png`, `anhnen.png`) for headers, hero emblems, and branding banners instead of generic placeholder icons or third-party links.
- Import assets directly using standard ES module imports (e.g., `import logoImg from '../assert/logo.png'`).

## 2. Single-Source Layout Coordination (Zero Redundancy)
- When converting full-page Stitch prototypes (such as `ui_Mau` or Stitch MCP templates) into React components, always verify the parent `AppLayout.tsx`.
- Never duplicate fixed bottom navigation bars (`<nav>`) or root layout shells within individual page components.
- Avoid duplicate bottom paddings (e.g., nesting `pb-20` inside an already padded layout).
- Eliminate unused legacy cards, dead imports, or overlapping wrapper tags that cause layout shifts or double scrollbars.

## 3. Core Functionality Preservation
- Redesigns must seamlessly incorporate necessary application-level controls—specifically the **Language Switcher (VN <-> EN)** and notification triggers—into the header without breaking the visual balance and padding of the Stitch template.

## 4. Component Micro-Interactions
- Preserve interactive states from Stitch prototypes: bookmark toggles, pulse animations, filter button micro-rotations, and active card scale effects.

## 5. Interactive SVG & Game Mechanics (Spin Wheel)
- Compute rotational trajectories using CSS transitions (`cubic-bezier(0.15, 0.9, 0.2, 1)`) and cumulative rotation angles (`currentRotation += extraSpins + (360 - targetAngle)`).
- Ensure top pointer indicators and center spin triggers are properly isolated with `z-index` and pointer-events so clicks are never intercepted by spinning SVG elements.
- When an item is finalized, provide a direct routing CTA ("Chốt & Tìm quán") leading straight to the map discovery view (`/map?search=...`).

## 6. Multi-Criteria Suggestion UI Patterns (Screen 3)
- Provide a visual step indicator (`Bước 3/4: Thiết lập khẩu vị` with 75% progress bar).
- Divide criteria into 4 distinct ergonomic chip groups: Meal Time, Dish Type, Budget Range, and Taste Profile.
- Active state styles:
  - Single-select categories use `bg-primary-container text-white shadow-[0_0_16px_rgba(255,107,53,0.45)]`.
  - Secondary/taste toggles use `bg-secondary-container text-on-secondary-container shadow-[0_0_14px_rgba(0,177,163,0.4)]`.
- Each recommendation card must present:
  - Top-left match score badge (`verified` icon + `XX% Hợp gu`).
  - Top-right rating badge (`star` icon + `★ X.X`).
  - Bottom-edge dual overlay: price pill + distance pill.
  - Action CTA: "Xem quán" button with direct search routing to `/map?search=...`.

## 7. Leaflet Map & Floating Glassmorphic Overlays (Screen 4)
- Map container layering:
  - The map container takes full viewport (`100dvh` minus header).
  - Overlaid control containers must use `pointer-events-none` on outer wrapper divs and `pointer-events-auto` on interactive pills, buttons, search bars, and drawer panels so map dragging and zooming remain unobstructed.
- Dark tile styling:
  - Apply `.dark-map-tiles` CSS filter (`invert(100%) hue-rotate(180deg) brightness(90%) contrast(90%)`) to standard OpenStreetMap raster tiles to blend seamlessly with `--surface: #111319`.
- Custom Animated Markers (`L.divIcon`):
  - User location: Pulsing teal radar ring (`animation: userPing 1.6s infinite`) with high-contrast label pill ("Bạn ở đây").
  - Restaurant pin: Dark glass pill with neon category glow (`#ff6b35` or `#4fdbcc`), bouncy elevation for selected/active pin.
  - Buddy pin: Purple avatar bubble with active beacon glow for nearby dining partners.
- Floating Active Restaurant Card & Drawer:
  - Quick preview card docked right above bottom navigation/drawer with rating, distance, image thumbnail, direct Google Maps navigation button, and buddy invite CTA.
  - Expandable bottom drawer featuring horizontal carousel of surrounding venues with instant card-click map panning.

## 8. Profile Creation & Onboarding UI Patterns (Screen 5)
- **Gamified Input Controls (Casino Nickname Generator)**:
  - Provide an inline dice action button (`casino`) within the nickname text field.
  - On click, cycle randomly through culturally resonant, playful Vietnamese foodie nicknames (e.g., "Chiến Thần Húp Phở", "Bé Mập Nghiện Trà Sữa", "Thích Ăn Cay Xé Lưỡi", "Tiên Tử Ốc Sài Gòn", "Trùm Săn Quán Lạ").
  - Include an interactive rotational/scale animation on click for tactile feedback.
- **Categorical Multi-Color Tag Selection**:
  - Food preference tags should follow contextual culinary color schemes:
    - **Flame Orange** (`bg-primary-container text-on-primary`): Spicy dishes, BBQ, hot soups.
    - **Tropical Teal** (`bg-secondary-container text-on-secondary-container`): Coffee, drinks, healthy.
    - **Warm Yellow** (`bg-tertiary-fixed text-on-tertiary-fixed`): Desserts, sweets, treats.
    - **Subtle Surface** (`bg-surface-container-high`): Unselected tags.
  - When active, show an inline remove/close icon and update a prominent live badge counter ("X đã chọn").
- **Gender Selection Cards**:
  - Render gender choices as a 3-column card grid with expressive emojis (👨 Nam, 👩 Nữ, 🌈 Khác).
  - Selected card must feature a glowing border gradient, elevated backdrop, and a floating top-right checkmark badge.
- **Contextual AI Teaser Snippets**:
  - Include an ambient encouragement card ("Food Match AI đã nhận diện: Đang có X bạn quanh bạn cùng thèm...") with a delicious dish preview photo to motivate completion.
- **State Hydration & Graceful Fallback**:
  - Automatically hydrate the form fields from `useUserStore.profile`.
  - Provide a secondary skip CTA ("Để sau, xem ứng dụng trước") directing users immediately to the map discovery view.

## 9. Real-Time Chat & Meetup Navigation UI Patterns (Screens 6, 7, 8)
- **Split Map & Chat Drawer Architecture (Screen 7)**:
  - Upper hero area: Dimmed, contrast-boosted ambient map glimpse featuring a centered pulsing radar marker (`soup_kitchen` / restaurant icon) with neon glow and distance pill.
  - Bottom chat deck: Layered with `rounded-t-xl bg-surface-container-low/95 backdrop-blur-2xl shadow-[0_-12px_44px_rgba(0,0,0,0.8)]` and drag handle indicator.
  - Agreed Meetup Banner ("Kèo Đã Chốt"): Prominently docked right below partner header to anchor the context of the conversation with meeting time, venue name, rating, and info modal trigger.
- **Chat Bubble Hierarchy & Typing Feedback**:
  - Sent messages: `bg-primary-container text-white shadow-[0_4px_16px_rgba(255,107,53,0.35)]` with bottom-right corner notch (`rounded-br-xs`) and delivered status (`done_all` in `text-secondary`).
  - Received messages: `bg-surface-container-high text-on-surface` with bottom-left corner notch (`rounded-bl-xs`) and partner avatar.
  - Typing indicator: Three bouncing dots with staggered animation delays (`[animation-delay:-0.3s]`, `[animation-delay:-0.15s]`) in `bg-secondary`.
- **Matching Map Toast (Screen 6)**:
  - Sticky glassmorphic card: Partner avatar with online green status dot, `notifications_active` pulse, "Yêu cầu ghép đôi mới!", requester name, distance, and craving.
  - Quick action buttons: "Đồng Ý Ăn Cùng" (`bolt` icon) and "Từ Chối".
- **In-App Direction Route Visualization (Screen 8)**:
  - Stylized dark vector street map with animated dash flow effect (`<animate attributeName="stroke-dashoffset">`).
  - Turn-by-turn guidance header card ("Sau 150m nữa", "Rẽ phải vào Nam Kỳ Khởi Nghĩa") with lane assist indicators.
  - Status panel with large ETA metric ("10 Phút • 350 m"), traffic indicator ("Đường thông thoáng"), and dual CTAs (In-App GPS navigation + Google Maps fallback).

## 10. Dedicated Sub-Screen Navigation Isolation
- **Conditional Bottom Tab Suppression**:
  - In applications featuring a floating bottom navigation bar, explicitly suppress `<nav>` on focused immersive sub-views (specifically `/chat/*`, `/route`).
  - This prevents double padding, keyboard collisions, and overlapping floating action buttons, allocating 100% of the mobile viewport to conversation and input field ergonomics.
- **Full-Bleed Chat Deck Layout**:
  - The chat view must follow a flex container structure (`flex flex-col min-h-screen`):
    - Sticky Header at top (`h-16 pt-safe`).
    - Ambient contextual preview card/map in the upper third (`h-44 flex-shrink-0`).
    - Chat message stream in the remaining height (`max-h-[380px] overflow-y-auto`).
    - Flush floating input bar anchored directly above safe-area bottom (`pb-5`).

