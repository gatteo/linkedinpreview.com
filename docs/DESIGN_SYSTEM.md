# Design System

## Design Direction

Clean, modern SaaS aesthetic with generous whitespace, sharp typography, and subtle shadows. LinkedIn blue is the primary accent color. Light mode for all public-facing pages; full dark mode support in the dashboard. Component system built on shadcn/ui with Radix primitives.

### Reference Sites

- [Linear.app](https://linear.app) - clean navigation, minimal chrome, dark mode treatment
- [Vercel.com](https://vercel.com) - typography scale, whitespace, subtle gradients
- [Scripe.io](https://scripe.io) - dashboard layout, sidebar navigation, branding page patterns

## Color Palette

All colors use the oklch color space and are defined as CSS custom properties in `styles/globals.css`. Tailwind utilities reference these via `@theme`.

### Light Mode

| Name               | oklch Value               | CSS Variable         | Usage                                               |
| ------------------ | ------------------------- | -------------------- | --------------------------------------------------- |
| Background         | oklch(1 0 0)              | --background         | Page background                                     |
| Surface / Card     | oklch(1 0 0)              | --card               | Card backgrounds                                    |
| Primary            | oklch(0.546 0.13 242.3)   | --primary            | LinkedIn blue - buttons, links                      |
| Primary Foreground | oklch(0.985 0 0)          | --primary-foreground | Text on primary buttons                             |
| Secondary          | oklch(0.97 0 0)           | --secondary          | Secondary button backgrounds                        |
| Muted              | oklch(0.97 0 0)           | --muted              | Muted backgrounds                                   |
| Text               | oklch(0.145 0 0)          | --foreground         | Primary text                                        |
| Text Muted         | oklch(0.556 0 0)          | --muted-foreground   | Secondary / helper text                             |
| Border             | oklch(0.922 0 0)          | --border             | Borders and dividers                                |
| Destructive        | oklch(0.577 0.245 27.325) | --destructive        | Error states, delete actions                        |
| Accent             | oklch(0.97 0 0)           | --accent             | Hover backgrounds                                   |
| Sidebar Accent     | oklch(0.93 0 0)           | --sidebar-accent     | Sidebar hover / active states (bumped for contrast) |

### Dark Mode (`.dark` class - dashboard only)

| Name           | oklch Value              | CSS Variable       | Usage                                        |
| -------------- | ------------------------ | ------------------ | -------------------------------------------- |
| Background     | oklch(0.145 0 0)         | --background       | Page background                              |
| Primary        | oklch(0.654 0.154 241.7) | --primary          | Brighter LinkedIn blue for dark bg           |
| Text           | oklch(0.985 0 0)         | --foreground       | Primary text                                 |
| Text Muted     | oklch(0.708 0 0)         | --muted-foreground | Secondary text                               |
| Border         | oklch(1 0 0 / 10%)       | --border           | Semi-transparent white borders               |
| Sidebar Accent | oklch(0.3 0 0)           | --sidebar-accent   | Sidebar hover / active (bumped for contrast) |

Note: `ThemeProvider` (next-themes) is scoped to the dashboard layout only. The homepage and public pages are always light mode.

## Typography

Fonts are loaded via `next/font`: Inter (variable, sans-serif) and Cal Sans (display headings).

| Element    | Font Family        | Size                | Weight | Line Height |
| ---------- | ------------------ | ------------------- | ------ | ----------- |
| h1         | Cal Sans (display) | 2.25rem / text-4xl  | 700    | 1.1         |
| h2         | Cal Sans (display) | 1.875rem / text-3xl | 700    | 1.2         |
| h3         | Inter (sans)       | 1.5rem / text-2xl   | 600    | 1.3         |
| h4         | Inter (sans)       | 1.25rem / text-xl   | 600    | 1.4         |
| Body       | Inter (sans)       | 1rem / text-base    | 400    | 1.6         |
| Body Small | Inter (sans)       | 0.875rem / text-sm  | 400    | 1.5         |
| Caption    | Inter (sans)       | 0.75rem / text-xs   | 400    | 1.4         |
| Button     | Inter (sans)       | 0.875rem / text-sm  | 500    | 1.0         |

## Spacing & Layout

- **Base unit**: 4px (Tailwind default - all spacing in multiples of 4)
- **Container max-width**: 1200px (custom `.container` class in `globals.css` with 1.5rem padding)
- **Dashboard max-width**: 1500px inner wrapper for centering on large screens
- **Grid**: Flexbox-based layouts - no formal grid system

### Breakpoints

| Name    | Width          | Notes                            |
| ------- | -------------- | -------------------------------- |
| Mobile  | < 640px (sm)   | Single column, offcanvas sidebar |
| Tablet  | 640-768px (md) | Adapted layouts                  |
| Desktop | 768px+ (lg)    | Full sidebar, multi-column       |
| Wide    | 1280px+ (xl)   | Max-width constrained            |

## Components

All components are shadcn/ui primitives wrapping Radix UI, located in `components/ui/`. See CLAUDE.md for Tailwind v4 gotchas that affect several of these.

### Button

- **Description**: Primary interactive element for all user actions
- **Variants**: default (primary blue), secondary, outline, ghost, destructive, link
- **Sizes**: sm, default, lg, icon
- **States**: default, hover, active, disabled, loading (spinner)
- **Notes**: `cursor-pointer` is set globally. Icon-only buttons use `size="icon"` with an `aria-label`

### Card

- **Description**: Content container with optional header, content, and footer sections
- **Variants**: default (border + subtle shadow)
- **Sizes**: fluid by default - constrained by parent
- **States**: static (no interactive states by default)
- **Notes**: Compose with `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`

### Dialog

- **Description**: Modal overlay for confirmations, forms, and focused tasks
- **Variants**: default
- **Sizes**: controlled via `className` on `DialogContent`
- **States**: open, closed (animated)
- **Notes**: Radix-based. Always include `DialogTitle` and `DialogDescription` for accessibility

### Sidebar

- **Description**: Dashboard navigation sidebar with collapsible behavior
- **Variants**: inset (used in dashboard - creates boxed content layout)
- **Sizes**: expanded (240px default), collapsed rail, offcanvas (mobile)
- **States**: expanded, collapsed, mobile offcanvas
- **Notes**: `SidebarProvider` has hardcoded `min-h-svh` - override with `!min-h-0 h-full` for viewport-constrained layouts. Active state uses `data-[active=true]:` selectors (TW v4 requirement). Toggle with Cmd+B

### Input / Textarea

- **Description**: Text input fields for forms
- **Variants**: default
- **Sizes**: default
- **States**: default, focus (ring), disabled, error
- **Notes**: Always pair with a `Label` component. Use `Textarea` for multi-line content

### Select

- **Description**: Dropdown selection for constrained option sets
- **Variants**: default
- **Sizes**: default
- **States**: default, open, disabled
- **Notes**: Height override requires `data-[size=default]:h-9` - plain `h-9` loses to the component's conditional selector. Radix-based

### Switch

- **Description**: Binary toggle control for settings and preferences
- **Variants**: default
- **Sizes**: default
- **States**: checked, unchecked, disabled
- **Notes**: Uses `data-[state=checked]:` / `data-[state=unchecked]:` selectors. Radix sets `data-state`, not `data-checked`

### Tabs

- **Description**: Tabbed navigation for switching between related content sections
- **Variants**: default
- **Sizes**: fluid
- **States**: active, inactive, hover
- **Notes**: Used in editor panel (editor / preview / stats tabs)

### Table

- **Description**: Structured data display with sorting and filtering
- **Variants**: default
- **Sizes**: fluid
- **States**: default, row hover, loading (skeleton)
- **Notes**: Powered by `@tanstack/react-table`. Used for posts list on the dashboard

### Accordion

- **Description**: Collapsible content sections for progressive disclosure
- **Variants**: default
- **Sizes**: fluid
- **States**: open, closed (animated)
- **Notes**: Height animation uses CSS grid `grid-template-rows: 0fr / 1fr` with `transition-[grid-template-rows]` and `overflow-hidden` on the child for smooth collapse

### Toast (Sonner)

- **Description**: Non-blocking notification toasts for user feedback
- **Variants**: default, success, error, info
- **Sizes**: fixed
- **States**: visible, dismissed
- **Notes**: Sonner library - not shadcn toast. Call `toast.success()`, `toast.error()`, `toast.info()` directly. Configured once in the root layout

## Icons & Assets

- **Icon library**: Lucide React (primary), Tabler Icons (supplementary via `components/icon.tsx`)
- **Icon size default**: 16px (`size-4`) inline in buttons, 20px (`size-5`) standalone
- **Illustration style**: None - icons only
- **Image treatment**: `next/image` for all images. Remote patterns configured for `substack.com`

## Motion & Animation

- **Default transition**: 150ms ease (Tailwind default `transition-colors`)
- **Hover transitions**: color, background-color, border-color
- **Page transitions**: None - instant navigation
- **Loading patterns**: Skeleton screens for content loading, spinner for action buttons

### Custom Animations (defined in `styles/globals.css`)

| Name                              | Duration       | Usage                                  |
| --------------------------------- | -------------- | -------------------------------------- |
| `accordion-down` / `accordion-up` | 200ms ease-out | Accordion expand / collapse height     |
| `fade-up`                         | 500ms ease-out | opacity + translateY entrance          |
| `fade-in`                         | 300ms ease-in  | Simple opacity fade                    |
| `slide-in-right`                  | varies         | Horizontal slide with fade             |
| `bounce-down`                     | varies         | Gentle 3px bounce for arrow indicators |
| `shine`                           | 3s linear      | Gradient sweep for loading states      |
| `text-shimmer`                    | varies         | Animated text gradient effect          |
