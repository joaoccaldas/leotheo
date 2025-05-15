# Lulu's Library - Interactive Web Book Creator

## 1. Overview

Lulu's Library is a web application that allows users to create, manage, and read their own digital books. It provides a personalized experience where users can set their name, customize the library's appearance, and craft books with multiple pages, including cover images and rich text content. The application saves all data to the browser's local storage, so creations persist between sessions. It features two distinct visual themes: "Normal" and a retro-inspired "Caldas" theme.

## 2. Files

The project consists of three main files:

* `index.html`: The main HTML file that defines the structure and layout of the web application.
* `styles.css`: The CSS file that provides custom styling, theme definitions, and visual enhancements.
* `script.js`: The JavaScript file that handles all the application's logic, interactivity, data management, and dynamic content updates.

### 2.1. `index.html`

**Purpose:** This file is the entry point of the application and defines the user interface elements.

**Contents:**

* **Metadata and Links:**
    * Standard HTML5 doctype, charset, and viewport settings.
    * Title: "Lulu's Library".
    * Links to external resources:
        * Tailwind CSS (CDN) for utility-first styling.
        * Google Fonts ("Inter" and "Press Start 2P").
        * `styles.css` for custom styles.
        * `script.js` (deferred) for application logic.
* **Body Structure:**
    * The main `<body>` tag uses Tailwind classes for basic layout and transitions.
    * **App Header (`#app-header`):**
        * Theme toggle button (`#theme-toggle-btn`) with an icon (`#theme-toggle-icon`) and text (`#theme-toggle-text`).
        * Username display area (`#username-display-container`) showing the current user's name (`#username-text`) and a "Change Name" button (`#change-username-btn`).
    * **Landing Page (`#landing-page`):**
        * **Username Prompt (`#username-prompt`):** Initial section to ask the user for their name, with an input field (`#username-input`) and a save button (`#save-username-btn`).
        * **Main Content (`#main-content`):** Hidden by default, shown after the username is entered.
            * Customizable welcome message (`#custom-welcome-message`) with an edit button (`#edit-custom-welcome-btn`).
            * Customizable page title/library name (`#page-main-title`) with an edit button (`#edit-page-title-btn`).
            * Personalized user greeting (`#welcome-user-message`).
            * Grid for displaying books (`#books-grid`).
            * Message for when no books exist (`#no-books-message`).
            * Floating action button to add new books (`#add-book-btn`).
    * **Book Creation Modal (`#book-creation-modal`):** A multi-step modal for creating or editing books.
        * **Step 1 (`#modal-step-1`):**
            * Input for book title (`#book-title-input`).
            * Input for the number of pages (`#num-pages-input`).
            * Cancel (`#cancel-creation-btn`) and Next (`#next-step-btn`) buttons.
        * **Step 2 (`#modal-step-2`):**
            * Label for the current page being edited (`#current-page-editor-label`).
            * Container for page content inputs (`#page-content-inputs`), which will dynamically include:
                * Cover image URL input (`#cover-image-url-input`) for the first page.
                * Textarea for page content.
            * Navigation for page editor: Previous (`#prev-page-editor-btn`), page indicator (`#page-editor-indicator`), Next (`#next-page-editor-btn`).
            * Back (`#back-to-step1-btn`) and Save Book (`#save-book-btn`) buttons.
    * **Book Reader Container (`#book-reader-container`):** A full-screen overlay for reading books.
        * **Book Reader (`#book-reader`):** The actual book display area.
            * Left page (`#left-page`) with content area and a turn-previous corner (`#turn-prev`).
            * Right page (`#right-page`) with content area and a turn-next corner (`#turn-next`).
        * Close book button (`#close-book-btn`).

**How it works:**
The HTML file uses Tailwind CSS classes extensively for styling and layout, making it responsive. IDs are assigned to elements to allow `script.js` to manipulate them and handle user interactions. The structure is divided into logical sections: header, landing/main content, modals, and the book reader.

### 2.2. `styles.css`

**Purpose:** This file defines custom styles, theming variables, and specific visual treatments that complement or override Tailwind CSS.

**Contents:**

* **CSS Variables (`:root`):**
    * Defines a set of variables for primary fonts, background colors, text colors, accent colors, border colors, etc., for the "Normal" theme.
* **Caldas Theme Variables (`body.caldas-mode`):**
    * Overrides the `:root` variables to provide a different color palette and font (Press Start 2P) for the "Caldas" theme. This includes changes to backgrounds, text, accents, and even specific UI elements like buttons and book covers.
