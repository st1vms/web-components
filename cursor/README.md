# Cursor Component

Custom cursor component for web pages.

## Setup

Add the cursor element and load the component script:

```html
<div class="cursor" id="my-cursor"></div>
<script type="module" src="./cursor.js"></script>
```

## Usage

Initialize the cursor and keep the returned instance:

```js
import { Cursor } from "./cursor.js";

const cursor = new Cursor("#my-cursor");
```

### `cursor.enable()`

Enables the custom cursor visibility (starts tracking/moving the cursor element).

```js
cursor.enable();

/* Or enable the cursor in a specific location (relative to container) */
// cursor.enable(200, 200);
```

### `cursor.disable()`

Disables the custom cursor visibility (stops tracking and restores default behavior based on implementation).

```js
cursor.disable();
```

## Minimal styling

```css
#cursor {
    --cursor-width: 1rem !important;
    --cursor-height: 1rem !important;
    background: dodgerblue;
    border-radius: 50%;
    box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
    z-index: 1;
}
```

### Note

- Hides native cursor (`body { cursor: none; }`) so the cursor element does not block clicks.
