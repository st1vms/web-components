/**
 * @typedef {Object} FileDragDropAreaConfig
 *
 * @property {string} [id=null] An optional `id` attribute for the `input[type="file"]`, it will also set the `name` attribute.
 *
 * @property {function(Array<Object>):void} [fileHandler=null] Callback accepting a NodeList of dropped files.
 *
 * @property {function(string, Object):void} [onFileImportError=null] Callback function to be invoked in case of file import errors.
 *
 * Receives a string tag indicating the reason for the error, which can be "FileCount" or "FileSize".
 * If the reason is "FileSize", the second parameter will contain the file object that generated the error; otherwise, it is undefined.
 *
 * @property {Array<string>} [mimeTypes=[]] List of allowed MIME type strings.
 *
 * @property {number} [maxFiles=0] File upload limit, (default to 0, no limit).
 * Leave empty to allow any file.
 *
 * @property {number} [maxFileSize=0] File upload max file size, (default to 0, no limit).
 *
 * @property {boolean} [showDroppedFiles=true] Enable/Disable the dropped-files-area to display the names of dropped files.
 *
 * @property {boolean} [dropEffect=true] Enable/Disable switching between `.drop-area-content` and `.drop-message` containers during file release.
*/

class FileDragDropArea {

    defaultConfig = {
        id: null,
        fileHandler: null,
        onFileImportError: null,
        mimeTypes: [],
        maxFiles: 0,
        maxFileSize: 0,
        showDroppedFiles: true,
        dropEffect: true
    }

    /**
     * @param {HTMLElement | string} dropAreaContainer The `.drop-area-container` HTMLElement,
     * you can also provide a CSS Selector pointing to it
     * @param {FileDragDropAreaConfig} [config={}] Configuration object
     */
    constructor(
        dropAreaContainer,
        config = {}) {

        if (dropAreaContainer instanceof HTMLElement) {
            this.dropAreaContainer = dropAreaContainer
        } else if (typeof dropAreaContainer === 'string') {
            this.dropAreaContainer = document.querySelector(dropAreaContainer) ?? (
                () => { throw new Error('Drop area container not found') }
            )()
        }

        this.dropArea = this.dropAreaContainer?.querySelector('.drop-area') ?? (
            () => { throw new Error('Drop area not found in this container') }
        )()

        this.config = { ...this.defaultConfig, ...config }

        this.dragCounter = 0
        this.isSelectingFile = false

        this.initDropContainer()
    }


    initDropContainer = () => {

        if (this.config.showDroppedFiles) {
            /* Create the dropped files area */
            this.droppedFilesArea = document.createElement('div')
            this.droppedFilesArea.classList.add('dropped-files-area')
            this.dropAreaContainer.append(this.droppedFilesArea)
        }

        /* Create the input element */
        this.fileInput = document.createElement("input")
        this.fileInput.hidden = true
        this.fileInput.type = "file"
        this.fileInput.multiple = this.config.maxFiles !== 1
        this.fileInput.setAttribute("id", this.config.id)
        this.fileInput.setAttribute("name", this.config.id)
        this.fileInput.setAttribute("value", "")
        this.fileInput.setAttribute('accept', this.config.mimeTypes.join(','))

        this.dropAreaContainer.append(this.fileInput)
    }

    toggleDropEffect(enabled) {
        if (this.config.dropEffect) {
            this.dropArea.classList.toggle('dropping', enabled);
        }
    }

    importFileSizeCheck(file) {
        if (this.config.maxFileSize <= 0) {
            return true
        }
        return file.size <= this.config.maxFileSize
    }

    onDragEnter = (event) => {
        event.preventDefault()
        event.stopPropagation()

        if (this.isSelectingFile) {
            /* Skip when file picker is open */
            return
        }

        /* Increment the count of selected elements */
        this.dragCounter++

        /* Activate dropping effect */
        this.toggleDropEffect(true)
    }

    onDragLeave = (event) => {
        event.preventDefault()
        event.stopPropagation()

        if (this.isSelectingFile) {
            /* Skip when file picker is open */
            return
        }

        /* Decrement the count of selected elements */
        this.dragCounter--

        /* Remove dropping effect if no element is selected */
        if (this.dragCounter === 0) {
            this.toggleDropEffect(false)
        }
    }

    onDragOver = (event) => {
        event.preventDefault()
        event.stopPropagation()

        /* Retrieve dropped files */
        const fileItems = [...event.dataTransfer.items].filter(
            (item) => item.kind === "file",
        )

        if (this.config.maxFiles > 0 && fileItems.length > this.config.maxFiles) {
            // Number of files exceeds limit
            return
        }

        if (event.currentTarget === this.dropArea) {
            /* This handler is attached to drop area */

            /* MIME type check */
            const file = fileItems[0]
            if (
                this.config.mimeTypes.length === 0 ||
                this.config.mimeTypes.findIndex((t) => t === file.type) !== -1
            ) {
                event.dataTransfer.dropEffect = "copy"
            } else {
                /* MIME type not allowed */
                event.dataTransfer.dropEffect = "none"
            }

        } else if (event.currentTarget === window) {
            /* This handler is attached to window object */
            if (!this.dropArea.contains(event.target)) {
                /* Discard drop event */
                event.dataTransfer.dropEffect = "none"
            }
        }
    }

