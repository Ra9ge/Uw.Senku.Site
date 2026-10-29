# @senku/brand

Фирменный стиль Senku в виде кода: цвета, радиусы, шрифты и логотип.

## CSS-переменные

```css
@import '@senku/brand/tokens.css';

.button {
  background: var(--senku-color-red);
  border-radius: var(--senku-radius-pill);
  font-family: var(--senku-font-display);
}
```

## В JavaScript

```ts
import { tokens, logoSvg, logoDataUrl, cssVariables } from '@senku/brand';

tokens.color.red;                              // '#F04A4A'
logoSvg({ size: 48 });                         // <svg …> красный знак
logoSvg({ size: 48, outline: true, color: '#fff' });
const img = `<img src="${logoDataUrl({ size: 32 })}">`;
document.head.insertAdjacentHTML('beforeend', `<style>${cssVariables()}</style>`);
```

## Токены

| Группа | Ключи |
|---|---|
| `color` | `red`, `redHover`, `background`, `surface`, `surface2`, `text`, `muted`, `green`, `gold` |
| `radius` | `sm`, `md`, `lg`, `xl`, `pill` |
| `font` | `display`, `body` |
| `motion` | `easeOut`, `spring` |

Все значения в [`tokens.json`](tokens.json), правила использования логотипа в [BRAND.md](../../BRAND.md). Логотип и название Senku защищены, см. [LICENSE](../../LICENSE).
