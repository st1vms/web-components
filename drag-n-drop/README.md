
# File Drag-n-Drop

The `FileDragDropArea` component is used to set up a dedicated area for dragging files and loading them into a file input.
It allows you to:

- Replace the area content during drag operations;
- Display previews of uploaded files;
- Remove uploaded files;
- Filter files by MIME type and size;
- Limit the number of uploaded files;

## File Drag-n-Drop Example

Define the structure of the drag-n-drop area in your HTML file:

```html
<head>
    ...

    <!-- Style template -->
    <link rel="stylesheet" href="drag-drop.css">

    <style>
        .drop-area-container {
            position: fixed;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
        }
    </style>

    <!-- Main module that will import the component -->
    <script defer type="module" src="index.js"></script>

</head>
<body>

    ...

    <!-- Component container -->
    <div id="my-drop-container" class="drop-area-container">

        <!-- Drop Area -->
        <div class="drop-area dashed-border">

            <!-- Drop Area content in idle state -->
            <div class="drop-area-content">
                Drag here or click
            </div>

            <!-- Content to show on hover while dragging a file -->
            <!-- Can be omitted if the dropEffect parameter is set to false -->
            <div class="drop-message">
                Release to attach...
            </div>
        </div>
    </div>

    ...

</body>
```

Import the `FileDragDropArea` object into your `index.js` module, configure it, and enable it as follows:

```js
import { FileDragDropArea } from "./drag-drop.js";

const dragDropArea = new FileDragDropArea(
    '#my-drop-container',
    {
        id: 'Attachments', // Id and name for input[type="file"]
        fileHandler: async (files) => {
            console.log(files)
        },
        onFileImportError: (reason, fileObject) => {
            /* reason can be 'FileCount' or 'FileSize' */
            /* If reason is 'FileSize', fileObject contains the file exceeding the limit */
            console.log(reason, fileObject?.name)
        },
        /* Provide a list of MIME types to limit supported file types */
        mimeTypes: [
            "application/pdf",
            "image/jpeg",
        ],
        maxFiles: 3, // Maximum number of files uploaded at once
        // Maximum size limit for a single file
        maxFileSize: 1024 * 1000, // (1 MiB)
        showDroppedFiles: true, // Enable/Disable the display of dragged files.
        dropEffect: true /* Enable/Disable content switching on mouse hover while dragging a file. */
    }
)

/* Enable the area, file picker, and file drop. */
dragDropArea.enable()

/* Disable the area, block file picker, and file drop. */
/* dragDropArea.disable() */
```
