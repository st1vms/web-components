

class Alert {

    /**
     * @callback AlertDismissCallback
     *
     * @param {'confirm' | 'cancel' | 'timer' | 'close'} reason A string representing the reason why this alert dismissed.
     * Can be either:
     * - `confirm`: User dismissed the alert by clicking the confirm button.
     * - `cancel`: User clicked the cancel button.
     * - `timer`: The alert auto closed itself due to timer expiration.
     * - `close`: User clicked on the close button.
     * - `backdrop`: User closed the modal by clicking the backdrop.
     * @returns {boolean | undefined} This callback can return true or false to consume the dismiss event and prevent the alert from closing.
    */

    /**
     * @typedef {Object} AlertShowParameters
     *
     * @property {string} [text=""] Text message to be displayed.
     * @property {boolean} [html=false] Wheter the `text` property shall be treated as text or html.
     * @property {string} [title=null] Title text to be displayed, leave `null` to disable the title.
     * @property {'success' | 'error' | 'warning' | 'info' | 'question'} [icon=null] The name of the icon to use, leave `null` to disable the icon.
     * Accepted values are: success, error, warning, info, question
     * @property {string} [confirmButton="OK"] Set the confirm button text (defaults to text `OK`),
     * set to `null` to disable the confirm button.
     * @property {string} [cancelButton=null] Set the cancel button text (defaults to `null`, no button),
     * set to `null` to disable the cancel button.
     * @property {boolean} [closeButtonEnabled=false] Enables the close button by setting this flag to true (default: false).
     * @property {boolean} [backdropCanClose=false] Set to true to enable closing the modal by clicking the backdrop (default is false).
     * @property {AlertDismissCallback} [onDismissCallback=null] Callback to be called once the alert is dismissed.
     * @property {number} [bgOpacity=0.2] Backdrop opacity (defaults to 0.2).
     * @property {number} [timer=null] Set a millisecond timer to auto close the alert after some time (defaults to null, no timer).
    */
    defaultDisplayConfig = {
        text: null,
        html: false,
        title: null,
        icon: null,
        confirmButton: "OK",
        cancelButton: null,
        closeButtonEnabled: false,
        backdropCanClose: false,
        onDismissCallback: null,
        bgOpacity: 0.2,
        timer: null,
    }

    constructor(defaultConfig = {}) {

        /* Override default configuration */
        this.defaultDisplayConfig = { ...this.defaultDisplayConfig, ...defaultConfig }

        /* Alert Element Reference */
        this.alertElement = null

        /* Abort Controller */
        this.dismissController = null
    }

    createElement(tag, elementConfig = {}) {

        elementConfig = {
            textContent: undefined, classList: [], attrs: {},
            ...elementConfig
        }

        const element = document.createElement(tag)

        /* Set Classes */
        for (const cls of elementConfig.classList) {
            element.classList.add(cls)
        }

        /* Set Attributes */
        for (const attrKey in elementConfig.attrs) {
            element.setAttribute(attrKey, elementConfig.attrs[attrKey])
        }

        /* Set textContent */
        if (elementConfig.textContent) {
            element.textContent = elementConfig.textContent
        } else if (elementConfig.innerHTML) {
            element.innerHTML = elementConfig.innerHTML
        }

        return element
    }