* **Global Styles:**
    * Basic body styling (font, background, color, transitions).
    * Scrollbar styling.
* **Specific Element Styling:**
    * Styles for username display, custom welcome messages, page titles, and modal titles, including font family transitions based on the theme.
    * Utility classes that map to the CSS variables (e.g., `.bg-card`, `.text-text-primary`).
    * Modal overlay and reader overlay styles.
* **Book Reader Styles:**
    * `.book`: Defines the dimensions, perspective, and basic layout for the book reader.
    * `.page`: Styles for individual pages, including shadows, overflow, padding, transitions for width, opacity, and transform (for page flips).
        * `.half-width-page`: For displaying two pages side-by-side.
        * `.full-width-page`: For displaying a single page (like the cover) across the full book reader width.
        * `.hidden-page`: For hiding a page during transitions or in single-page views.
    * `.page-content`: Styling for the content area within a page.
    * `.cover-text-on-image-container`: Special styling for text displayed over a cover image, ensuring readability.
    * `.page.flipping`: Class added during page turn animations.
    * `.turn-corner`: Styles for the interactive page turn corners.
* **Book Cover Item Styles (`.book-cover-item`):**
    * Defines the appearance of book covers in the grid, including dimensions, hover effects (transform, shadow), background image handling, and a gradient overlay.
    * `.book-cover-title` and `.book-cover-author`: Styles for the text on the book covers, using theme-specific fonts and text shadows.
* **Book Transition Clone (`.book-transition-clone`):**
    * Styles for the element used in the "zoom" animation when a book is opened.
* **Page Content Input Styles:**
    * Styles for the textarea used for editing page content, ensuring it respects theme variables.
* **Action Button Styles (`.book-action-btn`):**
    * Styles for edit/delete buttons on book covers.

**How it works:**
`styles.css` uses CSS variables heavily to implement theming. When the `body` gets the class `caldas-mode`, the second set of variables takes precedence, changing the application's look and feel. It also includes specific styles for complex components like the book reader and book covers, handling animations and visual feedback.

### 2.3. `script.js`

**Purpose:** This file contains all the client-side JavaScript logic that makes the application interactive.

**Contents & Structure:**

1.  **DOM Element Selections:**
    * Constants are declared to hold references to various HTML elements using their IDs. This is done at the beginning for easy access throughout the script.

2.  **State Variables:**
    * `userName`: Stores the user's name.
    * `libraryTitle`: Stores the customizable title of the library (e.g., "Lulu's Library").
    * `customWelcomeMessage`: Stores the customizable welcome message.
    * `currentTheme`: Stores the active theme ('normal' or 'caldas').
    * `books`: An array to store all book objects created by the user. Each book object contains an `id`, `title`, `pages` (an array of page objects), and `coverColor`. Page objects have `content` and optionally `coverImageUrl`.
    * `currentBookToCreate`: A temporary object to hold data for the book currently being created or edited.
    * `currentPageEditorIndex`: Tracks the current page being edited in the book creation modal.
    * `editingBookId`: Stores the ID of the book being edited, or `null` if creating a new book.
    * `currentOpenBook`: Stores the book object currently being viewed in the reader.
    * `currentOpenBookPageIndex`: Tracks the current left-most page index in the book reader when in spread view.
    * `isCoverViewActive`: A boolean to indicate if the book reader is showing the cover in full-width mode.

3.  **Initialization (`DOMContentLoaded` event listener):**
    * Calls `loadState()` to retrieve data from local storage.
    * Calls `applyTheme()` to set the visual theme.
    * Calls `renderUI()` to update the display based on the loaded state.
    * Calls `attachEventListeners()` to set up event handling.

4.  **Local Storage Functions:**
    * `loadState()`: Reads data (username, library title, theme, books) from `localStorage` (key: `webBookAppData`) and populates the state variables.
    * `saveState()`: Saves the current state variables to `localStorage`.

5.  **Theme Management:**
    * `applyTheme()`: Adds/removes theme classes (`normal-mode`, `caldas-mode`) from the `body` element and updates the theme toggle button's appearance.
    * `toggleTheme()`: Switches between 'normal' and 'caldas' themes, then calls `applyTheme()` and `saveState()`.
    * `updateThemeToggleButton()`: Changes the icon and text of the theme toggle button.

