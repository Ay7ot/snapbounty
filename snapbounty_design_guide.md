# SnapBounty Design System Specification
## HackenProof-Inspired Micro Bounty Platform

---

## Brand

**Name:** SnapBounty (one word, no space between "Snap" and "Bounty")
**Logo Treatment:** "Snap" in accent green gradient, "Bounty" in primary text color

---

## Core Design Philosophy

**The Vibe:** Professional security-first aesthetic with web3 sophistication. Think "trusted hacker community meets enterprise security platform." Clean, functional, minimal yet confident. The design should feel like a specialized tool for professionals, not a consumer app.

---

## Color System

### Primary Palette

**Deep Background Tones**
- Primary Background: Very dark blue-gray, almost black but with subtle blue undertones (like `#0A0E27` or `#0D1117`)
- Secondary Background: Slightly lighter dark blue-gray for elevated surfaces (`#161B2E` or `#1A1F35`)
- Tertiary Background: Cards and containers should sit on a third level (`#1E2538` or `#242B3D`)

**Accent Colors - The "Security Green"**
- Primary Accent: Bright, electric cyan-green (`#00FFA3` or `#00E676`) - use sparingly for CTAs, success states, and key metrics
- This green should feel technical, like terminal text or security clearance indicators
- Use with subtle glow/shadow effects to make it feel "alive"

**Secondary Accents**
- Purple/Violet: Deep purple for secondary actions and highlights (`#7B3FF2` or `#8B5CF6`)
- Electric Blue: For informational elements and links (`#3B82F6` or `#2563EB`)
- Warning Orange: Amber/orange for moderate severity (`#F59E0B` or `#FB923C`)
- Critical Red: For high-priority items (`#EF4444` or `#DC2626`)

### Text Hierarchy

- **Primary Text:** Near-white with slight blue tint (`#E2E8F0` or `#F1F5F9`) - high contrast for readability
- **Secondary Text:** Muted gray-blue (`#94A3B8` or `#8B92A8`) - for descriptions, metadata
- **Tertiary/Disabled Text:** Very muted gray (`#64748B` or `#4B5563`) - barely visible but still readable

---

## Typography

### Font Families

**Headings:** Sora
- Modern geometric sans-serif with distinctive character
- Use for: Display text, H1-H3, section titles, stats
- Weight: 600-700 for headings
- CSS variable: `--font-heading` / `--font-sora`

**Body:** Inter  
- Clean, highly legible sans-serif
- Use for: Body text, UI elements, buttons, navigation
- Fallback: system-ui, -apple-system, sans-serif
- CSS variable: `--font-sans` / `--font-inter`

**Monospace:** JetBrains Mono
- Technical, developer-focused monospace
- Use for: Bounty IDs, wallet addresses, code snippets, timestamps, rewards
- CSS variable: `--font-mono` / `--font-jetbrains-mono`

### Scale & Weight

**Display/Hero Text:**
- Size: 2.5rem - 4rem (40-64px)
- Weight: 700-800 (Bold to ExtraBold)
- Letter spacing: -0.02em (slightly tightened)
- Line height: 1.1-1.2

**Headers (H1-H3):**
- H1: 2rem (32px), weight 700, -0.01em tracking
- H2: 1.5rem (24px), weight 600-700
- H3: 1.25rem (20px), weight 600

**Body Text:**
- Regular: 0.875rem - 1rem (14-16px), weight 400-500
- Line height: 1.6-1.7 for readability
- Small: 0.75rem - 0.825rem (12-14px), weight 400

**Labels/Tags:**
- Size: 0.75rem (12px), weight 500-600
- All caps with increased letter-spacing (0.05em)

---

## Spacing & Layout

### Spatial Rhythm

Use an 8px base unit system:
- Micro: 4px, 8px (tight spaces, icon padding)
- Small: 12px, 16px (component internal spacing)
- Medium: 24px, 32px (between sections)
- Large: 48px, 64px (major section breaks)
- XLarge: 96px, 128px (page-level spacing)

### Container Widths

- Max content width: 1280px - 1400px
- Comfortable reading width: 65-75 characters (40-45rem)
- Sidebar/Navigation: 240px - 280px (fixed or collapsible)

### Grid System

- Use 12 or 16 column grid
- Gutter: 24px minimum, 32px preferred
- Responsive breakpoints: 640px, 768px, 1024px, 1280px, 1536px

---

## Components & UI Elements

### Cards

**Structure:**
- Background: Tertiary background color
- Border: 1px solid with subtle border color (`#2E3447` or similar)
- Border radius: 8px - 12px (modern but not overly rounded)
- Padding: 20px - 24px internal spacing
- Hover state: Subtle lift (translate-y: -2px) + soft shadow
- Shadow: Multi-layer shadow for depth when elevated

