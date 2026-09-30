# MediBook Design References

These images define the visual direction for MediBook. They are inspiration for layout, spacing, hierarchy, responsive behavior, and interaction patterns—not assets to copy exactly.

## References

1. `01-home-web-reference.png` — home page and editorial healthcare layout. Source: [Dribbble](https://dribbble.com/shots/26511690-Modern-Medical-Service-Doctor-Website-Concept-UI-Design)
2. `02-doctors-mobile-reference.png` — doctor discovery and mobile healthcare presentation. Source: [Dribbble](https://dribbble.com/shots/26648119-Modern-Hospital-App-UI-Design)
3. `03-appointments-profile-reference.png` — mobile appointments, profile, notification, and schedule screens. Source: [Pinterest](https://in.pinterest.com/pin/nafa-medical-app-design--8303580557319612/)
4. `04-admin-dashboard-reference.png` — admin calendar, navigation, and appointment detail layout. Source: [Envato Elements](https://elements.envato.com/doctor-appointment-dashboard-ui-design-FBZ93RT)
5. `05-booking-slots-reference.png` — booking, availability, login, and responsive healthcare flows. Source: [Figma Community](https://www.figma.com/community/file/1383048311382098651/healthcare-appointment-booking-app-ui-kit)
6. `06-sign-in-reference.png` — spacious desktop healthcare login with an illustrated split layout. Source: [Pinterest](https://in.pinterest.com/pin/medical-login-page--570901690266081417/)
7. `07-sign-up-reference.png` — dedicated sign-up, sign-in, and onboarding screens for a healthcare app. Source: [Dribbble](https://dribbble.com/shots/26646257-Doctor-Appointment-App-Login-Signup-Page-UI-Design)
8. `08-loading-screen-reference.png` — a minimal loading state with clear branding and a centered progress indicator. Source: [Pinterest](https://in.pinterest.com/pin/1130685050230689898/)
9. `09-loading-pattern-reference.png` — a teal geometric loading treatment that can inspire MediBook's subtle medical-pattern background. Source: [Pinterest](https://in.pinterest.com/pin/100345897934568155/)
10. `10-admin-signup-reference.png` — a desktop admin signup form paired with a dashboard preview and strong split layout. Source: [Pinterest](https://in.pinterest.com/pin/689050811761519172/)
11. `11-admin-onboarding-reference.png` — a spacious multi-step admin registration flow with clear progress and profile setup. Source: [Pinterest](https://in.pinterest.com/pin/569494315391780674/)

## MediBook's own identity

Use teal `#0F766E`, off-white `#F8FAFC`, warm medical photography, generous spacing, and restrained mint/sky accents. The final product should feel calm and trustworthy, with one consistent visual language across patient and admin pages.

## Design rules

These rules are the source of truth whenever a MediBook page or component is designed.

### 1. Overall feel

- Calm, trustworthy, modern, welcoming, and premium.
- Keep the interface clean and spacious, but not empty or cold.
- Give MediBook its own identity; use the reference images for ideas only and never copy a screen exactly.
- Patient pages should feel friendly and reassuring. Admin pages may be denser, but must remain clear and polished.

### 2. Color system

- Primary teal: `#0F766E`.
- Primary hover: `#0D5F59`.
- Soft teal surface: `#CCFBF1`.
- Page background: `#F8FAFC`.
- Card background: `#FFFFFF`.
- Main text: `#0F172A`.
- Secondary text: `#64748B`.
- Borders: `#E2E8F0`.
- Focus ring: teal with strong visible contrast.
- Pending: amber.
- Confirmed: green.
- Cancelled: red.
- Completed: grey.
- Use gradients only as subtle accents. Never place gradients behind long text or large data tables.

### 3. Typography

- Use Inter throughout the product.
- Headings should be confident, compact, and easy to scan.
- Body text must remain simple and readable; avoid very light font weights.
- Use sentence case for headings, buttons, labels, and navigation.
- Keep a clear type hierarchy and do not use many unrelated text sizes on one page.

### 4. Spacing and layout

- Follow an `8px` spacing rhythm wherever practical.
- Use generous section spacing on marketing pages and tighter, consistent spacing inside dashboards.
- Keep main content within a centered maximum-width container on desktop.
- Forms should have comfortable field spacing and a clear primary action.
- Align cards, labels, buttons, and table columns precisely.
- Avoid overcrowding. Secondary actions should never compete visually with the primary action.

### 5. Shapes, borders, and shadows

- Cards and large containers: rounded corners around `16px`.
- Inputs, buttons, badges, and smaller controls: rounded corners around `10–12px`.
- Use soft one-pixel borders and restrained shadows.
- Avoid heavy black shadows, glassmorphism everywhere, and excessive decorative effects.

### 6. Components

- Build with shadcn/ui and Tailwind CSS.
- Use lucide-react icons with one consistent stroke weight.
- Buttons must have clear default, hover, focus, loading, and disabled states.
- Inputs must show labels, helpful validation messages, and visible keyboard focus.
- Cards must use a consistent title, metadata, content, and action structure.
- Status badges must always use the same colors and wording across patient and admin pages.
- Every data view needs loading, empty, and error states.

### 7. Authentication pages

- Sign-in and sign-up pages should use a focused form with a calm healthcare visual or illustration.
- Keep email, password, full name, and phone fields easy to scan and complete.
- Password visibility, forgot-password, and switching between sign-in/sign-up must be obvious.
- On desktop, a balanced split layout is preferred. On mobile, show the form first and simplify the decorative area.
- Do not let decorative imagery reduce form readability or accessibility.

### 8. Responsive behavior

- Design mobile first, then enhance for tablet and desktop.
- Important actions must remain reachable with one hand on small screens.
- Use a mobile menu instead of squeezing desktop navigation.
- Tables should become readable cards, scrollable tables, or simplified lists on narrow screens.
- No horizontal page overflow, clipped dialogs, tiny tap targets, or hidden primary actions.
- Test the main flows at phone and laptop sizes.

### 9. Imagery and visual details

- Prefer warm, professional, diverse doctor photography with clean backgrounds.
- Avoid frightening medical imagery, cluttered stock collages, and unrelated illustrations.
- Small medical or geometric motifs may add character, but they must never distract from tasks.
- Keep doctor photo crops, aspect ratios, and image treatment consistent.

### 10. Accessibility and usability

- Maintain readable color contrast and do not communicate status with color alone.
- All controls must work with a keyboard and show a visible focus state.
- Use clear labels, descriptive button text, meaningful alt text, and large touch targets.
- Error messages must explain what happened and how the user can fix it.
- Confirm destructive actions such as cancelling an appointment.

### 11. Motion

- Use short, subtle transitions for hover, dialogs, menus, toasts, and live updates.
- Motion should communicate state, not decorate the page unnecessarily.
- Respect reduced-motion preferences.

### 12. Loading states

- Keep full-page loading states calm and lightweight: MediBook mark, short reassuring text, and one subtle animated indicator.
- Prefer teal or soft off-white backgrounds and restrained geometric or medical motifs.
- Use skeletons for lists, tables, doctor cards, and dashboard content so the layout does not jump when data arrives.
- Never block the entire page for a small local update; show loading only around the affected control or section.

### 13. Admin provisioning

- Patient signup is public; admin accounts are provisioned by the project owner in Supabase.
- Never expose an admin role selector or role-assignment flow in the browser.
- Keep admin navigation and page context distinct, while retaining the same visual system.

### 14. Avoid

- Generic template appearance or copying a reference screen exactly.
- Too many colors, gradients, shadows, border styles, or card shapes.
- Tiny text, weak contrast, icon-only critical actions, and unexplained medical jargon.
- Inconsistent spacing, button styles, status colors, or navigation patterns.
- Showing raw technical or database errors to patients.
