// Lulu's Library - ui.js (Rewritten with Corrections and Improvements)
// -----------------------------------------------------------------------------
//  This file defines window.ui and all rendering helpers used by script.js.
//  Functionality from the original helper set has been preserved and refined.
//  Includes fix for modal DOM state issues on reuse.
// -----------------------------------------------------------------------------

(function (window) {
  "use strict";

  /* ------------------------------------------------------------------
   * Bootstrap & utilities
   * ------------------------------------------------------------------ */
  const ui = (window.ui = {}); // Expose UI object immediately

  /**
   * Gets a DOM element by its ID.
   * Logs a warning if the element is not found.
   * @param {string} id - The ID of the element.
   * @returns {HTMLElement|null} The found element or null.
   */
  function getElement(id) {
    const el = document.getElementById(id);
    if (!el) console.warn(`UI_WARN: Element with ID '${id}' not found.`);
    return el;
  }

  /**
   * Gets the first DOM element matching a CSS selector.
   * Logs a warning if the element is not found.
   * @param {string} selector - The CSS selector.
   * @param {HTMLElement|Document} parent - The parent element to search within (defaults to document).
   * @returns {HTMLElement|null} The found element or null.
   */
  function qs(selector, parent = document) {
    const el = parent.querySelector(selector);
    if (!el) console.warn(`UI_WARN: Element with selector '${selector}' not found within parent. Selector: ${selector}, Parent: ${parent.id || parent.tagName}`);
    return el;
  }

  /* ------------------------------------------------------------------
   * Theme helpers
   * ------------------------------------------------------------------ */
  /**
   * Applies the specified theme to the body and updates the theme toggle button.
   * @param {string} theme - The theme name ('normal' or 'caldas').
   */
  ui.applyThemeUI = (theme) => {
    const body = document.body;
    if (!body) return console.error("UI_ERROR: Document body is not available for theming.");

    body.classList.toggle("caldas-mode", theme === "caldas");
    body.classList.toggle("normal-mode", theme !== "caldas"); // Ensure normal-mode is exclusive
    ui.updateThemeToggleButtonUI(theme);
  };

  /**
   * Updates the theme toggle button's icon and text based on the current theme.
   * @param {string} theme - The current theme.
   */
  ui.updateThemeToggleButtonUI = (theme) => {
    const iconEl = getElement("theme-toggle-icon");
    const textEl = getElement("theme-toggle-text");
    if (!iconEl || !textEl) return; // Elements might not be present (e.g. during testing)

    if (theme === "caldas") {
      iconEl.textContent = "🎮";
      textEl.textContent = "Caldas";
    } else {
      iconEl.textContent = "☀️";
      textEl.textContent = "Normal";
    }
  };

  /* ------------------------------------------------------------------
   * Landing‑page render (titles + grid)
   * ------------------------------------------------------------------ */
  /**
   * Renders the main UI elements (titles, user-specific content visibility) based on the application state.
   * @param {object} state - The current application state.
   * @param {function} renderBooksGridFn - Callback function to render the books grid.
   */
  ui.renderUI = (state, renderBooksGridFn) => {
    document.title = state.libraryTitle; // Update page title

    const pageMainTitleEl = getElement("page-main-title");
    const customWelcomeMessageEl = getElement("custom-welcome-message");
    if (pageMainTitleEl) pageMainTitleEl.textContent = state.libraryTitle;
    if (customWelcomeMessageEl) customWelcomeMessageEl.textContent = state.customWelcomeMessage;

    const usernamePromptEl = getElement("username-prompt");
    const mainContentEl = getElement("main-content");
    const usernameTextEl = getElement("username-text");
    const changeUsernameBtnEl = getElement("change-username-btn");
    const editPageTitleBtnEl = getElement("edit-page-title-btn");
    const editCustomWelcomeBtnEl = getElement("edit-custom-welcome-btn");
    const usernameDisplayContainerEl = getElement("username-display-container");
    const welcomeUserMessageEl = getElement("welcome-user-message");

    const hasUsername = Boolean(state.userName);

    // Toggle visibility based on whether a username is set
    if (usernamePromptEl) usernamePromptEl.classList.toggle("hidden", hasUsername);
    if (mainContentEl) mainContentEl.classList.toggle("hidden", !hasUsername);
    if (usernameDisplayContainerEl) usernameDisplayContainerEl.classList.toggle("hidden", !hasUsername);

    // These buttons should only be visible if a username exists and main content is shown
    if (changeUsernameBtnEl) changeUsernameBtnEl.classList.toggle("hidden", !hasUsername);
    if (editPageTitleBtnEl) editPageTitleBtnEl.classList.toggle("hidden", !hasUsername);
    if (editCustomWelcomeBtnEl) editCustomWelcomeBtnEl.classList.toggle("hidden", !hasUsername);

    if (hasUsername) {
      if (usernameTextEl) usernameTextEl.textContent = `Hi, ${state.userName}!`;
      if (welcomeUserMessageEl) welcomeUserMessageEl.textContent = `Here are your creations, ${state.userName}:`;
      renderBooksGridFn?.(state.books, state.userName, state.currentTheme);
    }
  };

  /* ------------------------------------------------------------------
   * Books grid (landing)
   * ------------------------------------------------------------------ */
  /**
   * Renders the grid of book covers on the landing page.
   * @param {Array<object>} books - Array of book objects.
   * @param {string} userName - The current user's name.
   * @param {string} theme - The current theme.
   * @param {function} openBookFn - Callback when a book cover is clicked to open it.
   * @param {function} editBookFn - Callback to handle editing a book.
   * @param {function} deleteBookFn - Callback to handle deleting a book.
   */
  ui.renderBooksGridUI = (
    books,
    userName,
    theme,
    openBookFn,
    editBookFn,
    deleteBookFn
  ) => {
    const booksGridEl = getElement("books-grid");
    const noBooksMessageEl = getElement("no-books-message");
    if (!booksGridEl || !noBooksMessageEl) return console.error("UI_ERROR: Books grid or no-books message element not found.");

    booksGridEl.innerHTML = ""; // Clear existing grid items

    if (!books || !books.length) {
      noBooksMessageEl.classList.remove("hidden");
      booksGridEl.classList.add("hidden");
      return;
    }

    noBooksMessageEl.classList.add("hidden");
    booksGridEl.classList.remove("hidden");

    books.forEach((book) => {
      const wrapperDiv = document.createElement("div");
      wrapperDiv.className = "relative group book-cover-container"; // For positioning action buttons

      const coverDiv = document.createElement("div");
      coverDiv.className =
        "book-cover-item rounded-lg shadow-md cursor-pointer flex flex-col justify-end items-center h-64 aspect-[2/3] bg-cover bg-center relative overflow-hidden transition-transform duration-200 ease-out hover:scale-105";
      coverDiv.setAttribute("role", "button");
      coverDiv.setAttribute("tabindex", "0");
      coverDiv.setAttribute("aria-label", `Open book: ${book.title}`);

      const firstPage = book.pages?.[0] || {}; // Safely access first page
      if (firstPage.coverImageUrl) {
        // Use CSS.escape for safety, though URLs in backgroundImage are generally safe if not user-inputted directly into style attributes
        coverDiv.style.backgroundImage = `url('${CSS.escape(firstPage.coverImageUrl)}')`;
      } else {
        coverDiv.style.backgroundColor =
          book.coverColor || (theme === "caldas" ? "#3a3a5e" : ui.getRandomColorUI());
      }

      const textWrapperDiv = document.createElement("div");
      // Added gradient for better text visibility over diverse cover images
      textWrapperDiv.className =
        "relative z-10 flex flex-col justify-end items-center w-full p-3 bg-gradient-to-t from-black/70 via-black/50 to-transparent";

      const titleH3 = document.createElement("h3");
      // Using theme variables for text shadow for consistency
      titleH3.className = "book-cover-title text-shadow-md"; // Tailwind utility for text shadow
      titleH3.style.textShadow = "var(--book-cover-text-shadow)";
      titleH3.textContent = book.title;

      const authorP = document.createElement("p");
      authorP.className = "book-cover-author text-xs text-gray-200 mt-1";
      authorP.style.textShadow = "var(--book-cover-text-shadow)";
      authorP.textContent = `By ${userName}`;

      textWrapperDiv.append(titleH3, authorP);
      coverDiv.appendChild(textWrapperDiv);

      coverDiv.addEventListener("click", (e) => {
        if (e.target.closest(".book-action-btn")) return; // Ignore clicks on action buttons
        openBookFn?.(book, coverDiv);
      });
      coverDiv.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          if (e.target.closest(".book-action-btn")) return;
          openBookFn?.(book, coverDiv);
          e.preventDefault(); // Prevent space from scrolling page
        }
      });

      // Action buttons (Edit, Delete)
      const actionsDiv = document.createElement("div");
      actionsDiv.className =
        "absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex space-x-1 z-20";

      const editButton = document.createElement("button");
      editButton.innerHTML = "✏️"; // Edit icon
      editButton.title = "Edit Book";
      editButton.className =
        "book-action-btn p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 text-xs shadow-lg w-8 h-8 flex items-center justify-center";
      editButton.setAttribute("aria-label", `Edit ${book.title}`);
      editButton.addEventListener("click", (e) => {
        e.stopPropagation(); // Prevent cover click event
        editBookFn?.(book.id);
      });

      const deleteButton = document.createElement("button");
      deleteButton.innerHTML = "🗑️"; // Delete icon
      deleteButton.title = "Delete Book";
      deleteButton.className =
        "book-action-btn p-2 bg-red-500 text-white rounded-full hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 text-xs shadow-lg w-8 h-8 flex items-center justify-center";
      deleteButton.setAttribute("aria-label", `Delete ${book.title}`);
      deleteButton.addEventListener("click", (e) => {
        e.stopPropagation(); // Prevent cover click event
        deleteBookFn?.(book.id);
      });

      actionsDiv.append(editButton, deleteButton);
      wrapperDiv.append(actionsDiv, coverDiv);
      booksGridEl.appendChild(wrapperDiv);
    });
  };

  /**
   * Generates a random light-ish hex color string for fallback cover backgrounds.
   * @returns {string} A hex color code (e.g., "#ABCDEF").
   */
  ui.getRandomColorUI = () => {
    const letters = "789ABCDEF"; // Using brighter hex characters
    let color = "#";
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * letters.length)];
    }
    return color;
  };

  /* ------------------------------------------------------------------
   * Modal helpers – Crucial for book creation and editing
   * ------------------------------------------------------------------ */
  /**
   * Shows the book creation/editing modal and populates it based on mode.
   * @param {object|null} bookToEdit - The book object to edit, or null if creating a new book.
   * @param {object} currentBookData - The state object (appState.currentBookToCreate) for the book being created/edited.
   * @param {object} editingBookIdRef - A reference object (e.g., { id: value }) to store/reflect the ID of the book being edited.
   */
  ui.showBookCreationModalUI = function (
    bookToEdit,
    currentBookData,
    editingBookIdRef
  ) {
    const modalEl = getElement("book-creation-modal");
    const step1El = getElement("modal-step-1");
    const step2El = getElement("modal-step-2");
    const titleInputEl = getElement("book-title-input");
    const pagesInputEl = getElement("num-pages-input");
    const modalTitleEl = qs("#book-creation-modal #modal-step-1 h2");
    const saveBtnEl = getElement("save-book-btn");
    const coverImgUrlInputEl = getElement("cover-image-url-input");
    const coverImgContainerEl = getElement("cover-image-input-container"); // This is in Step 1's HTML

    if (
      !modalEl || !step1El || !step2El || !titleInputEl || !pagesInputEl ||
      !modalTitleEl || !saveBtnEl || !coverImgUrlInputEl || !coverImgContainerEl
    ) {
      return console.error("UI_ERROR: One or more critical elements for the book creation modal are missing.");
    }

    // FIX: Ensure cover image container in Step 1 is visible when modal (Step 1) is shown.
    // This resets its state if it was hidden by Step 2 logic in a previous session.
    coverImgContainerEl.classList.remove("hidden");

    editingBookIdRef.id = bookToEdit ? bookToEdit.id : null;

    // Populate fields based on currentBookData, which script.js prepares
    titleInputEl.value = currentBookData.title;
    pagesInputEl.value = currentBookData.pages.length.toString();
    coverImgUrlInputEl.value = currentBookData.pages[0]?.coverImageUrl || "";

    if (bookToEdit) {
      // Edit mode specific UI changes
      modalTitleEl.textContent = "Edit Book";
      saveBtnEl.textContent = "Save Changes";
      pagesInputEl.disabled = false; // As per script.js logic, allow changing page count when editing
    } else {
      // Create mode specific UI changes
      modalTitleEl.textContent = "Create New Book";
      saveBtnEl.textContent = "Save Book";
      pagesInputEl.disabled = false; // Ensure enabled for new books
    }

    modalEl.classList.remove("hidden");
    modalEl.classList.add("flex"); // Use flex for centering content in the modal
    step1El.classList.remove("hidden");
    step2El.classList.add("hidden"); // Ensure Step 2 is hidden initially
  };

  /**
   * Hides the book creation/editing modal.
   * @param {object} editingBookIdRef - A reference object holding the ID of the book being edited. Its 'id' property is set to null.
   */
  ui.hideBookCreationModalUI = function (editingBookIdRef) {
    const modalEl = getElement("book-creation-modal");
    if (!modalEl) return;

    modalEl.classList.add("hidden");
    modalEl.classList.remove("flex");

    if (editingBookIdRef) editingBookIdRef.id = null; // Reset editing ID reference in script.js's state

    // Optionally reset more modal fields to default "Create" state if script.js doesn't fully handle it
    // For instance, the number of pages input should be enabled for the next new book.
    const pagesInputEl = getElement("num-pages-input");
    if (pagesInputEl) pagesInputEl.disabled = false;

    const modalTitleEl = qs("#book-creation-modal #modal-step-1 h2");
    if (modalTitleEl) modalTitleEl.textContent = "Create New Book";

    const saveBtnEl = getElement("save-book-btn");
    if (saveBtnEl) saveBtnEl.textContent = "Save Book";
  };

  /**
   * Renders the inputs for editing page content (textarea, cover URL for page 0) in the modal's Step 2.
   * @param {object} currentBookData - The book data (appState.currentBookToCreate) currently being edited.
   * @param {number} currentPageEditorIndex - The index of the page currently being edited.
   * @param {function} attachDynamicListenersFn - Callback to attach listeners to dynamically created/managed elements (like delete page button).
   */
  ui.renderPageContentInputsUI = function (
    currentBookData,
    currentPageEditorIndex,
    attachDynamicListenersFn
  ) {
    const inputsContainerEl = getElement("page-content-inputs"); // In Step 2
    const pageLabelEl = getElement("current-page-editor-label"); // In Step 2
    const pageIndicatorEl = getElement("page-editor-indicator"); // In Step 2
    const prevBtnEl = getElement("prev-page-editor-btn"); // In Step 2
    const nextBtnEl = getElement("next-page-editor-btn"); // In Step 2

    // Cover image related elements are in Step 1's DOM but controlled from here for cover page editing
    const coverImgContainerElStep1 = getElement("cover-image-input-container");
    const coverImgUrlInputElStep1 = getElement("cover-image-url-input");

    if (
      !inputsContainerEl || !pageLabelEl || !pageIndicatorEl || !prevBtnEl || !nextBtnEl ||
      !coverImgContainerElStep1 || !coverImgUrlInputElStep1 // Ensure these are also found
    ) {
      return console.error("UI_ERROR: Missing one or more critical elements for rendering page content inputs in modal Step 2.");
    }

    inputsContainerEl.innerHTML = ""; // Clear previous page's inputs from the container

    const totalPages = currentBookData.pages.length;
    const pageData = currentBookData.pages[currentPageEditorIndex] || { content: "", coverImageUrl: "" }; // Default if page somehow doesn't exist

    const pageDisplayName = currentPageEditorIndex === 0 ? `Page 1 (Cover)` : `Page ${currentPageEditorIndex + 1}`;
    pageLabelEl.textContent = `Editing ${pageDisplayName}`;
    pageIndicatorEl.textContent = `Page ${currentPageEditorIndex + 1} of ${totalPages}`;

    // Control visibility of the cover image URL input (which is in Step 1 DOM)
    if (currentPageEditorIndex === 0) { // If editing the cover page
      coverImgContainerElStep1.classList.remove("hidden");
      coverImgUrlInputElStep1.value = pageData.coverImageUrl || "";
    } else { // If editing any other page
      coverImgContainerElStep1.classList.add("hidden");
    }

    // Textarea for page content
    const contentTextarea = document.createElement("textarea");
    contentTextarea.id = `page-content-${currentPageEditorIndex}`; // Unique ID for potential direct access
    contentTextarea.rows = currentPageEditorIndex === 0 ? 6 : 10; // Fewer rows for cover if image URL is also shown
    contentTextarea.className =
      "w-full p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-y mt-2 bg-white dark:bg-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600 placeholder-gray-400 dark:placeholder-gray-500";
    contentTextarea.placeholder =
      `Enter content for ${pageDisplayName}...\nSupports basic Markdown (e.g., **bold**, *italic*) and simple HTML (e.g., <b>, <i>, <u>). Use HTML with caution.`;
    contentTextarea.value = pageData.content || "";
    inputsContainerEl.appendChild(contentTextarea);
    contentTextarea.focus(); // Auto-focus for better UX

    // Update navigation buttons state in Step 2
    prevBtnEl.disabled = currentPageEditorIndex === 0;
    nextBtnEl.disabled = currentPageEditorIndex >= totalPages - 1;

    // Manage "Delete Page" button (dynamically added or updated by script.js calling this)
    // The button itself is created/managed by script.js logic calling attachDynamicListenersFn
    attachDynamicListenersFn?.();
  };


  /* ------------------------------------------------------------------
   * Reader open / close & page rendering
   * ------------------------------------------------------------------ */
  /**
   * Opens the book reader view with a cover expansion animation.
   * @param {object} book - The book object to open.
   * @param {HTMLElement} coverElement - The clicked cover element on the grid (for animation source).
   * @param {function} renderCurrentPagesFn - Callback to render the initial pages in the reader once animation completes.
   */
  ui.openBookUI = function (book, coverElement, renderCurrentPagesFn) {
    const body = document.body;
    const landingPageEl = getElement("landing-page");
    const addBookBtnEl = getElement("add-book-btn"); // The floating action button
    const readerContainerEl = getElement("book-reader-container");
    const readerEl = getElement("book-reader");

    if (!body || !landingPageEl || !addBookBtnEl || !readerContainerEl || !readerEl || !coverElement) {
      return console.error("UI_ERROR: Missing critical elements for opening book reader animation or display.");
    }

    const coverRect = coverElement.getBoundingClientRect();
    const clone = coverElement.cloneNode(true); // Deep clone to preserve content and style
    clone.classList.add("book-transition-clone"); // For specific styling during transition if needed
    // Apply styles explicitly to ensure smooth animation from exact source
    clone.style.cssText = `
      position: fixed;
      top: ${coverRect.top}px;
      left: ${coverRect.left}px;
      width: ${coverRect.width}px;
      height: ${coverRect.height}px;
      z-index: 100; /* High z-index for transition */
      transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1); /* Smooth easing */
      background-image: ${getComputedStyle(coverElement).backgroundImage};
      background-color: ${getComputedStyle(coverElement).backgroundColor};
      background-size: cover;
      background-position: center;
      margin: 0;
      padding: 0;
      border-radius: ${getComputedStyle(coverElement).borderRadius};
      overflow: hidden;
      box-shadow: ${getComputedStyle(coverElement).boxShadow};
    `;
    body.appendChild(clone);

    // Fade out landing page and hide add button
    landingPageEl.style.transition = "opacity 0.3s ease-out";
    landingPageEl.style.opacity = "0";
    addBookBtnEl.style.display = "none";

    // Animate clone to the reader's target position and size
    requestAnimationFrame(() => { // Ensures smooth animation start
      const targetWidth = Math.min(window.innerWidth * 0.9, 1200); // Reader width
      const targetHeight = Math.min(window.innerHeight * 0.85, 700); // Reader height
      const targetTop = (window.innerHeight - targetHeight) / 2;
      const targetLeft = (window.innerWidth - targetWidth) / 2;

      clone.style.top = `${targetTop}px`;
      clone.style.left = `${targetLeft}px`;
      clone.style.width = `${targetWidth}px`;
      clone.style.height = `${targetHeight}px`;
      // clone.style.transform = "scale(1.02)"; // Optional slight overshoot
      clone.style.opacity = "0.9"; // Slightly fade during transform
      clone.style.boxShadow = "0 10px 25px rgba(0,0,0,0.3)"; // Enhance shadow during transition
    });

    // After animation, switch to the actual reader
    setTimeout(() => {
      if (clone.parentNode) clone.remove(); // Remove the animated clone

      readerContainerEl.classList.remove("hidden");
      readerContainerEl.classList.add("flex"); // Use flex for centering
      readerEl.classList.remove("hidden");
      readerEl.style.opacity = "0"; // Start reader transparent
      requestAnimationFrame(() => readerEl.style.opacity = "1"); // Fade in reader

      renderCurrentPagesFn?.(); // Render the book content
      landingPageEl.classList.add("hidden"); // Fully hide landing page
    }, 550); // Duration should match or slightly exceed animation time
  };

  /**
   * Closes the book reader view and returns to the landing page.
   */
  ui.closeBookUI = function () {
    const readerEl = getElement("book-reader");
    const readerContainerEl = getElement("book-reader-container");
    const landingPageEl = getElement("landing-page");
    const addBookBtnEl = getElement("add-book-btn");

    if (!readerEl || !readerContainerEl || !landingPageEl || !addBookBtnEl) {
      return console.error("UI_ERROR: Missing critical elements for closing book reader.");
    }

    readerEl.style.transition = "opacity 0.3s ease-out";
    readerEl.style.opacity = "0"; // Fade out reader

    setTimeout(() => {
      readerContainerEl.classList.add("hidden");
      readerContainerEl.classList.remove("flex");
      readerEl.classList.add("hidden");

      landingPageEl.classList.remove("hidden");
      landingPageEl.style.opacity = "1"; // Fade in landing page
      addBookBtnEl.style.display = "flex"; // Or 'block', restore its original display type
    }, 300); // Match transition time
  };

  /**
   * Renders the current page(s) in the book reader (cover or spread).
   * @param {object} currentOpenBook - The book object currently open.
   * @param {number} currentOpenBookPageIndex - The index of the left page (or cover page if active).
   * @param {boolean} isCoverViewActive - True if the cover page is being shown.
   * @param {function} convertMarkdownToHTMLFn - Function to convert markdown/HTML string to safe HTML.
   */
  ui.renderCurrentPagesUI = function (
    currentOpenBook,
    currentOpenBookPageIndex,
    isCoverViewActive,
    convertMarkdownToHTMLFn
  ) {
    const leftPageEl = getElement("left-page");
    const rightPageEl = getElement("right-page");

    if (!currentOpenBook || !leftPageEl || !rightPageEl || !convertMarkdownToHTMLFn) {
      return console.error("UI_ERROR: Missing data or elements for rendering reader pages.");
    }

    const leftPageContentEl = qs(".page-content", leftPageEl);
    const rightPageContentEl = qs(".page-content", rightPageEl);
    const turnPrevBtnEl = getElement("turn-prev");
    const turnNextBtnEl = getElement("turn-next");

    if (!leftPageContentEl || !rightPageContentEl || !turnPrevBtnEl || !turnNextBtnEl) {
      return console.error("UI_ERROR: Page content containers or navigation buttons missing in reader.");
    }

    // Reset styles and classes from previous state
    [leftPageEl, rightPageEl].forEach((el) => {
      el.style.backgroundImage = "";
      el.style.backgroundSize = "";
      el.style.backgroundColor = ""; // Reset background color
      el.className = "page"; // Base class, specific (left/right, full/half) added below
      qs(".page-content", el).innerHTML = ""; // Clear previous content
      qs(".page-content", el).classList.remove("cover-text-on-image-container");
    });

    const pages = currentOpenBook.pages;
    const totalPagesInBook = pages.length;

    if (isCoverViewActive) {
      // Cover View: Left page hidden, Right page shows cover
      leftPageEl.classList.add("left", "hidden-page"); // Visually hide left page
      rightPageEl.classList.add("right", "full-width-page"); // Right page takes full width

      const coverPageData = pages[0] || { content: "Cover not available", coverImageUrl: "" };
      if (coverPageData.coverImageUrl) {
        rightPageEl.style.backgroundImage = `url('${CSS.escape(coverPageData.coverImageUrl)}')`;
        rightPageEl.style.backgroundSize = "contain";
        rightPageEl.style.backgroundRepeat = "no-repeat";
        rightPageEl.style.backgroundPosition = "center";
        rightPageContentEl.classList.add("cover-text-on-image-container");
      } else {
        // Fallback background for cover if no image
        rightPageEl.style.backgroundColor = currentOpenBook.coverColor || "var(--bg-page)";
      }
      rightPageContentEl.innerHTML = convertMarkdownToHTMLFn(coverPageData.content);

      turnPrevBtnEl.style.display = "none"; // No "previous" from cover
      turnNextBtnEl.style.display = totalPagesInBook > 1 ? "block" : "none"; // "Next" if there are content pages
    } else {
      // Spread View: Two pages visible
      leftPageEl.classList.add("left", "half-width-page");
      rightPageEl.classList.add("right", "half-width-page");

      // Left page content (currentOpenBookPageIndex should be an odd number for left page of a spread)
      const leftPageData = pages[currentOpenBookPageIndex] || { content: "" };
      leftPageContentEl.innerHTML = convertMarkdownToHTMLFn(leftPageData.content);

      // Right page content
      if (currentOpenBookPageIndex + 1 < totalPagesInBook) {
        const rightPageData = pages[currentOpenBookPageIndex + 1] || { content: "" };
        rightPageContentEl.innerHTML = convertMarkdownToHTMLFn(rightPageData.content);
      } else {
        // This is the last page of the book, displayed on the left, right page is "End of Book"
        rightPageContentEl.innerHTML = `<div class="p-4 text-center text-gray-500 dark:text-gray-400 italic">End of Book</div>`;
      }

      turnPrevBtnEl.style.display = "block"; // Allow going back (to previous spread or cover)
      // Show "Next" if there are at least two more pages to form the next spread's left page
      turnNextBtnEl.style.display = (currentOpenBookPageIndex + 2 < totalPagesInBook) ? "block" : "none";
    }

    // Reset scroll position for newly rendered content
    leftPageContentEl.scrollTop = 0;
    rightPageContentEl.scrollTop = 0;
  };

  /* ------------------------------------------------------------------
   * Simple markdown/HTML to HTML (Basic Escaping for Security Improvement)
   * WARNING: This is NOT a substitute for a proper HTML sanitizer like DOMPurify.
   * For production, use a dedicated library (e.g., DOMPurify after a Markdown converter) to prevent XSS.
   * ------------------------------------------------------------------ */
  ui.convertMarkdownToHTMLUI = function (mdText) {
    if (typeof mdText !== "string") return "";
    let html = mdText; // Start with the raw text

    // Basic HTML escaping for characters that could break HTML structure or inject scripts.
    // This is a minimal effort and not exhaustive. A proper sanitizer is much more robust.
    const escapeHTML = (str) => str.replace(/[&<>"']/g, function (match) {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;' // or &apos;
        }[match];
    });

    // Apply Markdown conversions AFTER potential full escaping if no HTML is allowed.
    // However, the placeholder text suggests some HTML (<b>, <i>, <span>) is intended.
    // This makes sanitization complex without a library.
    // Current approach: Convert specific markdown, leave other HTML as-is (potential risk).

    // Markdown for Bold and Italic
    // Using non-greedy match (.*?) and ensuring it's not preceded/followed by word chars for stricter md
    html = html.replace(/(?<!\w)\*\*(.*?)\*\*(?!\w)|(?<!\w)__(.*?)__(?!\w)/g, "<strong>$1$2</strong>");
    html = html.replace(/(?<!\w)\*(.*?)\*(?!\w)|(?<!\w)_(.*?)_(?!\w)/g, "<em>$1$2</em>");

    // Paragraphs: Split by two or more newlines.
    // Then, within each paragraph, convert single newlines to <br />.
    const paragraphs = html.split(/\n\s*\n+/);
    html = paragraphs.map(p => {
        if (!p.trim()) return ""; // Skip empty paragraphs
        // Convert single newlines within a paragraph to <br />
        // Note: If user input HTML like <p>, this simple replace can lead to nested <p><p>
        // This is why a proper Markdown lib that builds a token tree is better.
        return "<p>" + p.replace(/\n/g, "<br />") + "</p>";
    }).join("");

    // IMPORTANT: If the original string `mdText` contained intentional HTML like `<u>text</u>`
    // or `<span style="...">text</span>`, it would pass through this function largely untouched
    // by the markdown rules, which is likely the desired behavior for simple HTML pass-through.
    // However, this also means malicious `<script>` tags would pass through if not escaped prior.
    // The `escapeHTML` function is not currently used here because it would break intentional HTML.
    // A true fix requires a markdown parser + HTML sanitizer.

    return html.trim();
  };

  /* Expose utility functions on the ui object if they need to be accessed from script.js directly,
     though typically internal helpers are not exposed unless for specific reasons like testing. */
  ui.getElement = getElement;
  ui.querySelector = qs;

  console.log("ui.js (Rewritten with fixes and enhancements) loaded successfully.");
})(window);
