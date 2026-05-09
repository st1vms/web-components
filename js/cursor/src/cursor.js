/**
 * Represents a custom DOM cursor that follows mouse movement
 */
class Cursor {

    /**
     * Creates an instance of the Cursor.
     * @param {string} cursorElementSelector - The CSS selector for the cursor element.
    */
    constructor(cursorElementSelector) {
        this._cursorElementSelector = cursorElementSelector
        this._frameRequestId = null
        this._cursorElement = null

        /** @type {number} Latest registered MouseMove Event clientX */
        this.clientX = 0

        /** @type {number} Latest registered MouseMove Event clientY */
        this.clientY = 0
    }

    /**
     * Gets the cursor element from the DOM.
     * Caches the result after the first lookup.
     * @throws {Error} If the element is not found.
     * @returns {HTMLElement}
    */
    get cursorElement() {
        return (this._cursorElement ??= document.querySelector(this._cursorElementSelector)) ?? (() => {
            throw Error("No element with class 'cursor' found.")
        })()
    }

    _onMouseMove = (event) => {
        this.clientX = event.clientX
        this.clientY = event.clientY
    }

    _updatePosition = (x, y) => {
        /* Update transform3d to move the cursor */
        this.cursorElement.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }

    _requestCursorFrame = () => {
        /* Move cursor to the latest mousemove event position */
        this._updatePosition(this.clientX, this.clientY)

        /* Request the next animation frame */
        this._frameRequestId = requestAnimationFrame(this._requestCursorFrame);
    }

    /**
     * Initializes the cursor, attaches event listeners, and begins the animation loop.
     * @param {number} [startX=0] - Initial X position. (default: 0)
     * @param {number} [startY=0] - Initial Y position. (default: 0)
    */
    enable(startX, startY) {

        /* Initialize position variables */
        this.clientX = startX ?? 0
        this.clientY = startY ?? 0

        /* If a starting position was set, move to it immediately before showing the cursor */
        if (startX) {
            this._updatePosition(startX, startY)
        }

        /* Attach mousemove event listener */
        window.addEventListener('mousemove', this._onMouseMove)

        /* Request first animation frame */
        this._requestCursorFrame()

        /* Show the cursor */
        document.body.classList.toggle("cursor-visible", true)
    }

    /**
     * Stops the animation loop, removes event listeners, and hides the cursor.
    */
    disable() {
        /* Cancel any pending animation frame */
        cancelAnimationFrame(this._frameRequestId)

        /* Remove cursor event listener */
        window.removeEventListener('mousemove', this._onMouseMove)

        /* Hide the cursor */
        document.body.classList.toggle("cursor-visible", false)
    }

}

export { Cursor }