    createCardElement() {

        /* Alert Container/Backdrop */
        this.alertContainer = this.createElement("div", {
            classList: ["alert-container"]
        })

        /* Setup container background opacity */
        this.alertContainer.style.setProperty(
            "--alert-bg-opacity", this.config.bgOpacity
        )

        /* Alert Card  */
        const alertCard = this.createElement("div", {
            classList: ["alert-card"]
        })

        let alertIcon = null
        /* Alert Icon */
        switch (this.config.icon) {
            case "info":
                alertIcon = '<svg class="alert-icon info" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-info-icon lucide-info"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>'
                break
            case "success":
                alertIcon = '<svg class="alert-icon success" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="-3 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check-icon lucide-check"><path d="M20 6 9 17l-5-5"/></svg>'
                break
            case "warning":
                alertIcon = '<svg class="alert-icon warning" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-alert-icon lucide-circle-alert"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>'
                break
            case "error":
                alertIcon = '<svg class="alert-icon error" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path d="M55.1 73.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L147.2 256 9.9 393.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192.5 301.3 329.9 438.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.8 256 375.1 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192.5 210.7 55.1 73.4z"/></svg>'
                break
            case "question":
                alertIcon = '<svg class="alert-icon question" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-question-mark-icon lucide-circle-question-mark"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>'
                break
        }

        /* Alert Header */
        const alertHeader = this.createElement("div", {
            classList: ["alert-header"]
        })

        /* Alert Header - Title */
        const alertTitle = this.createElement("h1", {
            textContent: this.config.title ?? "",
            classList: ["alert-title"]
        })

        /* Build Header */
        if (this.config.icon && alertIcon != null) {
            /* Set the icon */
            alertHeader.insertAdjacentHTML('afterbegin', alertIcon)
        }
        alertHeader.append(alertTitle)

        /* Alert Message */
        let alertMessage = null
        if (this.config.html) {
            alertMessage = this.createElement("div", {
                innerHTML: this.config.text ?? "",
                classList: ["alert-message"]
            })
        } else {
            alertMessage = this.createElement("div", {
                textContent: this.config.text ?? "",
                classList: ["alert-message"]
            })
        }

        /* Alert Footer */
        const alertFooter = this.createElement("div", {
            classList: ["alert-footer"]
        })

        /* Alert Buttons */

        /* Confirm Button */
        if (this.config.confirmButton) {
            const confirmButton = this.createElement("button", {
                textContent: this.config.confirmButton,
                classList: ["btn-primary"]
            })

            /* Build Footer */
            alertFooter.append(confirmButton)

            confirmButton.addEventListener('click', (event) => {
                this.dismiss('confirm')
            })
        }

        if (this.config.cancelButton) {
            const cancelButton = this.createElement("button", {
                textContent: this.config.cancelButton,
                classList: ["btn-secondary"]
            })

            /* Build Footer */
            alertFooter.append(cancelButton)

            cancelButton.addEventListener('click', (event) => {
                this.dismiss('cancel')
            })
        }

        if (this.config.backdropCanClose) {
            /* Setup the alert container backdrop click listener */
            this.alertContainer.addEventListener('click', (event) => {
                if (event.target === event.currentTarget) {
                    this.dismiss('backdrop')
                }
            })
        }


        if (this.config.closeButtonEnabled) {
            /* Create and setup close button */
            const closeButton = this.createElement('i', {
                classList: ["fas", "fa-xmark", "alert-card-close-button"]
            })
            closeButton.addEventListener('click', (event) => {
                this.dismiss('close')
            })
            alertCard.append(closeButton)
        }


        /* Build Alert Card */
        alertCard.append(alertHeader, alertMessage, alertFooter)

        /* Wrap the card into the container */
        this.alertContainer.append(alertCard)
        return this.alertContainer
    }

    /**
     * Display an alert using the provided configuration
     * @param {AlertShowParameters} config
    */
    show(config = {}) {

        if (this.alertElement != null) {
            this.alertElement.remove();
            this.alertElement = null;
            // Abort any pending "transitionend" listeners from a previous dismissal
            this.dismissController?.abort();
        }

        this.config = { ...this.defaultDisplayConfig, ...config }

        /* Construct Alert Element */
        this.alertElement = this.createCardElement()

        if (typeof this.config.timer === 'number' && this.config.timer > 0) {

            const footer = this.alertElement.querySelector(".alert-footer")

            /* Set the alert timer style */
            this.alertElement.classList.add("timer-alert")

            /* Set Timer Duration */
            footer.style.setProperty("--timer-duration", `${this.config.timer}ms`)

            /* Start Auto Closing Timer */
            footer.addEventListener('animationend', (event) => {
                if (event.animationName === 'timerBarAnimation') {
                    this.dismiss('timer')
                }
            });
        }

        /* Append the Alert element ot the document body */
        document.body.append(this.alertElement)

        /* Schedule Alert Visibility Transition */
        this.alertElement.classList.add("visible")
        this.alertElement.querySelector('button')?.focus()
    }

    dismiss(reason) {

        if (this.alertElement == null) {
            /* Element is not present in the DOM */
            return
        }

        /* Run onDismiss callback */
        const result = this.config.onDismissCallback?.(reason)
        if (reason !== null && typeof result === 'boolean') {
            /* Callback returned a boolean, prevent this alert from closing */
            return
        }

        /* Setup AbortController for this specific dismissal */
        this.dismissController = new AbortController();

        /* Remove the alert from DOM after exit transition */
        this.alertElement?.addEventListener('transitionend', (event) => {
            this.alertElement?.remove()
            this.alertElement = null

            /* Attach listener with 'signal' to allow cancellation */
        }, { signal: this.dismissController.signal, once: true })

        /* Activate Exit Transition */
        this.alertElement?.classList.remove("visible")
    }
}

export { Alert }