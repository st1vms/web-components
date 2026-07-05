# Cursor Component

Custom cursor component for web pages.

## Setup

Add the cursor element and load the component script:

```html
<div id="cursor" aria-hidden="true"></div>
<script type="module" src="./cursor.js"></script>
```

## Usage

Initialize the cursor and keep the returned instance:

```js
import { initCursor } from "./cursor.js";

const cursor = initCursor({
  element: "#cursor"
});
```

### `cursor.enable()`

Enables the custom cursor behavior (starts tracking/moving the cursor element).

```js
cursor.enable();
```

### `cursor.disable()`

Disables the custom cursor behavior (stops tracking and restores default behavior based on implementation).

```js
cursor.disable();
```

## Minimal styling

```css
#cursor {
  position: fixed;
  top: 0;
  left: 0;
  pointer-events: none;
}
```

## Notes

- Keep `pointer-events: none` so the cursor element does not block clicks.
- Hide native cursor only if needed for your UX (`body { cursor: none; }`).
