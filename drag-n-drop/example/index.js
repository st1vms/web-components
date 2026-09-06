import { FileDragDropArea } from "../src/drag-drop.js";

// Initialize the file drag and drop component
const dragDropArea = new FileDragDropArea(
    '#my-drop-container',
    {
        id: 'Attachments', // Id and name for input[type="file"]
        fileHandler: async (files) => {
            console.log(files);
        },
        onFileImportError: (reason, fileObject) => {
            // Logs the error reason and the problematic file name
            console.error(reason, fileObject?.name);
        },
        mimeTypes: [
            "application/pdf",
            "image/jpeg",
        ],
        maxFiles: 3,
        maxFileSize: 1024 * 1000, // Limit size to 1 MiB
        showDroppedFiles: true,
        dropEffect: true
    }
);

// Enable the area, file picker, and file drop mechanism
dragDropArea.enable();