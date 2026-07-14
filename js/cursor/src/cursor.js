/**
 * Represents a custom DOM cursor that follows mouse movement
 */
class Cursor {

    /**
     * Creates an instance of the Cursor.
     * @param {string} cursorElementSelector - The CSS selector for the cursor element.
    */
    constructor(cursorElementSelector) {

        /* Retrieve cursor element */
        if (cursorElementSelector instanceof HTMLElement) {
            this.cursorElement = cursorElementSelector
        } else if (typeof cursorElementSelector === 'string') {
            this.cursorElement = document.querySelector(cursorElementSelector)
            if (!this.cursorElement) {
                throw Error("Cursor element not found!")
            }
        } else {
            throw Error("Must provide an HTML Element or a CSS selector.")
        }

        this._frameRequestId = null

        /** @type {number} Latest registered MouseMove Event clientX */
        this.clientX = 0

        /** @type {number} Latest registered MouseMove Event clientY */
        this.clientY = 0

    }

    _onMouseMove = ((event) => {
        // Ottieni i limiti del contenitore padre
        const rect = this.cursorElement.parentElement.getBoundingClientRect();

        // Calcola la posizione del mouse RELATIVA al padre, usando le coordinate globali
        this.clientX = event.clientX - rect.left;
        this.clientY = event.clientY - rect.top;

        console.log(this.cursorElement.id, this.clientX, this.clientY);
    }).bind(this)
    
    _updatePosition = ((x, y) => {
        /* Update transform3d to move the cursor */
        this.cursorElement.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }).bind(this)

    _requestCursorFrame = (() => {
        /* Move cursor to the latest mousemove event position */
        this._updatePosition(this.clientX, this.clientY)

        /* Request the next animation frame */
        this._frameRequestId = requestAnimationFrame(this._requestCursorFrame);
    }).bind(this)

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

        /* Remove cursor event listener */
        this.cursorElement.parentElement.removeEventListener('mousemove', this._onMouseMove)

        /* Attach mousemove event listener */
        this.cursorElement.parentElement.addEventListener('mousemove', this._onMouseMove)

        /* Request first animation frame */
        this._requestCursorFrame()

        /* Show the cursor */
        this.cursorElement.parentElement.classList.add("cursor-visible")
    }

    /**
     * Stops the animation loop, removes event listeners, and hides the cursor.
    */
    disable() {
        /* Cancel any pending animation frame */
        cancelAnimationFrame(this._frameRequestId)

        /* Remove cursor event listener */
        this.cursorElement.parentElement.removeEventListener('mousemove', this._onMouseMove)

        /* Hide the cursor */
        this.cursorElement.parentElement.classList.remove("cursor-visible")
    }

}

export { Cursor }