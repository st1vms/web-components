import { Cursor } from "./cursor.js"

const cursorOne = new Cursor('#cursor1')
const cursorTwo = new Cursor("#cursor2")

const enableCursorButtonOne = document.getElementById('enable1')
const disableCursorButtonOne = document.getElementById('disable1')

const enableCursorButtonTwo = document.getElementById('enable2')
const disableCursorButtonTwo = document.getElementById('disable2')

enableCursorButtonOne.addEventListener("click", (event) => cursorOne.enable(event.clientX, event.clientY))
disableCursorButtonOne.addEventListener("click", () => cursorOne.disable())

enableCursorButtonTwo.addEventListener("click", (event) => cursorTwo.enable(event.offsetX, event.offsetY))
disableCursorButtonTwo.addEventListener("click", () => cursorTwo.disable())