6.  **UI Rendering Functions:**
    * `renderUI()`: The main function to update the UI. It checks if a username exists to show either the username prompt or the main content. It updates the HTML page title, library title display, custom welcome message, and personalized greetings. Calls `renderBooksGrid()`.
    * `renderBooksGrid()`: Clears and repopulates the `#books-grid` with book cover items. If no books exist, it shows `#no-books-message`. Each book cover displays its title, author (current user), and has edit/delete buttons. Cover backgrounds are either a user-provided image or a randomly generated color.
    * `getRandomColor()`: Generates a random light hex color, primarily for book covers if no image is set.

7.  **Event Listeners & Handlers:**
    * `attachEventListeners()`: Sets up all event listeners for buttons, inputs, and keyboard events.
    * `handleSaveUsername()`: Saves the entered username.
    * `handleChangeUsername()`: Prompts for and updates the username.
    * `handleChangeLibraryTitle()`: Prompts for and updates the library title.
    * `handleChangeCustomWelcomeMessage()`: Prompts for and updates the custom welcome message.
    * Event listeners for book creation modal buttons (next, back, save, cancel).
    * Event listeners for page editor navigation (previous/next page).
    * Event listeners for the book reader (close, turn page via corners or arrow keys, escape key).

8.  **Book Creation/Editing Modal Logic:**
    * `showBookCreationModal(bookIdToEdit = null)`: Opens the modal. If `bookIdToEdit` is provided, it populates the modal with the existing book's data for editing. Otherwise, it prepares for new book creation. Disables number of pages input when editing.
    * `hideBookCreationModal()`: Closes the modal and resets its state.
    * `handleModalNextStep()`: Validates title and page number, then moves from step 1 (title/pages) to step 2 (content editing) of the modal. Initializes `currentBookToCreate.pages` array.
    * `renderPageContentInputs()`: Dynamically creates and updates the input fields (textarea for content, URL input for cover image on page 1) in step 2 of the modal based on `currentPageEditorIndex`. Manages enabling/disabling of page navigation buttons.
    * `changeEditorPage(direction)`: Saves current page content and navigates to the previous/next page in the editor.
    * `handleModalBackToStep1()`: Saves current page content and returns to step 1 of the modal.
    * `handleSaveBook()`: Saves the content of the current page in the editor. Validates that the cover page has content or an image. If editing, updates the existing book in the `books` array. If creating, adds a new book object (with a unique ID and cover color) to the `books` array. Then, calls `saveState()`, `renderBooksGrid()`, and `hideBookCreationModal()`.

9.  **Book Action Handlers:**
    * `handleStartEditBook(bookId)`: Calls `showBookCreationModal` with the book's ID to initiate editing.
    * `handleDeleteBook(bookId)`: Confirms with the user and then removes the specified book from the `books` array, saves state, and re-renders the grid.

10. **Book Reader Logic:**
    * `openBook(book, coverElement)`: Initiates the book opening animation. It clones the clicked book cover, animates it to the center and full size of the book reader, then fades in the actual book reader UI.
    * `renderCurrentPages()`: Displays the content of the current pages in the book reader.
        * If `isCoverViewActive` is true, it shows the first page (cover) in a full-width view. It handles displaying the cover image as a background or showing text content.
        * If `isCoverViewActive` is false, it shows two pages side-by-side (spread view).
        * It updates page content using `convertMarkdownToHTML()`.
        * Manages the visibility of page turn buttons.
    * `convertMarkdownToHTML(mdText)`: A function to convert simple Markdown (bold `**text**` or `__text__`, italic `*text*` or `_text_`) and newlines into HTML (`<strong>`, `<em>`, `<p>`, `<br>`). It also attempts to preserve user-entered HTML tags like `<b>`, `<i>`, `<u>`, and `<span style="...">`.
    * `turnPage(amount)`: Handles page turning logic.
        * If in cover view and turning next, it transitions to spread view.
        * If in spread view and turning previous from the first spread, it transitions back to cover view.
        * Otherwise, it updates `currentOpenBookPageIndex` by `amount` (typically +2 for next spread, -2 for previous spread).
        * It includes a "flipping" animation for half-width pages.
        * Calls `renderCurrentPages()` to display the new set of pages.
    * `closeBook()`: Animates the book reader out and shows the main landing page again. Resets reader-related state variables.

**How it works:**
`script.js` is the engine of the application. It manages the application's state, responds to user interactions, manipulates the DOM to reflect state changes, and handles data persistence through local storage. It uses a combination of direct DOM manipulation and state-driven rendering to create a dynamic user experience.

