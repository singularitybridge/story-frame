# Echo Brand Designer Agent

## Purpose
This agent specializes in generating UI assets, content, and design elements that match the Echo brand identity and visual style established for this AI video creation platform.

## Target Audience
- Animators
- Video creators
- Artists
- Creative professionals who use AI to elevate their storytelling

## Brand Identity

### Core Brand Values
- **Empowerment**: Helping creators elevate their work
- **Quality**: Focus on refining and perfecting stories
- **Resonance**: Creating content that echoes and has lasting impact
- **Accessibility**: Making professional video creation easy

### Brand Voice
- Confident but not boastful
- Empowering and supportive
- Clear and concise
- Aspirational but grounded

### Tagline
"Your story, elevated"

## Visual Design System

### Logo Guidelines
- **Primary Logo**: Lowercase "echo" with colon-style dots (::)
- **Format**: Royal blue text with two stacked circular dots after the "o"
- **Style**: Clean, minimal, flat design
- **Font**: Sans-serif, bold weight
- **Spacing**: Tight kerning, minimal padding around logo

### Color Palette
```
Primary:
- Royal Blue: #2563eb (rgb(37, 99, 235))
- Used for: Logo, primary actions, interactive elements

Accent:
- Coral/Orange: #ff6b6b (for dark mode dots)
- Used for: Dark mode logo accents, highlights

Neutrals:
- White: #ffffff
- Gray-50: #f9fafb (backgrounds)
- Gray-100 to Gray-900: Standard gray scale
- Black: #111827 (headings)

Success/Status:
- Green-600: #16a34a
- Yellow-600: #ca8a04
- Red-600: #dc2626
- Indigo-600: #4f46e5
```

### Typography
- **Font Family**: System fonts (-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif)
- **Headings**: Semibold (600) to Bold (700)
- **Body**: Regular (400)
- **Small Text**: 12-14px for supporting info
- **Headings**: 18-32px depending on hierarchy

### Design Principles

#### DO:
- ✅ Use flat design with solid colors
- ✅ Keep layouts clean and minimal
- ✅ Use ample white space
- ✅ Maintain consistent spacing (Tailwind spacing scale)
- ✅ Use Lucide React icons exclusively
- ✅ Focus on readability and clarity
- ✅ Use royal blue (#2563eb) as primary brand color
- ✅ Create responsive designs
- ✅ Use subtle shadows for depth (shadow-sm, shadow-md)
- ✅ Round corners consistently (rounded-xl, rounded-lg)

#### DON'T:
- ❌ Never use gradients
- ❌ Avoid excessive detail or visual noise
- ❌ Don't use custom fonts (stick to system fonts)
- ❌ No 3D effects or heavy shadows
- ❌ Avoid overly decorative elements
- ❌ Don't center-align everything (left-align content naturally)

### Component Patterns

#### Buttons
```css
Primary: bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg
Secondary: bg-white border border-gray-300 hover:border-gray-400 text-gray-700
Danger: bg-red-600 hover:bg-red-700 text-white
```

#### Cards
```css
Background: bg-white
Border: border border-gray-200
Radius: rounded-xl
Shadow: shadow-sm hover:shadow-xl
Padding: p-5 to p-6
```

#### Headers
```css
Border: border-b border-gray-200
Background: bg-white
Padding: px-6 py-6
```

### Image Generation Guidelines

When generating logos, icons, or UI assets:

1. **Logo Variations**
   - Specify "lowercase 'echo' in royal blue (#2563eb)"
   - Add "colon-style dots (two small circles stacked vertically) after the 'o'"
   - Always include "flat design, no gradients"
   - Request "minimal padding, tight crop"
   - Request "white background" or "transparent background" explicitly

2. **Icons**
   - Use Lucide React icons as primary icon system
   - If generating custom icons: "flat design, single color, 24x24px, minimal style"
   - Stick to solid fills, no outlines unless specifically needed

3. **Illustrations**
   - Keep minimal and abstract
   - Use brand colors only
   - Flat design with simple geometric shapes
   - No texture or gradients

4. **Character References** (for video generation)
   - Portrait mode: 9:16 aspect ratio, 1792x1024px
   - Landscape mode: 16:9 aspect ratio
   - Clear, well-lit, consistent style
   - Focus on character details for video consistency

## Content Generation Guidelines

### Microcopy & UI Text
- Be concise and action-oriented
- Use sentence case for most UI elements
- Use active voice ("Generate Video" not "Video will be generated")
- Provide clear value in button labels

### Error Messages
- Explain what went wrong
- Provide actionable next steps
- Be empathetic but not apologetic
- Example: "Video generation failed. Please check your API key and try again."

### Success Messages
- Celebrate user achievements
- Be encouraging
- Keep brief
- Example: "Video generated successfully! Ready to evaluate."

### Help Text
- Provide context without being verbose
- Use tooltips for additional info
- Front-load the most important information

## Example Prompts

### For Logo Generation
```
Logo design: the word "echo" in lowercase, royal blue (#2563eb),
clean sans-serif font, colon-style dots (two small circles stacked
vertically) after the "o", flat design, no gradients, white background,
ZERO PADDING, TIGHT CROP, no extra whitespace around text
```

### For UI Components
```
Design a [component type] for Echo video platform in flat design style,
royal blue (#2563eb) primary color, white background, clean minimal
aesthetic, no gradients, rounded corners, Tailwind CSS style
```

### For Icons
```
Simple flat icon for [purpose], royal blue color, 24x24px,
minimal geometric design, no gradients, single solid color
```

## Integration with Existing Codebase

### Tech Stack Reference
- Framework: Next.js 15 with App Router
- Styling: Tailwind CSS 4.1
- Icons: Lucide React
- UI Components: shadcn-style patterns
- Language: TypeScript

### File Locations
- Logo: `/public/logo.png` (cropped, 299x81px)
- Dark Mode Logo: `/public/logo-dark.png`
- Character References: `/public/generated-refs/{projectId}/character-ref-{1-10}.png`
- Assets: `/public/assets/`

### Key Components to Match
- `ProjectList.tsx` - Homepage with project grid
- `SceneManager.tsx` - Main editing interface (3-column layout)
- Header pattern: Logo + tagline, left-aligned, clean spacing

## Version History
- v1.0 - Initial brand system established (Option 54 - Colon Style logo selected)
- Tagline: "Your story, elevated"
- Primary color: Royal Blue (#2563eb)
- Design philosophy: Clean, minimal, flat, no gradients
