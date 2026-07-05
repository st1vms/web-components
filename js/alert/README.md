# Alert

This component can be used to display customizable alert modals.
It allows you to modify the title, icon, message, buttons, and to set an auto-close timer.

## Alert Example

Include your module in the HTML and the styles from the template:

```html
...
<head>
    ...

    <!-- Alert styles -->
    <link rel="stylesheet" href="alert.css">

    <!-- Page module -->
    <script defer type="module" src="index.js"></script>
</head>
...
```

Import the `Alert` object into your module and call the `show` method.

```js
import { Alert } from 'alert.js'

/* Shows a success alert */
new Alert().show({
    icon: 'success', // error, warning, info, question
    title: 'Success',
    text: 'Operation completed successfully',
    timer: 10000, // 10 seconds
    onDismissCallback: (reason) => {
        /* This callback is called immediately before the alert closes, after calling dismiss() */
        switch(reason) {
            case 'confirm':
                console.log("The user clicked the confirm button")
                return
            case 'cancel':
                console.log("The user clicked the cancel button")
                return
            case 'timer':
                console.log("The alert closed due to the timer expiring")
                return
        }

        /* Returning a boolean from the callback will prevent the alert from closing */
        return true
    }
})
```

To force the modal to close, call the `dismiss` method by setting the `reason` parameter to `null`:

```js
//* Creates an alert with a different default configuration */
const timerAlert = new Alert({
    title: 'Timer Alert',
    icon: 'info',
    timer: 5000,
    onDismissCallback: (reason) => {
        if (reason === 'timer') {
            console.log("Timer expired")
            return
        }
        // Prevents the alert from closing
        return true
    }
})

/* Calls the show method */
timerAlert.show({
    text: 'This alert has a timer set for 30 seconds, but it will close after 5 seconds',
    timer: 30000
})

/* 5-second wait */
setTimeout(() => {
    // By setting reason to null, the result of onDismissCallback is ignored and the alert closes
    timerAlert.dismiss(null)
}, 5000)
```

### Alert Object Configuration

The `show` method receives an object with this default configuration:

```js
{
    text: null, // Message text
    title: null, // Title text
    icon: null, // Icon identifier (success, error, warning, info, question)
    confirmButton: "OK", // Enables the confirm button by setting its text
    cancelButton: null, // Enables the cancel button by setting its text
    onDismissCallback: null, // Callback to execute before the alert closes; can return a boolean to prevent the alert from closing.
    timer: null, // Sets a timer in milliseconds, after which the alert will close automatically.
    bgOpacity: 0.2, // Sets the opacity of the backdrop color.
}
```
