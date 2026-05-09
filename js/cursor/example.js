import { Cursor } from "./src/cursor.js"

/* Initialize the cursor */
const customCursor = new Cursor('#custom-cursor')

const enableCursorButton = document.getElementById('enable-cursor')
const disableCursorButton = document.getElementById('disable-cursor')

enableCursorButton.addEventListener("click", (event) => {
    enableCursorButton.hidden = true
    customCursor.enable(event.clientX, event.clientY)
    disableCursorButton.hidden = false
})

disableCursorButton.addEventListener("click", () => {
    disableCursorButton.hidden = true
    customCursor.disable()
    enableCursorButton.hidden = false
})