    openFilePicker = (event) => {
        this.isSelectingFile = true
        this.fileInput.value = null // Reset the input file
        this.fileInput.click()
    }

    onFilePickerInputCancel = (event) => {
        /* Called when the user closes the file picker without choosing files */
        this.isSelectingFile = false
    }

    onFilePickerInput = (async (event) => {

        /* User picked files */
        this.isSelectingFile = false

        if (this.config.maxFiles > 0 && event.target.files.length > this.config.maxFiles) {
            // Number of files exceeds limit
            this.config.onFileImportError?.('FileCount')
            return
        }

        /* File size check */
        for (const file of event.target.files) {
            if (false === this.importFileSizeCheck(file)) {
                this.config.onFileImportError?.('FileSize', file)
                return
            }
        }

        if (this.droppedFilesArea != null) {
            /* Populate file attachament previews */
            this.createAttachmentsPreviews(event.target.files)
        }

        /* Submit files to external callback */
        await this.config.fileHandler?.(event.target.files)
    }).bind(this)


    handleFileDrop = async (event) => {
        event.preventDefault()
        event.stopPropagation()

        /* User is releasing drop, toggle drop effect off */
        this.toggleDropEffect(false)

        if (this.isSelectingFile) {
            /* File picker is open, skip drop */
            return
        }

        this.dragCounter = 0; // Reset

        const files = [...event.dataTransfer.items]
            .map((item) => item.getAsFile())
            .filter((file) => file);

        if (this.config.maxFiles > 0 && files.length > this.config.maxFiles) {
            // Number of files exceeds limit
            this.config.onFileImportError?.('FileCount')
            return
        }

        /* File size check */
        for (const file of files) {
            if (false === this.importFileSizeCheck(file)) {
                this.config.onFileImportError?.('FileSize', file)
                return
            }
        }

        if (this.droppedFilesArea != null) {
            /* Populate file attachament previews */
            this.createAttachmentsPreviews(files)
        }

        /* Submit files to external callback */
        await this.config.fileHandler?.(files)
    }


    onAttachmentRemove = (event, fileElement, file) => {

        /* User removed an attachment */
        const dataTransfer = new DataTransfer();
        for (const f of this.fileInput.files) {
            if (f === file) {
                continue
            }
            dataTransfer.items.add(f)
        }

        /* Remove file from input */
        this.fileInput.files = dataTransfer.files

        /* Remove file element from the container */
        fileElement.remove()
    }

