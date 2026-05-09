class CustomCursor {

    constructor(cursorElementSelector) {

        this.cursorElementSelector = cursorElementSelector
        this._cursorElement = null

        /* MouseMove Event position variables */
        this.clientX = 0
        this.clientY = 0

        this._frameRequestId = null
    }

    get cursorElement() {
        return (this._cursorElement ??= document.querySelector(this.cursorElementSelector)) ?? (() => {
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

        /* Show the custom cursor */
        document.body.classList.toggle("cursor-visible", true)
    }

    disable() {
        /* Cancel any pending animation frame */
        cancelAnimationFrame(this._frameRequestId)

        /* Remove cursor event listener */
        window.removeEventListener('mousemove', this._onMouseMove)

        /* Hide the custom cursor */
        document.body.classList.toggle("cursor-visible", false)
    }

}