**Shadow Recipe:**
```
box-shadow: 
  0 1px 3px 0 rgba(0, 0, 0, 0.4),
  0 4px 12px 0 rgba(0, 0, 0, 0.25);
```

### Buttons

**Primary (Call-to-Action):**
- Background: Gradient using accent green to slightly shifted hue
- Example: `linear-gradient(135deg, #00FFA3 0%, #00CC82 100%)`
- Text: Very dark background color for contrast
- Padding: 12px 24px (vertical horizontal)
- Border radius: 6px - 8px
- Font weight: 600
- Hover: Brighten by 10%, add subtle glow
- Active: Slight scale down (0.98)

**Secondary:**
- Background: Transparent
- Border: 1.5px solid accent color
- Text: Accent color
- Hover: Fill with 10% opacity of accent color

**Ghost/Tertiary:**
- Background: Subtle gray/transparent
- Text: Secondary text color
- Hover: Background to 5% white opacity

### Tags/Badges

**Style:**
- Small, pill-shaped (border-radius: 9999px or 16px)
- Padding: 4px 10px
- Font size: 11px - 12px, weight 600
- Background: Semi-transparent color based on severity/type
- Border: Optional 1px border matching background

**Status Colors:**
- Open/Active: Green accent with 15% opacity background
- In Progress: Blue with 15% opacity
- Completed: Purple with 15% opacity
- Closed/Expired: Gray with 15% opacity

### Input Fields

**Design:**
- Background: Slightly lighter than container background
- Border: 1px solid subtle color (`#2E3447`)
- Border radius: 6px - 8px
- Padding: 10px 14px
- Focus state: Border color to accent (green/blue), subtle glow
- Placeholder: Tertiary text color

---

## Visual Effects & Motion

### Shadows & Depth

**Three-Tier System:**
1. **Low elevation:** Subtle shadow for cards at rest
   ```
   0 1px 2px rgba(0, 0, 0, 0.3)
   ```

2. **Medium elevation:** Hover states, modals
   ```
   0 4px 12px rgba(0, 0, 0, 0.4),
   0 2px 4px rgba(0, 0, 0, 0.3)
   ```

3. **High elevation:** Tooltips, dropdowns, important overlays
   ```
   0 10px 25px rgba(0, 0, 0, 0.5),
   0 4px 10px rgba(0, 0, 0, 0.4)
   ```

### Glows & Highlights

**For Accent Elements:**
- Use box-shadow with the accent color at very low opacity
- Example for green accent: `0 0 20px rgba(0, 255, 163, 0.15)`
- Apply to: Primary buttons, success indicators, active states
- Avoid overuse - should feel special and intentional

### Animations & Transitions

**Duration Standards:**
- Micro interactions: 150ms - 200ms
- Standard transitions: 250ms - 300ms
- Complex animations: 400ms - 500ms
- Never exceed 600ms for UI feedback

**Easing:**
- Default: `cubic-bezier(0.4, 0.0, 0.2, 1)` - ease-in-out
- Enter: `cubic-bezier(0.0, 0.0, 0.2, 1)` - deceleration
- Exit: `cubic-bezier(0.4, 0.0, 1, 1)` - acceleration

**Common Transitions:**
- Hover states: Transform + opacity
- Page transitions: Fade + slight slide
- Loading states: Subtle pulse or skeleton screens
- Success/completion: Scale up briefly, then settle

---

## Iconography

### Style

- **Line-based icons** preferred over filled (feels more technical)
- Stroke width: 1.5px - 2px
- Size scale: 16px, 20px, 24px, 32px, 48px
- Color: Match text color hierarchy
- Hover: Shift to accent color with transition

### Icon Libraries

Recommended: Lucide, Heroicons, Phosphor Icons, Feather Icons

### Usage

- Always pair with text for clarity (icon-only for common actions)
- Use consistently - same icon means same action everywhere
- Maintain optical balance - some icons need visual weight adjustment

---

## Data Visualization

### Charts & Graphs

**Color Usage:**
- Primary data: Accent green gradient
- Secondary data: Purple or blue
- Negative/loss: Red
- Background: Subtle grid lines in very muted color (`#1E2538`)

**Style:**
- Smooth, modern curves for line charts
- Subtle gradients for area fills
- Clean, minimal axes
- Clear, readable labels (secondary text color)

---

## Borders & Dividers

### Philosophy

Use borders sparingly - rely more on spacing and subtle background changes

**When to Use:**
- Around inputs (always)
- Around cards (optional, can use shadow instead)
- Between distinct sections (1px, very subtle color)
- Never heavy or prominent borders

**Border Colors:**
- Default: `#2E3447` or similar (barely visible)
- Hover/focus: Accent color
- Active/selected: Full accent color

---

## Responsive Behavior

### Mobile Adaptations

- Reduce spacing proportionally (75% of desktop)
- Simplify navigation to hamburger/bottom tabs
- Stack cards vertically
- Make touch targets minimum 44px
- Reduce text sizes slightly but maintain hierarchy
- Hide secondary information, show on expand