    createAttachmentsPreviews(files) {

        /* Clear attachments preview elements if not null */
        this.droppedFilesArea.textContent = ""

        /* Create file attachments widgets */
        Array.from(files).forEach((file) => {

            const container = document.createElement('span')
            container.classList.add("dropped-file")

            /* Create an icon matching the file type */
            const icon = document.createElement("svg")
            container.append(icon)

            if (file.type === "application/pdf") {
                icon.outerHTML = `<svg class="pdf" width="800px" height="800px" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M2.5 6.5V6H2V6.5H2.5ZM6.5 6.5V6H6V6.5H6.5ZM6.5 10.5H6V11H6.5V10.5ZM13.5 3.5H14V3.29289L13.8536 3.14645L13.5 3.5ZM10.5 0.5L10.8536 0.146447L10.7071 0H10.5V0.5ZM2.5 7H3.5V6H2.5V7ZM3 11V8.5H2V11H3ZM3 8.5V6.5H2V8.5H3ZM3.5 8H2.5V9H3.5V8ZM4 7.5C4 7.77614 3.77614 8 3.5 8V9C4.32843 9 5 8.32843 5 7.5H4ZM3.5 7C3.77614 7 4 7.22386 4 7.5H5C5 6.67157 4.32843 6 3.5 6V7ZM6 6.5V10.5H7V6.5H6ZM6.5 11H7.5V10H6.5V11ZM9 9.5V7.5H8V9.5H9ZM7.5 6H6.5V7H7.5V6ZM9 7.5C9 6.67157 8.32843 6 7.5 6V7C7.77614 7 8 7.22386 8 7.5H9ZM7.5 11C8.32843 11 9 10.3284 9 9.5H8C8 9.77614 7.77614 10 7.5 10V11ZM10 6V11H11V6H10ZM10.5 7H13V6H10.5V7ZM10.5 9H12V8H10.5V9ZM2 5V1.5H1V5H2ZM13 3.5V5H14V3.5H13ZM2.5 1H10.5V0H2.5V1ZM10.1464 0.853553L13.1464 3.85355L13.8536 3.14645L10.8536 0.146447L10.1464 0.853553ZM2 1.5C2 1.22386 2.22386 1 2.5 1V0C1.67157 0 1 0.671573 1 1.5H2ZM1 12V13.5H2V12H1ZM2.5 15H12.5V14H2.5V15ZM14 13.5V12H13V13.5H14ZM12.5 15C13.3284 15 14 14.3284 14 13.5H13C13 13.7761 12.7761 14 12.5 14V15ZM1 13.5C1 14.3284 1.67157 15 2.5 15V14C2.22386 14 2 13.7761 2 13.5H1Z"/>
</svg>`
            } else if (file.type === "image/jpeg") {
                icon.outerHTML = `<svg class="jpg" xmlns="http://www.w3.org/2000/svg" width="800px" height="800px" viewBox="0 0 15 15" fill="none">
<path d="M6.5 6.5V6H6V6.5H6.5ZM10.5 10.5H10V11H10.5V10.5ZM12.5 10.5V11H13V10.5H12.5ZM13.5 3.5H14V3.29289L13.8536 3.14645L13.5 3.5ZM10.5 0.5L10.8536 0.146447L10.7071 0H10.5V0.5ZM4.5 6.5H5V6H4.5V6.5ZM4.5 10.5V11H5V10.5H4.5ZM2.5 10.5H2V11H2.5V10.5ZM6.5 7H7.5V6H6.5V7ZM7 11V8.5H6V11H7ZM7 8.5V6.5H6V8.5H7ZM7.5 8H6.5V9H7.5V8ZM8 7.5C8 7.77614 7.77614 8 7.5 8V9C8.32843 9 9 8.32843 9 7.5H8ZM7.5 7C7.77614 7 8 7.22386 8 7.5H9C9 6.67157 8.32843 6 7.5 6V7ZM10 6V10.5H11V6H10ZM10.5 11H12.5V10H10.5V11ZM13 10.5V8.5H12V10.5H13ZM10.5 7H13V6H10.5V7ZM2 5V1.5H1V5H2ZM13 3.5V5H14V3.5H13ZM2.5 1H10.5V0H2.5V1ZM10.1464 0.853553L13.1464 3.85355L13.8536 3.14645L10.8536 0.146447L10.1464 0.853553ZM2 1.5C2 1.22386 2.22386 1 2.5 1V0C1.67157 0 1 0.671573 1 1.5H2ZM1 12V13.5H2V12H1ZM2.5 15H12.5V14H2.5V15ZM14 13.5V12H13V13.5H14ZM12.5 15C13.3284 15 14 14.3284 14 13.5H13C13 13.7761 12.7761 14 12.5 14V15ZM1 13.5C1 14.3284 1.67157 15 2.5 15V14C2.22386 14 2 13.7761 2 13.5H1ZM2 7H4.5V6H2V7ZM4 6.5V10.5H5V6.5H4ZM4.5 10H2.5V11H4.5V10ZM3 10.5V9H2V10.5H3Z"/>
</svg>`
            } else {
                icon.outerHTML = `<svg class="unknown" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-question-mark-icon lucide-file-question-mark"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/><path d="M12 17h.01"/><path d="M9.1 9a3 3 0 0 1 5.82 1c0 2-3 3-3 3"/></svg>`
            }

            const fileNameText = document.createElement("span")
            fileNameText.textContent = file.name

            /* Create the remove button */
            const removeButton = document.createElement("i")
            removeButton.classList.add("fas", 'fa-xmark', 'delete-button')
            removeButton.addEventListener("click",
                (event) => this.onAttachmentRemove(event, container, file))

            container.append(fileNameText, removeButton)

            /* Add the attachment element to the drop area file list */
            this.droppedFilesArea.append(container)
        })
    }

    /**
     * Enable this area, allowing file loading
    */
    enable() {
        /* Reset internal variables */
        this.dragCounter = 0
        this.isSelectingFile = false

        /* Add Drag and Drop Area events */
        window.addEventListener('dragover', this.onDragOver)
        this.dropArea.addEventListener('dragover', this.onDragOver)
        this.dropArea.addEventListener('dragenter', this.onDragEnter)
        this.dropArea.addEventListener('dragleave', this.onDragLeave)
        this.dropArea.addEventListener('drop', this.handleFileDrop)

        /* Clicking on drop area opens the file picker */
        this.dropArea.addEventListener('click', this.openFilePicker)

        /* Add File picker events */
        this.fileInput.addEventListener('input', this.onFilePickerInput)
        this.fileInput.addEventListener("cancel", this.onFilePickerInputCancel)
    }

    /**
     * Disable this area, disallowing file loading
    */
    disable() {

        /* Remove event listeners */
        window.removeEventListener('dragover', this.onDragOver)
        this.dropArea.removeEventListener('dragover', this.onDragOver)
        this.dropArea.removeEventListener('dragenter', this.onDragEnter)
        this.dropArea.removeEventListener('dragleave', this.onDragLeave)
        this.dropArea.removeEventListener('drop', this.handleFileDrop)
        this.dropArea.removeEventListener('click', this.openFilePicker)
        this.fileInput.removeEventListener('input', this.onFilePickerInput)
        this.fileInput.removeEventListener("cancel", this.onFilePickerInputCancel)

        this.toggleDropEffect(false)
    }
}

export { FileDragDropArea }