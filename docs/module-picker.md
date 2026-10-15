# Module picker presentation

The captured native configurator keeps ownership of module selection, compatible handles, shared-key settings, furniture meshes and price calculations. `public/original-configurator/module-picker.js` decorates the existing Vue nodes inside its ShadowRoot; `styles/module-picker.css` supplies the scoped card design. The captured bundle and original thumbnail pixels are unchanged.

The desktop overview now has named cards, five category filters, native selection checks, three handle cards and a separate shared-key switch. The full native module catalogue uses the same cards. Exact handle names distinguish the three handles from modules whose names include a handle. Accessories and legs are outside the decoration scope. English and Korean source labels are supported. Class changes from Vue update accessible selection and disabled states; Enter/Space use the original click handlers. The original mobile module accordion remains intact.

## Browser verification on 2026-10-15

- Desktop: category filters; native flap selection and application to a real furniture cell; handle compatibility; lock-handle application; shared-key toggle; full catalogue and back; Enter selection of a drawer. Furniture and price visibly update together.
- Mobile 390 × 844: module tab, cell selection, module accordion and drawer application; the displayed amount changes from 1,385,863 to 1,579,547 won. The temporary viewport override was reset.
- KRW conversion, date, rounding and checkout evidence are recorded separately in `krw-pricing.md`. Prices remain CHF internally.
- Full existing test suite: 52 passed. Production build passed. Browser screenshots: `qa/module-picker/desktop.jpg`, `qa/module-picker/mobile.jpg` and `qa/krw/order-total.jpg`.

This work was applied locally. Other in-progress work in the shared checkout is preserved; no commit or push was made for this UI and currency request.