### Breakpoint Behavior

**Mobile (< 768px):**
- Single column layouts
- Collapsible sections
- Bottom sheet modals instead of centered

**Tablet (768px - 1024px):**
- 2-column grids where appropriate
- Sidebar can be toggle-able
- Maintain most desktop features

**Desktop (> 1024px):**
- Multi-column layouts
- Fixed sidebar navigation
- Hover states and tooltips
- More information density

---

## Micro-interactions

### Loading States

- **Skeleton screens** for content loading (animated gradient sweep)
- **Spinner** for quick actions (use accent color)
- **Progress bars** for multi-step processes (gradient, rounded caps)

### Empty States

- Illustration or large icon (muted color)
- Clear, friendly message
- Actionable CTA if applicable
- Keep it light, not too heavy on "no data" feeling

### Success/Error Feedback

- **Success:** Brief green flash + checkmark animation
- **Error:** Red highlight + shake animation (subtle)
- **Info:** Blue accent + slide-in notification
- Toast notifications: Bottom-right, auto-dismiss in 3-5s

---

## Accessibility Considerations

### Contrast Ratios

- All text must meet WCAG AA standards (4.5:1 minimum)
- Important elements meet AAA (7:1)
- Test accent colors against dark backgrounds

### Focus Indicators

- Always visible for keyboard navigation
- Use accent color with 2px outline
- Never rely on color alone for meaning

### Motion Preferences

- Respect `prefers-reduced-motion`
- Provide static alternatives for animations
- Keep essential animations very subtle

---

## Special Elements for Bounty Platform

### Bounty Cards

**Structure:**
- Grid layout (4 columns on desktop, 2 on tablet, 1 on mobile)
- Left side: Company/project icon in bg-elevated container (40x40px)
- Header: Company name (text-xs, text-tertiary) + Bounty title (font-medium, line-clamp-1)
- Footer: Difficulty badge (left) + Reward amount (right, text-xl, font-bold, accent-green)
- Optional: Featured badge in top-right corner

**Visual Priority:**
1. Reward amount (largest, brightest - accent green)
2. Title (font-medium, primary text)
3. Difficulty badge
4. Company name (smallest, tertiary text)

**Hover State:**
- Subtle lift (translateY: -2px)
- Border transition to accent-green/50
- Shadow elevation increase

### Task Status Indicators

**Use color + icon + text:**
- Available: Green dot + "Open"
- In Progress: Blue pulse + "Active"
- Review: Orange + "Pending"
- Completed: Purple + "Done"
- Expired: Gray + "Closed"

### Leaderboard/Rankings

- Use subtle background highlights for top positions
- Rank badges with metallic gradients (gold, silver, bronze)
- User avatars with border color matching their tier
- Clean typography for names and scores

---

## Landing Page Structure

The landing page follows HackenProof's pattern with SnapBounty's personality:

1. **Hero Section** (2-column on desktop)
   - Left: Badge (live status), Heading, Description, CTAs, Trust indicators
   - Right: Staggered stat cards with prominent numbers

2. **Featured Bounties** (Star icon + heading)
   - 4-column grid of bounty cards
   - "View all" link in header

3. **How It Works** (4 steps)
   - Large step numbers (01-04)
   - Connection lines between steps on desktop
   - Simple title + description

4. **Categories** (5-column grid)
   - Icon + name + count
   - Colored icons matching category theme

5. **Features/Why SnapBounty** (4-column grid)
   - Icon in accent container
   - Title + description

6. **Stats Banner** (4-column, gradient background)
   - Icons + large numbers + labels

7. **CTA Section**
   - Gradient card with glow effect
   - Primary + ghost buttons

---

## Final Notes

### The "Feel" We're Chasing:

- **Professional but not corporate** - feels like a tool built by developers for developers
- **Security-minded** - confidence, trust, no-nonsense
- **Web3 native** - modern, slightly futuristic without being gimmicky
- **High signal, low noise** - every element earns its place
- **Dark but not oppressive** - the darkness should feel intentional, not just trendy

### Things to Avoid:

- Overly rounded corners (don't go full bubble UI)
- Too many gradients (use strategically)
- Bright backgrounds (maintain the dark theme integrity)
- Cluttered layouts (favor whitespace)
- Inconsistent spacing (stick to the 8px grid)
- Over-animation (subtle is better)
- Spelling "SnapBounty" as two words

### Implementation Priority:

1. Get colors and backgrounds right first
2. Establish typography hierarchy (Sora for headings, Inter for body)
3. Build out component library
4. Add shadows and depth
5. Layer in animations last

This spec should give your engineer everything they need to create a cohesive, professional interface that captures the HackenProof aesthetic for SnapBounty. The key is consistency - once you establish these patterns, stick to them religiously throughout the app.