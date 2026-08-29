/**
 * @typedef {Object} TextFocusConfig
 *
 * @property {HTMLElement} rootContainer The root element to search text from
 * @property {number} [maxFocusCount=0] Display only up to this number of search results at once. (default is 0: no limit)
 * @property {HTMLElement} [focusStartingElement=null] If set, this element will be used to animate the focus box when it loses focus, moving and resizing it within this element.
 * If not set, the focus box will disappear as soon as focus is lost.
 * @property {boolean} [caseSensitive=false] Set to true to enable case sensitivity (default: false)
 * @property {number} [boxPaddingX=0] Horizontal padding for the focus box.
 * @property {number} [boxPaddingY=0] Vertical padding for the focus box.
 * @property {number} [maxVisibleBoxes=10] Maximum amount of boxes to animate at once when returning to the starting element (default is 10).
 * @property {boolean} [init=true] When set to true, this object is initialized upon creation.
 * If set to false, this object must be initialized using the .init() method before it can be used. (default: true)
*/


class TextFocus {

    defaultStyle = `\
:root {
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

:has(> .focus-highlight) {
    position: relative !important;
}

.focus-highlight {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    width: 0px;
    height: 0px;
    pointer-events: none;
    opacity: 0;
    background: var(--focus-box-background);
    border: var(--focus-box-border-width) var(--focus-box-border-style) var(--focus-box-border-color);
    z-index: var(--focus-box-zIndex);
    border-radius: var(--focus-box-border-radius);
    transition: var(--focus-box-transition);
    will-change: transform, width, height;
}

.focus-highlight.moving {
    position: fixed !important;
}`

    /** @type {TextFocusConfig} Default configuration object */
    defaultConfig = {
        rootContainer: null,
        maxFocusCount: 0,
        focusStartingElement: null,
        caseSensitive: false,
        boxPaddingX: 0,
        boxPaddingY: 0,
        maxVisibleBoxes: 10,
        init: true,
    }

    /**
     * @typedef {Object} NodeConfig
     * @property {HTMLElement} focusBox The focus box element
     * @property {Node} node The text node that has the focus
     * @property {number} index Starting index from which the text begins in the text node
     * @property {string} query Search query that triggered this focus
    */

    /**
     * @argument {TextFocusConfig} [config={}] Configuration Object
    */
    constructor(config = {}) {

        /* Apply configurations */
        this.config = { ...this.defaultConfig, ...config }

        this.currentNodes = []

        /* This method is used in UI events (scroll, resize, etc...) to recalculate box position */
        this.throttleScrollReposition = this._throttleFunctionWithTrailing(this.repositionCurrentFocus, 16)

        if (this.config.init) {
            this.init()
        }
    }

    /** Initializes this text focus instance,
    *  adds the focus element to the DOM, and configures event listeners. */
    init = () => {

        if (!(this.config.rootContainer instanceof HTMLElement)) {
            throw new Error("Undefined rootContainer", this.config.rootContainer)
        }

        /* Add Style element to the DOM */
        this.styleElement = document.createElement('style')
        this.styleElement.textContent = this.defaultStyle
        document.head.append(this.styleElement)

        /* Add focus box element to the page */
        /* this.focusElement = this._createFocusBoxElement()
        this.config.rootContainer.prepend(this.focusElement) */

        /* Configure event listeners */
        window.addEventListener('resize', this.throttleScrollReposition, true)
        window.addEventListener('scroll', this.throttleScrollReposition, true)
    }

    /** Deinitializes this text focus instance
     * Removes the focus element from the DOM and all its event listeners.
    */
    deinit = () => {
        /* Remove event listeners */
        window.removeEventListener('resize', this.throttleScrollReposition)
        window.removeEventListener('scroll', this.throttleScrollReposition)

        this.styleElement?.remove()

        /* Remove focus element */
        this.currentNodes.forEach((nodeConfig) => {
            nodeConfig.focusBox?.remove()
        })

        /* Clear current nodes */
        this.currentNodes = []
    }

    _throttleFunctionWithTrailing = (func, limit) => {
        let lastFunc;
        let lastRan;

        return function (...args) {
            const context = this;
            if (!lastRan) {
                func.apply(context, args);
                lastRan = Date.now();
            } else {
                clearTimeout(lastFunc);
                lastFunc = setTimeout(function () {
                    if ((Date.now() - lastRan) >= limit) {
                        func.apply(context, args);
                        lastRan = Date.now();
                    }
                }, limit - (Date.now() - lastRan));
            }
        }
    }

    _createFocusBoxElement = () => {
        const container = document.createElement('div')
        container.classList.add('focus-highlight')
        return container
    }

    addFocusBox = (node, index, textString) => {
        const focusElement = this._createFocusBoxElement()
        this.config.rootContainer.prepend(focusElement)
        const nodeConfig = {
            'focusBox': focusElement,
            'node': node,
            'index': index,
            'query': textString
        }
        this.currentNodes.push(nodeConfig)
        return nodeConfig
    }