## 3. Key Features

* **User Personalization:** Users can enter their name, which is used in greetings and as the author for created books.
* **Customizable Interface:** The main library title and the welcome message on the landing page can be edited by the user.
* **Dual Themes:** Switch between a "Normal" (light/professional) theme and a "Caldas" (dark/retro arcade) theme.
* **Book Creation:**
    * Define book title and number of pages.
    * Add content to each page using a rich text editor that supports Markdown (bold, italic) and basic HTML (bold, italic, underline, custom span styles for font size/color).
    * Set a cover image URL for the first page.
* **Book Management:**
    * View created books in a grid on the main page.
    * Edit existing books (title, page content, cover image).
    * Delete books (with a confirmation prompt).
* **Book Reader:**
    * Interactive book reading experience.
    * Starts with a cover view (full-width first page).
    * Transitions to a spread view (two pages side-by-side).
    * Page turning via clickable corners or keyboard arrow keys (Left/Right).
    * Close reader with a button or Escape key.
    * Smooth animations for opening books and turning pages.
* **Local Storage Persistence:** All user data (name, preferences, books) is saved in the browser's local storage, so it remains available across sessions.
* **Responsive Design:** The interface is built with Tailwind CSS, aiming for usability across different screen sizes.

## 4. How to Use

1.  **Open the Application:**
    * Simply open the `index.html` file in a modern web browser (e.g., Chrome, Firefox, Edge, Safari).
2.  **Enter Your Name:**
    * When you first open the app, you'll be prompted to enter your name. Type your name and click "Save Name."
3.  **Customize (Optional):**
    * Click the pencil icon (✏️) next to "Welcome to" to change the custom welcome message.
    * Click the pencil icon (✏️) next to the library title (default "Lulu's Library") to change it.
    * Click the "Theme" button in the top-left to toggle between "Normal" and "Caldas" themes.
4.  **Create a Book:**
    * Click the large "+" button in the bottom-right corner.
    * In the "Create New Book" modal:
        * Enter a "Book Title."
        * Enter the "Number of Pages" (including the cover).
        * Click "Next."
    * You are now in the page editor:
        * **Page 1 (Cover):**
            * Optionally, enter a "Cover Image URL."
            * Enter text content for the cover in the textarea. You can use Markdown (`**bold**`, `*italic*`) or simple HTML (`<b>`, `<i>`, `<u>`, `<span style="font-size: PX; color: #HEX;">text</span>`).
        * Use "Next Page" / "Previous Page" to navigate between pages and add content to each.
        * Click "Save Book" when finished.
5.  **View Books:**
    * Your created books will appear as covers on the main page.
6.  **Read a Book:**
    * Click on a book cover to open it in the reader.
    * The book opens to its cover. Click the bottom-right page corner or press the Right Arrow key to turn to the first spread.
    * Use the page corners or Left/Right Arrow keys to navigate.
    * Click the "×" button in the top-right or press the Escape key to close the book.
7.  **Edit a Book:**
    * Hover over a book cover on the main page.
    * Click the pencil icon (✏️) that appears.
    * The book creation modal will open with the book's data, allowing you to edit the title, cover image, and page content. Number of pages cannot be changed after creation.
    * Click "Save Changes."
8.  **Delete a Book:**
    * Hover over a book cover on the main page.
    * Click the trash can icon (🗑️) that appears.
    * Confirm the deletion.

## 5. Code Structure (`script.js` High-Level)

The `script.js` file is organized into several logical sections:

1.  **DOM Element Selections:** Cached references to frequently used HTML elements.
2.  **State Variables:** Global variables holding the application's data and current status.
3.  **Initialization:** Sets up the app on page load.
4.  **Local Storage Functions:** Handles saving and loading data.
5.  **Theme Management:** Logic for switching and applying themes.
6.  **UI Rendering Functions:** Functions responsible for updating what the user sees.
7.  **Event Listeners & Handlers:** Attaches functions to UI elements to respond to user actions.
8.  **Book Creation/Editing Modal Logic:** Manages the multi-step process of creating and editing books.
9.  **Book Action Handlers:** Functions for editing and deleting books from the grid.
10. **Book Reader Logic:** Controls the book reading interface, page turning, and content display.
11. **Markdown to HTML Conversion:** A utility to parse simple Markdown/HTML for page content.

This structure helps to organize the code, though further modularization could be beneficial for larger-scale maintenance.
