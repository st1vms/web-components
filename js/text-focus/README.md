# Text Focus Search

ES6 Module: [focus.js](js/text-focus/focus.js)

This component allows you to manage a text focus box, which you can use to highlight any portion of text inside an element and automatically scroll to it. It also allows you to reposition the focus box onto a placeholder element, enabling a smooth transition between activating and deactivating the focus.

## Text Focus Usage

```js
const textFocus = new TextFocus({
    rootContainer: document.body,
    boxPaddingX: 8,
    boxPaddingY: 4,
})

textFocus.focus("text to focus", true) // scroll = true

/* To hide the focus element, call the 'unfocus()' method */
textFocus.unfocus()
```

The `focus(textString, scroll = true)` method accepts the text search query and a boolean value to toggle the auto-scroll feature (default: false). To limit the number of elements focused at the same time, set the `maxFocusCount` configuration variable, which defaults to 0 (no limit).

By using the `findTextNodes(textString)` method, you can retrieve the full list of search results:

```js
const results = textFocus.findTextNodes('text to find')
console.log(results)
/*[
    {
        node: <Node Object>,
        index: <Index where the query starts within this node's text>,
        query: <The search query>
    },
    ...
]*/
```

You can then focus a specific node using the `focusTextNode(nodeConfig, scroll = false)` method:

```js
// Focus the entire query string within this text node
textFocus.focusTextNode(results[0], false) // scroll = false
```

## Text Focus Configuration

Below is the default configuration:

```js
{
    rootContainer: null, // The root element from which to search for text
    maxFocusCount: 0, // Display only up to this number of search results at a time. (default 0: no limit)
    focusStartingElement: null, // If set, this element will be used to animate the focus box when it loses focus, moving and resizing it inside this element.
    // If not set, the focus box will disappear as soon as focus is lost.
    caseSensitive: false // Set to true to enable case-sensitive mode (default: false)
    boxPaddingX: 0, // Horizontal padding for the focus box in pixels.
    boxPaddingY: 0, // Vertical padding for the focus box in pixels.
    maxVisibleBoxes: 10, // Maximum amount of boxes to animate at once when returning to the starting element (default is 10).
    init: true, // If this parameter is set to true, the TextFocus object must be configured during the creation phase. If set to false, it must be initialized manually by calling the .init() method before it can be used. (default: true)
}
```

## Customizing Text Focus

To customize the focus box, override the .focus-highlight class in your stylesheet.
Below are the default variables used to style the focus box:

```css
.focus-highlight {
    --focus-box-background: transparent;
    --focus-box-border-width: 3px;
    --focus-box-border-style: dashed;
    --focus-box-border-color: dodgerblue;
    --focus-box-border-radius: 6px;
    --focus-box-zIndex: 9998;
    --focus-box-transition: transform 0.3s cubic-bezier(0.25, 1, 0.5, 1),
        width 0.3s cubic-bezier(0.25, 1, 0.5, 1),
        height 0.3s cubic-bezier(0.25, 1, 0.5, 1);
}
```