    scrollToElement = (element) => {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });
    }

    getScrollParent = (node) => {
        const isElement = node instanceof HTMLElement;
        const overflowY = isElement && window.getComputedStyle(node).overflowY;
        const isScrollable = overflowY !== 'visible' && overflowY !== 'hidden';

        if (!node) {
            return null;
        } else if (isScrollable && node.scrollHeight >= node.clientHeight) {
            return node;
        }

        return this.getScrollParent(node.parentNode) || document.body;
    }

    /**
     * @param {string} textString The search query
     *
     * @return {Array<Object>} Returns an Array of search result objects. Each search result object has this structure:
     *
     * {
     *
     * `node`: [Node element],
     *
     * `index`: [Index from which the query starts in the Node text]
     *
     * }
    */
    findTextNodes = (textString) => {

        let results = []

        /* Create a tree walker */
        const treeWalker = document.createTreeWalker(
            this.config.rootContainer,
            NodeFilter.SHOW_TEXT, // Only consider node text
            (node) => {
                /* Get the parent element of the text node */
                const parentElement = node.parentElement;
                if (!parentElement) {
                    return NodeFilter.FILTER_SKIP
                }

                /* Check the parent's computed visibility */
                const style = window.getComputedStyle(parentElement);
                if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
                    return NodeFilter.FILTER_SKIP
                }

                // Check the parent's physical layout
                if (parentElement.offsetWidth === 0 || parentElement.offsetHeight === 0) {
                    return NodeFilter.FILTER_SKIP
                }

                /* Skip element if it is outside the root container boundaries, or has no dimensions */
                const rect = parentElement.getBoundingClientRect()
                if (
                    rect.bottom < this.config.rootContainer.top ||
                    rect.top > this.config.rootContainer.bottom ||
                    rect.right < this.config.rootContainer.left ||
                    rect.left > this.config.rootContainer.right ||
                    rect.height === 0 || rect.width === 0
                ) {
                    return NodeFilter.FILTER_SKIP
                }

                let matches = []
                const escapedText = textString.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
                if (this.config.caseSensitive) {
                    matches = [...node.textContent.matchAll(new RegExp(escapedText, 'gm'))];
                } else {
                    matches = [...node.textContent.matchAll(new RegExp(escapedText, 'gmi'))];
                }

                if (!matches.length) {
                    return NodeFilter.FILTER_SKIP
                }

                const indexes = matches.map((match) => match.index)

                /* Find text string inside this node *//*
                const index = this.config.caseSensitive ? // Check for case sensitivity toggle
                    node.textContent?.indexOf(textString) :
                    node.textContent?.toLowerCase().indexOf(textString.toLowerCase())
 */
                if (indexes.length > 0) {
                    const nodeData = indexes.map(index => {
                        return { 'node': node, 'index': index, 'query': textString }
                    })
                    results.push(...nodeData)
                    return NodeFilter.FILTER_ACCEPT
                }
                return NodeFilter.FILTER_SKIP
            }
        )

        /* Find all nodes and return results */
        while (treeWalker.nextNode()) {
            continue
        }
        return results
    }

    /** Focus a text node by placing an highlight box around it
     * @param {NodeConfig} nodeConfig The NodeConfig object element containing the focus box parameters
     * @param {boolean} [scroll=false] If set to true, automatically scroll to the focused element if not visible. (default: false)
    */
    focusTextNode = (nodeConfig, scroll = false) => {

        let { focusBox, node, index, query } = nodeConfig

        if (!node) { return }

        if (!focusBox) {
            focusBox = this.addFocusBox(node, index, query).focusBox
        }

        /* Perform scroll if requested */
        if (scroll) {
            this.scrollToElement(node.parentElement)
        }

        /* Define range area */
        const range = new Range()
        range.setStart(node, index)
        range.setEnd(node, index + query.length)

        /* Grab target viewport coordinates */
        const rect = range.getBoundingClientRect()

        /* Get container layout definitions */
        const containerRect = this.config.rootContainer.getBoundingClientRect()

        /* Calculate coordinates relative to the rootContainer */
        const relativeX = rect.left - containerRect.left + this.config.rootContainer.scrollLeft
        const relativeY = rect.top - containerRect.top + this.config.rootContainer.scrollTop

        this.moveFocusElement(focusBox, relativeX, relativeY, rect.width, rect.height)
    }

    moveFocusElement = (focusBox, x, y, width, height, opacity = 1) => {

        x = x - this.config.boxPaddingX
        y = y - this.config.boxPaddingY
        width = width + 2 * this.config.boxPaddingX + 1
        height = height + 2 * this.config.boxPaddingY + 1

        focusBox.style.opacity = `${opacity}`
        focusBox.style.width = `${width}px`
        focusBox.style.height = `${height}px`
        focusBox.style.transform = `translate3d(${x}px, ${y}px, 0px)`
    }

    repositionCurrentFocus = (event) => {
        event.stopPropagation()

        if (this.currentNodes.length == 0) {
            /* Skip as there is no highlighted node */
            return
        }

        /* Recalculate position of all the current highlighted text nodes */
        this.currentNodes.forEach((nodeConfig) => {
            this.focusTextNode(nodeConfig, false)
        })
    }

    _hideFocusElementOnTransitionEnd = (event) => {
        const focusBox = event.currentTarget
        focusBox.removeEventListener('transitionend', this._hideFocusElementOnTransitionEnd)
        if (focusBox && focusBox.parentNode) {
            focusBox.parentNode.removeChild(focusBox);
        }
    }

    disposeNode = (config, newNodes, nodeConfig, index) => {
        if (config.filter?.(nodeConfig) === true) {
            /* Node has been filtered */
            newNodes.push(nodeConfig)
            return
        }

        const { focusBox } = nodeConfig
        if (this.config.focusStartingElement == null) {
            /* No starting element found, let the focus box disappear instantly */
            if (focusBox.parentNode) {
                focusBox.parentNode.removeChild(focusBox);
            }
            return
        }

        const currentBoxRect = focusBox.getBoundingClientRect();

        // Temporarily disable transitions to prevent rendering an unintended leap
        const originalTransition = focusBox.style.transition;
        focusBox.style.transition = 'none';

        // Switch to fixed positioning and hardcode its current viewport position
        focusBox.classList.add('moving');
        focusBox.style.width = `${currentBoxRect.width}px`;
        focusBox.style.height = `${currentBoxRect.height}px`;
        focusBox.style.transform = `translate3d(${currentBoxRect.left}px, ${currentBoxRect.top}px, 0px)`;

        /* Force a DOM reflow so the browser logs this exact starting state */
        void focusBox.offsetHeight;

        /* Restore the original transitions smoothly */
        focusBox.style.transition = originalTransition;

        /* Get Search Bar absolute coordinates/dimensions */
        const rect = this.config.focusStartingElement.getBoundingClientRect()

        /* Hide the focus element once the transform transition ended */
        focusBox.removeEventListener('transitionend', this._hideFocusElementOnTransitionEnd)
        focusBox.addEventListener('transitionend', this._hideFocusElementOnTransitionEnd)

        /* Reduce the opacity of current nodes if they are too many */
        let opacity = 1
        if (this.config.maxVisibleBoxes > 0) {
            opacity = this.currentNodes.length > this.config.maxVisibleBoxes ?
                0 : 1 / (this.currentNodes.length || 1)
        }

        /* Resize and move the focus bar in the search bar */
        this.moveFocusElement(focusBox,
            rect.left, rect.top, rect.width, rect.height,
            opacity)
    }

    /** Hides focus highlight element */

    /**
     * @typedef {Object} UnfocusConfig
     * @property {function(NodeConfig):boolean} [filter=null] Filter function used to determine which focus boxes should be unfocused (removed).
    * Accepts a NodeConfig object and must return a Boolean value: returning false removes the focus box, while returning true ignores it.
    * @property {boolean} [resetFocus=false] Set to true this parameter to scroll to `focusStartingElement` once all elements have been removed. (default is false)
    */

    /**
     * @param {UnfocusConfig} [config={}]
    */
    unfocus = (config = {}) => {

        if (this.currentNodes.length == 0) {
            return
        }

        const newNodes = []

        this.currentNodes.forEach((nodeConfig, index) => this.disposeNode(config, newNodes, nodeConfig, index))

        if (config.resetScroll === true) {
            /* Scroll to the focus placeholder element */
            this.scrollToElement(this.config.focusStartingElement)
        }

        /* Clear current nodes */
        this.currentNodes = newNodes
    }

    /** Focus a text string by placing an highlight box around it
     * @param {string} textString The text string to search for the in the configured rootContainer
     * @param {boolean} [scroll=false] If set to true, automatically scroll to the focused element if not visible. (default: false)
    */
    focus = (textString, scroll = false) => {
        const results = this.findTextNodes(textString)
        if (results?.length == 0) {
            // Remove focus if no result was found
            this.unfocus()
            return false
        }

        for (let i = 0; i < results.length; i++) {

            if (this.config.maxFocusCount > 0 && i >= this.config.maxFocusCount) {
                /* Focus limit reached */
                break
            }

            const { node, index } = results[i]
            if (!node) {
                throw new Error("Error retrieving node from tree walker results", results)
            }

            const newNode = this.addFocusBox(node, index, textString)

            // Only scroll to the first element
            this.focusTextNode(newNode, i === 0 ? scroll : false)
        }

        return true
    }

}

export { TextFocus }