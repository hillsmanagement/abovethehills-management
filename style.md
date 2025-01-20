

# Design Overview

## Colors
- **Background Color**:
  - Main background: `bg-gray-900`
  - Sidebar background: `bg-gray-900`
  - Card background: `bg-gray-800/40`
  - Hover background: `hover:bg-gray-800/60`, `hover:bg-gray-800/30`
 
- **Text Colors**:
  - Main text: `text-gray-100`
  - Sidebar text: `text-gray-400`
  - Active sidebar item: `text-white`
  - Button text: `text-white`
  - Disabled or secondary text: `text-gray-400`

- **Accent Colors**:
  - Primary accent: `bg-blue-600` for user messages
  - Secondary accent: `bg-gray-700` for assistant messages
  - Loading spinner: `border-orange-500`

## Button Styles
- **General Button Style**:
  - Rounded corners: `rounded-lg`
  - Padding: `px-4 py-2.5`
  - Transition effects: `transition-colors`
 
- **Hover Effects**:
  - Change background color on hover: `hover:bg-gray-800/30`, `hover:text-white`
 
- **Specific Buttons**:
  - Sign Out button: `text-gray-400 hover:bg-gray-800/30`
  - Exit button in whiteboard mode: `bg-gray-800 text-white rounded-lg hover:bg-gray-700`

## Fonts
- **Font Styles**:
  - Font weight: `font-semibold` for titles, `font-medium` for section headers, `text-sm` for smaller text.
  - Font size: Various sizes used, e.g., `text-xl` for main titles, `text-lg` for section headers.

## Loading Animation
- **Spinner**:
  - A circular spinner is used during loading states, styled with:
    - `animate-spin` for rotation
    - `rounded-full` for a circular shape
    - `border-t-2 border-b-2` for a two-tone effect
    - Color: `border-orange-500` for the top and bottom borders.

## Animation Effects
- **Motion Effects**:
  - Used `framer-motion` for smooth transitions and animations, such as:
    - Fade-in effects: `initial={{ opacity: 0 }}`, `animate={{ opacity: 1 }}`
    - Slide-in effects: `initial={{ x: -100, opacity: 0 }}`, `animate={{ x: 0, opacity: 1 }}`
    - Scale effects for whiteboard section: `initial={{ scale: 0.9, opacity: 0 }}`, `animate={{ scale: 1, opacity: 1 }}`

## Miscellaneous
- **Icons**:
  - Utilizes `react-icons` for various icons, enhancing the UI with visual elements.
- **Responsive Design**:
  - Media queries and responsive classes (e.g., `md:block`, `flex-1`) are used to ensure the layout adapts to different screen sizes.

