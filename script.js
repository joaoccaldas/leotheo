// Lulu’s Library – script.js (Rewritten with Corrections and Improvements)
// ===================================================================
//  ▸ Works with the improved ui.js.
//  ▸ Page 0 in the `book.pages` array is always the cover.
//  ▸ JSON upload processing respects the cover-first structure.
//  ▸ Reader navigation handles cover and spread views distinctly.
// -------------------------------------------------------------------

/**
 * Helper function for getting DOM elements by ID.
 * @param {string} id - The ID of the DOM element.
 * @returns {HTMLElement|null} The DOM element or null if not found.
 */
const $ = (id) => document.getElementById(id);

// Declare variables for DOM elements; will be assigned in DOMContentLoaded
// Grouped by functionality for better organization
let saveUsernameBtnEl, usernameInputEl, changeUsernameBtnEl,
    editPageTitleBtnEl, editCustomWelcomeBtnEl, themeToggleBtnEl,
    addBookBtnEl, bookCreationModalEl,
    cancelCreationBtnEl, nextStepBtnEl, backToStep1BtnEl, saveBookBtnEl,
    bookTitleInputEl, numPagesInputEl, coverImageUrlInputModalEl, // Added for direct reference
    prevPageEditorBtnEl, nextPageEditorBtnEl,
    bookReaderContainerEl, closeBookBtnEl, turnPrevBtnEl, turnNextBtnEl;

/* --------------------------- APP STATE --------------------------- */
/**
 * @typedef {object} Page
 * @property {string} content - Text content of the page (can be markdown/HTML).
 * @property {string} [coverImageUrl] - URL for the cover image (only for page 0).
 */

/**
 * @typedef {object} Book
 * @property {string} id - Unique identifier for the book.
 * @property {string} title - Title of the book.
 * @property {Page[]} pages - Array of page objects. Page 0 is the cover.
 * @property {string} coverColor - Background color for the cover if no image.
 */

/**
 * @typedef {object} AppState
 * @property {string} userName - The name of the user.
 * @property {string} libraryTitle - The title of the library.
 * @property {string} customWelcomeMessage - Custom part of the welcome message.
 * @property {string} currentTheme - Current theme ('normal' or 'caldas').
 * @property {Book[]} books - Array of book objects in the library.
 * @property {object} currentBookToCreate - Temporary state for book creation/editing modal.
 * @property {string} currentBookToCreate.title - Title of the book being created/edited.
 * @property {Page[]} currentBookToCreate.pages - Pages of the book being created/edited.
 * @property {number} currentPageEditorIndex - Index of the page being edited in the modal.
 * @property {string|null} editingBookId - ID of the book being edited, or null if creating.
 * @property {Book|null} currentOpenBook - The book currently open in the reader.
 * @property {number} currentOpenBookPageIndex - Index for the current view in reader (0 for cover, 1+ for pages).
 * @property {boolean} isCoverViewActive - True if the reader is showing the cover page.
 */

/** @type {AppState} */
let appState = {
  userName: '',
  libraryTitle: "Lulu's Library",
  customWelcomeMessage: 'Welcome to',
  currentTheme: 'normal',
  books: [],
  currentBookToCreate: { title: '', pages: [] },
  currentPageEditorIndex: 0,
  editingBookId: null,
  currentOpenBook: null,
  currentOpenBookPageIndex: 0,
  isCoverViewActive: false,
};

/* ------------------------------ INIT ----------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  // Assign DOM elements now that the DOM is loaded
  assignDomElements();

  if (!window.ui || typeof window.ui.showBookCreationModalUI !== 'function') {
    console.error('CRITICAL: ui.js failed to load or essential UI functions are missing.');
    alert('A critical UI component failed to load. Please refresh the page or contact support.');
    return;
  }

  loadState();
  window.ui.applyThemeUI(appState.currentTheme);
  window.ui.renderUI(appState, renderBooksGrid); // Initial render
  attachEventListeners();

  // Expose functions for global access (e.g., by inline scripts or for debugging)
  window.refreshAppUI = () => {
    console.log("Global refreshAppUI called");
    loadState(); // Ensure appState is fresh before re-rendering
    window.ui.renderUI(appState, renderBooksGrid);
  };
  window.saveAppState = saveState; // Renamed for clarity from just 'saveState'
});

/**
 * Assigns frequently used DOM elements to variables.
 */
function assignDomElements() {
  saveUsernameBtnEl       = $('save-username-btn');
  usernameInputEl         = $('username-input');
  changeUsernameBtnEl     = $('change-username-btn');
  editPageTitleBtnEl      = $('edit-page-title-btn');
  editCustomWelcomeBtnEl  = $('edit-custom-welcome-btn');
  themeToggleBtnEl        = $('theme-toggle-btn');

  addBookBtnEl            = $('add-book-btn');
  bookCreationModalEl     = $('book-creation-modal'); // For checking visibility
  cancelCreationBtnEl     = $('cancel-creation-btn');
  nextStepBtnEl           = $('next-step-btn');
  backToStep1BtnEl        = $('back-to-step1-btn');
  saveBookBtnEl           = $('save-book-btn');
  prevPageEditorBtnEl     = $('prev-page-editor-btn');
  nextPageEditorBtnEl     = $('next-page-editor-btn');

  // Modal specific inputs (often accessed via window.ui.getElement, but good to have if used directly often)
  bookTitleInputEl        = $('book-title-input');
  numPagesInputEl         = $('num-pages-input');
  coverImageUrlInputModalEl = $('cover-image-url-input'); // The one in the modal

  bookReaderContainerEl   = $('book-reader-container'); // For checking visibility
  closeBookBtnEl          = $('close-book-btn');
  turnPrevBtnEl           = $('turn-prev');
  turnNextBtnEl           = $('turn-next');
}


/* --------------------------- PERSISTENCE ------------------------- */
/**
 * Loads application state from localStorage.
 */
function loadState() {
  try {
    const rawData = localStorage.getItem('webBookAppData');
    if (!rawData) {
        console.log("No saved data found in localStorage. Initializing with defaults.");
        // Ensure default currentBookToCreate is initialized if no saved state
        appState.currentBookToCreate = { title: '', pages: [{ content: '', coverImageUrl: '' }] };
        return;
    }
    const loadedData = JSON.parse(rawData);

    // Selectively update appState properties to prevent overriding defaults with undefined
    appState.userName              = loadedData.userName              ?? appState.userName;
    appState.libraryTitle          = loadedData.libraryTitle          ?? appState.libraryTitle;
    appState.customWelcomeMessage  = loadedData.customWelcomeMessage  ?? appState.customWelcomeMessage;
    appState.currentTheme          = loadedData.currentTheme          ?? appState.currentTheme;
    appState.books                 = Array.isArray(loadedData.books) ? loadedData.books : appState.books; // Ensure books is an array

    // Ensure each book has a valid pages array (important for compatibility with older data)
    appState.books.forEach(book => {
        if (!Array.isArray(book.pages) || book.pages.length === 0) {
            console.warn(`Book "${book.title}" (ID: ${book.id}) has invalid pages. Resetting to a single cover page.`);
            book.pages = [{ content: book.title || 'Cover', coverImageUrl: '' }]; // Default cover page
        }
    });


  } catch (error) {
    console.error('Error loading saved data from localStorage:', error);
    // Potentially clear corrupted data or notify user
    // localStorage.removeItem('webBookAppData');
  }
}

/**
 * Saves the relevant parts of the application state to localStorage.
 */
function saveState() {
  try {
    // Only persist data relevant for saving, not temporary UI states like currentOpenBook
    const stateToSave = {
      userName: appState.userName,
      libraryTitle: appState.libraryTitle,
      customWelcomeMessage: appState.customWelcomeMessage,
      currentTheme: appState.currentTheme,
      books: appState.books,
    };
    localStorage.setItem('webBookAppData', JSON.stringify(stateToSave));
    console.log("Application state saved.");
  } catch (error) {
    console.error('Error saving data to localStorage:', error);
    alert('There was an issue saving your data. Please try again or ensure localStorage is enabled and not full.');
  }
}

/* ----------------------------- THEME ----------------------------- */
/**
 * Toggles the application theme between 'normal' and 'caldas'.
 */
function toggleTheme() {
  appState.currentTheme = appState.currentTheme === 'normal' ? 'caldas' : 'normal';
  if (window.ui && typeof window.ui.applyThemeUI === 'function') {
    window.ui.applyThemeUI(appState.currentTheme);
  }
  saveState();
}

/* --------------------------- LANDING GRID ----------------------- */
/**
 * Renders the books grid on the landing page.
 * This function is passed as a callback to ui.renderUI.
 */
function renderBooksGrid() {
  if (window.ui && typeof window.ui.renderBooksGridUI === 'function') {
    window.ui.renderBooksGridUI(
        appState.books,
        appState.userName,
        appState.currentTheme,
        openBook,           // Callback to open a book
        handleStartEditBook,// Callback to start editing a book
        handleDeleteBook    // Callback to delete a book
    );
  } else {
    console.error("UI function renderBooksGridUI is not available.");
  }
}

/* ----------------------- JSON UPLOAD (MODAL) -------------------- */
/**
 * Injects a JSON file uploader into the book creation modal (Step 1).
 */
function injectJsonUploader() {
  if (!window.ui || !window.ui.getElement) return;
  const modalStep1El = window.ui.getElement('modal-step-1');
  if (!modalStep1El || modalStep1El.querySelector('#json-upload-input')) {
    // Already injected or step1 container not found
    return;
  }

  const uploaderWrapper = document.createElement('div');
  uploaderWrapper.className = 'mb-4 mt-2 pt-4 border-t border-gray-200 dark:border-gray-700'; // Added theme-aware border
  uploaderWrapper.innerHTML = `
    <label for="json-upload-input" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      Or Upload Book JSON:
    </label>
    <input type="file" id="json-upload-input" accept="application/json,.json"
           class="w-full text-sm text-gray-500 dark:text-gray-400
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0 file:text-sm file:font-semibold
                  file:bg-indigo-50 dark:file:bg-indigo-800 file:text-indigo-700 dark:file:text-indigo-300
                  hover:file:bg-indigo-100 dark:hover:file:bg-indigo-700 file:cursor-pointer"/>`;
  
  const titleInputContainer = modalStep1El.querySelector('label[for="book-title-input"]')?.parentElement;
  if (titleInputContainer) {
    modalStep1El.insertBefore(uploaderWrapper, titleInputContainer);
  } else {
    // Fallback: insert before the num-pages input or as first child
    const numPagesContainer = modalStep1El.querySelector('label[for="num-pages-input"]')?.parentElement;
    if (numPagesContainer) {
        modalStep1El.insertBefore(uploaderWrapper, numPagesContainer);
    } else {
        modalStep1El.insertBefore(uploaderWrapper, modalStep1El.firstChild);
    }
  }
  
  const jsonUploadInputEl = uploaderWrapper.querySelector('#json-upload-input');
  jsonUploadInputEl?.addEventListener('change', handleJsonFileUpload);
}

/**
 * Handles the file upload event for JSON book data.
 * @param {Event} event - The file input change event.
 */
function handleJsonFileUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const jsonData = JSON.parse(e.target.result);
      if (!jsonData.title || !Array.isArray(jsonData.pages)) {
        throw new Error('Invalid JSON format: "title" (string) and "pages" (array) are required.');
      }

      // Prepare pages according to the app's structure (page 0 = cover)
      const processedPages = [];
      // Attempt to use the first page from JSON as cover content if it exists
      // Otherwise, create a blank cover.
      if (jsonData.pages[0]) {
          processedPages.push({
              content: jsonData.pages[0].content || '',
              coverImageUrl: jsonData.pages[0].coverImageUrl || '', // Assuming JSON might provide this for its first page
          });
          // Add subsequent pages from JSON
          processedPages.push(...jsonData.pages.slice(1).map(p => ({
              content: p.content || '',
              coverImageUrl: '', // Only cover (page 0) has coverImageUrl
          })));
      } else {
           // If JSON has no pages or first page is undefined, create a blank cover
          processedPages.push({ content: '', coverImageUrl: '' });
      }
      // Ensure there's at least one page (cover) if JSON was empty or malformed
      if (processedPages.length === 0) {
          processedPages.push({ content: jsonData.title || 'Cover', coverImageUrl: '' });
      }


      appState.currentBookToCreate.title = jsonData.title;
      appState.currentBookToCreate.pages = processedPages;
      appState.currentPageEditorIndex = 0; // Start editor at the cover

      // Update modal UI fields if modal is open (it should be)
      if (window.ui && window.ui.getElement) {
        const titleInput = window.ui.getElement('book-title-input');
        const numPagesInput = window.ui.getElement('num-pages-input');
        if (titleInput) titleInput.value = jsonData.title;
        if (numPagesInput) numPagesInput.value = appState.currentBookToCreate.pages.length;
        
        // If modal is already in step 2, refresh its content display
        const modalStep2El = window.ui.getElement('modal-step-2');
        if (modalStep2El && !modalStep2El.classList.contains('hidden')) {
            if (typeof window.ui.renderPageContentInputsUI === 'function') {
                window.ui.renderPageContentInputsUI(appState.currentBookToCreate, appState.currentPageEditorIndex, attachDynamicModalListeners);
            }
        }
      }
      alert('Book data loaded from JSON! Please review the details and page content, then save.');
    } catch (err) {
      console.error('JSON parsing or processing error:', err);
      alert(`Failed to load book from JSON: ${err.message}`);
    } finally {
      // Clear the file input so the same file can be selected again if needed
      event.target.value = null;
    }
  };
  reader.onerror = () => {
    alert('Error reading the selected file.');
    event.target.value = null;
  };
  reader.readAsText(file);
}


/* ----------------------- EVENT LISTENERS ----------------------- */
/**
 * Attaches all primary event listeners for the application.
 */
function attachEventListeners() {
  // Profile & Theme
  saveUsernameBtnEl?.addEventListener('click', handleSaveUsername);
  usernameInputEl?.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSaveUsername(); });
  changeUsernameBtnEl?.addEventListener('click', handleChangeUsername);
  editPageTitleBtnEl?.addEventListener('click', handleChangeLibraryTitle);
  editCustomWelcomeBtnEl?.addEventListener('click', handleChangeCustomWelcomeMessage);
  themeToggleBtnEl?.addEventListener('click', toggleTheme);

  // New Book
  addBookBtnEl?.addEventListener('click', () => {
    appState.editingBookId = null; // Clear any previous editing state
    // Initialize a new book structure with one blank cover page
    appState.currentBookToCreate = { title: '', pages: [{ content: '', coverImageUrl: '' }] };
    appState.currentPageEditorIndex = 0; // Start editor at the cover page
    
    if (window.ui && typeof window.ui.showBookCreationModalUI === 'function') {
      window.ui.showBookCreationModalUI(null, appState.currentBookToCreate, { id: null } /* editingBookIdRef */);
      const numPagesInp = window.ui.getElement('num-pages-input');
      if (numPagesInp) numPagesInp.disabled = false; // Ensure page count is editable for new books
      injectJsonUploader(); // Add JSON upload option to the modal
    }
  });

  // Modal Navigation & Actions
  cancelCreationBtnEl?.addEventListener('click', () => {
    if (window.ui && typeof window.ui.hideBookCreationModalUI === 'function') {
      window.ui.hideBookCreationModalUI({ id: appState.editingBookId } /* editingBookIdRef */);
    }
  });
  nextStepBtnEl?.addEventListener('click', handleModalNextStep);
  backToStep1BtnEl?.addEventListener('click', handleModalBackToStep1);
  saveBookBtnEl?.addEventListener('click', handleSaveBook);
  prevPageEditorBtnEl?.addEventListener('click', () => navigateEditorPage(-1));
  nextPageEditorBtnEl?.addEventListener('click', () => navigateEditorPage(1));

  // Reader Actions
  closeBookBtnEl?.addEventListener('click', closeBookReader);
  turnPrevBtnEl?.addEventListener('click', () => navigateReaderPage(-2)); // -2 for spread view
  turnNextBtnEl?.addEventListener('click', () => navigateReaderPage(2));  // +2 for spread view

  // Global keydown listener for Esc and Arrow keys in reader/modal
  document.addEventListener('keydown', handleGlobalKeydown);
}

/* ------------------- MODAL: STEP LOGIC & EDITORS ----------------- */
/**
 * Handles proceeding from Step 1 (book details) to Step 2 (page editor) in the modal.
 */
function handleModalNextStep() {
  if (!window.ui || !window.ui.getElement) return;
  const titleInput = window.ui.getElement('book-title-input'); // Use ui.getElement as it's modal specific
  const numPagesInput = window.ui.getElement('num-pages-input');

  if (!titleInput || !numPagesInput) {
    return alert('Modal elements (title or num pages input) not found. Cannot proceed.');
  }
  const title = titleInput.value.trim();
  const numTargetPages = parseInt(numPagesInput.value, 10);

  if (!title) {
    alert('Please enter a title for the book.');
    titleInput.focus();
    return;
  }
  if (isNaN(numTargetPages) || numTargetPages < 1) {
    alert('Please enter a valid number of pages (at least 1).');
    numPagesInput.focus();
    return;
  }

  appState.currentBookToCreate.title = title;
  const currentPagesArray = appState.currentBookToCreate.pages;

  // Adjust pages array to match numTargetPages, preserving existing content
  if (numTargetPages < currentPagesArray.length) {
    // Truncate pages from the end, but ensure at least one (cover) page remains.
    appState.currentBookToCreate.pages = currentPagesArray.slice(0, Math.max(1, numTargetPages));
  } else {
    // Add new blank pages
    while (appState.currentBookToCreate.pages.length < numTargetPages) {
      // New pages are blank; coverImageUrl is only for page 0 (already handled or set)
      appState.currentBookToCreate.pages.push({ content: '', coverImageUrl: '' });
    }
  }
   // Ensure cover page (index 0) exists with coverImageUrl property
  if (!appState.currentBookToCreate.pages[0]) {
    appState.currentBookToCreate.pages[0] = { content: '', coverImageUrl: ''};
  } else if (appState.currentBookToCreate.pages[0].coverImageUrl === undefined) {
    appState.currentBookToCreate.pages[0].coverImageUrl = window.ui.getElement('cover-image-url-input')?.value || '';
  }


  // Transition to Step 2 UI
  window.ui.getElement('modal-step-1')?.classList.add('hidden');
  window.ui.getElement('modal-step-2')?.classList.remove('hidden');
  appState.currentPageEditorIndex = 0; // Start editing from the first page (cover)
  
  if (typeof window.ui.renderPageContentInputsUI === 'function') {
    window.ui.renderPageContentInputsUI(appState.currentBookToCreate, appState.currentPageEditorIndex, attachDynamicModalListeners);
  }
}

/**
 * Handles returning from Step 2 (page editor) to Step 1 (book details) in the modal.
 */
function handleModalBackToStep1() {
  saveCurrentPageContentToState(); // Save any pending changes from Step 2
  if (window.ui && window.ui.getElement) {
    window.ui.getElement('modal-step-2')?.classList.add('hidden');
    window.ui.getElement('modal-step-1')?.classList.remove('hidden');
    
    // Re-populate Step 1 fields from currentBookToCreate state
    const titleInput = window.ui.getElement('book-title-input');
    const numPagesInp = window.ui.getElement('num-pages-input');
    const coverUrlInp = window.ui.getElement('cover-image-url-input');

    if (titleInput) titleInput.value = appState.currentBookToCreate.title;
    if (numPagesInp) {
        numPagesInp.value = appState.currentBookToCreate.pages.length;
        // Only enable num-pages input if creating a new book, or if design allows changing for existing.
        // Current design seems to allow it.
        numPagesInp.disabled = false;
    }
    if (coverUrlInp && appState.currentBookToCreate.pages[0]) {
        coverUrlInp.value = appState.currentBookToCreate.pages[0].coverImageUrl || '';
    }
  }
}

/**
 * Navigates between pages in the modal's page editor.
 * @param {number} delta - Amount to change the page index by (-1 for prev, +1 for next).
 */
function navigateEditorPage(delta) {
  saveCurrentPageContentToState(); // Save current page before navigating
  const totalPages = appState.currentBookToCreate.pages.length;
  let newEditorIndex = appState.currentPageEditorIndex + delta;

  // Clamp index within valid bounds [0, totalPages - 1]
  newEditorIndex = Math.max(0, Math.min(totalPages - 1, newEditorIndex));
  
  if (newEditorIndex !== appState.currentPageEditorIndex) {
      appState.currentPageEditorIndex = newEditorIndex;
      if (window.ui && typeof window.ui.renderPageContentInputsUI === 'function') {
        window.ui.renderPageContentInputsUI(appState.currentBookToCreate, appState.currentPageEditorIndex, attachDynamicModalListeners);
      }
  }
}

/**
 * Saves the content of the currently edited page in the modal to appState.currentBookToCreate.
 */
function saveCurrentPageContentToState() {
  if (!appState.currentBookToCreate || !Array.isArray(appState.currentBookToCreate.pages)) return;
  
  const pageData = appState.currentBookToCreate.pages[appState.currentPageEditorIndex];
  if (!pageData) {
    console.warn(`Attempted to save content for non-existent page index: ${appState.currentPageEditorIndex}`);
    return; 
  }

  // Save text content from textarea
  const contentTextareaEl = document.getElementById(`page-content-${appState.currentPageEditorIndex}`);
  if (contentTextareaEl) {
    pageData.content = contentTextareaEl.value;
  }

  // Save cover image URL if it's the cover page (index 0)
  // The cover image URL input is in Step 1, but its value is relevant here.
  if (appState.currentPageEditorIndex === 0) {
    const coverUrlInput = window.ui?.getElement('cover-image-url-input');
    if (coverUrlInput) {
      pageData.coverImageUrl = coverUrlInput.value.trim();
    }
  }
}

/**
 * Attaches event listeners to dynamically created elements in the modal (e.g., delete page button).
 */
function attachDynamicModalListeners() {
  const deletePageBtnModalEl = window.ui?.getElement('delete-page-btn-modal');
  if (deletePageBtnModalEl) {
    // Clone and replace to avoid multiple listeners if this function is called multiple times
    // though ui.js's renderPageContentInputsUI should handle button creation/update properly.
    // A simpler approach is to ensure ui.js only adds one listener or script.js adds it once outside.
    // Assuming ui.js adds the button and we attach listener here:
    // To prevent multiple listeners, remove old one if any (more complex) or ensure button ID is stable
    // and ui.js replaces the button if it re-renders.
    // For now, let's trust ui.js's dynamic button handling means we can add listener like this.
    // But a robust way: cloneNode and replaceChild for the button, then add listener.
    const newDeleteBtn = deletePageBtnModalEl.cloneNode(true); // Get a fresh copy
    deletePageBtnModalEl.parentNode.replaceChild(newDeleteBtn, deletePageBtnModalEl); // Replace old with fresh
    
    newDeleteBtn.addEventListener('click', handleDeletePageFromModal);
    
    // Disable if it's the cover or only one page left
    const isCover = appState.currentPageEditorIndex === 0;
    const isOnlyPage = appState.currentBookToCreate.pages.length <= 1;
    newDeleteBtn.disabled = isCover || isOnlyPage;
    newDeleteBtn.style.display = (isCover || isOnlyPage) ? "none" : "inline-block";
  }
}

/**
 * Handles deleting a page from the book creation/editing modal.
 */
function handleDeletePageFromModal() {
  const totalPages = appState.currentBookToCreate.pages.length;
  const pageIndexToDelete = appState.currentPageEditorIndex;

  if (pageIndexToDelete === 0) { // Should be disabled by attachDynamicModalListeners, but double check
    return alert('The cover page (Page 1) cannot be deleted.');
  }
  if (totalPages <= 1) { // Also should be disabled
    return alert('A book must have at least one page (the cover). Cannot delete the last page.');
  }
  
  if (!confirm(`Are you sure you want to delete Page ${pageIndexToDelete + 1}? This action is permanent for this editing session.`)) {
    return;
  }

  appState.currentBookToCreate.pages.splice(pageIndexToDelete, 1);
  
  // Adjust current editor index if the deleted page was the last one or after
  appState.currentPageEditorIndex = Math.min(pageIndexToDelete, appState.currentBookToCreate.pages.length - 1);
  appState.currentPageEditorIndex = Math.max(0, appState.currentPageEditorIndex); // Ensure it's not negative

  // Update the "Number of Pages" input in Step 1 to reflect the change
  const numPagesInp = window.ui?.getElement('num-pages-input');
  if (numPagesInp) {
    numPagesInp.value = appState.currentBookToCreate.pages.length;
  }

  // Re-render the page content inputs for the new current page
  if (window.ui && typeof window.ui.renderPageContentInputsUI === 'function') {
    window.ui.renderPageContentInputsUI(appState.currentBookToCreate, appState.currentPageEditorIndex, attachDynamicModalListeners);
  }
}


/**
 * Handles saving the book (either new or existing) from the modal.
 */
function handleSaveBook() {
  saveCurrentPageContentToState(); // Ensure the very last edits are captured

  const bookTitle = appState.currentBookToCreate.title.trim();
  if (!bookTitle) {
    alert('Book title cannot be empty. Please enter a title in Step 1.');
    handleModalBackToStep1(); // Go back to step 1 to fix
    window.ui?.getElement('book-title-input')?.focus();
    return;
  }
  if (!appState.currentBookToCreate.pages.length) {
    // This state should ideally not be reachable if numPagesInput is validated >= 1
    alert('A book must have at least one page (the cover).');
    return;
  }

  const coverPage = appState.currentBookToCreate.pages[0];
  if (!coverPage) { // Should not happen if pages.length >= 1
      alert('Critical error: Cover page data is missing.');
      return;
  }
  // A cover must have either an image URL or some text content.
  const hasCoverImage = coverPage.coverImageUrl && coverPage.coverImageUrl.trim() !== '';
  const hasCoverText = coverPage.content && coverPage.content.trim() !== '';
  if (!hasCoverImage && !hasCoverText) {
    alert('The cover page (Page 1) must have either an image URL or some text content. Please edit Page 1.');
    // Optionally navigate to editor for page 0 if not already there
    if (appState.currentPageEditorIndex !== 0) {
        appState.currentPageEditorIndex = 0;
        if (window.ui && typeof window.ui.renderPageContentInputsUI === 'function') {
            window.ui.renderPageContentInputsUI(appState.currentBookToCreate, 0, attachDynamicModalListeners);
        }
    }
    return;
  }

  // Deep copy pages to avoid reference issues when saving to appState.books
  const bookPagesToSave = JSON.parse(JSON.stringify(appState.currentBookToCreate.pages));

  if (appState.editingBookId) {
    // Editing an existing book
    const bookIndex = appState.books.findIndex(b => b.id === appState.editingBookId);
    if (bookIndex > -1) {
      appState.books[bookIndex].title = bookTitle;
      appState.books[bookIndex].pages = bookPagesToSave;
      // Keep existing coverColor or update if necessary (e.g., if cover image removed)
      if (!hasCoverImage && !appState.books[bookIndex].coverColor) {
          appState.books[bookIndex].coverColor = window.ui?.getRandomColorUI() || '#CCCCCC';
      }
    } else {
      console.error("CRITICAL: Failed to find book to edit with ID:", appState.editingBookId);
      alert("Error: Could not find the book to update. Please try refreshing.");
      return;
    }
  } else {
    // Creating a new book
    const newBook = {
      id: 'book-' + Date.now() + '-' + Math.random().toString(36).substring(2, 11), // Slightly longer random part
      title: bookTitle,
      pages: bookPagesToSave,
      coverColor: window.ui?.getRandomColorUI() || '#CCCCCC' // Assign a random cover color
    };
    appState.books.push(newBook);
  }

  saveState();
  renderBooksGrid(); // Re-render the book list on the main page
  if (window.ui && typeof window.ui.hideBookCreationModalUI === 'function') {
    window.ui.hideBookCreationModalUI({ id: appState.editingBookId } /* editingBookIdRef */);
  }
  appState.editingBookId = null; // Reset editing state
  // Reset currentBookToCreate to avoid carrying over data to the next "Add Book" action
  appState.currentBookToCreate = { title: '', pages: [{ content: '', coverImageUrl: '' }] };
}


/* -------------------- BOOK LIST ACTIONS (from grid) -------------------- */
/**
 * Initializes the book creation modal for editing an existing book.
 * @param {string} bookId - The ID of the book to edit.
 */
function handleStartEditBook(bookId) {
  const bookToEdit = appState.books.find(b => b.id === bookId);
  if (!bookToEdit) {
    console.error("Book not found for editing with ID:", bookId);
    alert("Error: Could not find the specified book to edit. It might have been deleted.");
    return;
  }

  appState.editingBookId = bookId;
  // Deep copy the book data for editing to prevent modifying original state until save
  appState.currentBookToCreate = JSON.parse(JSON.stringify(bookToEdit));
  
  // Ensure pages array exists and has at least a cover page
  if (!Array.isArray(appState.currentBookToCreate.pages) || appState.currentBookToCreate.pages.length === 0) {
      console.warn(`Book "${bookToEdit.title}" is being edited but has invalid pages. Resetting to a default cover.`);
      appState.currentBookToCreate.pages = [{ content: bookToEdit.title || 'Cover', coverImageUrl: '' }];
  }
  appState.currentPageEditorIndex = 0; // Start editing at the cover page

  if (window.ui && typeof window.ui.showBookCreationModalUI === 'function') {
    window.ui.showBookCreationModalUI(bookToEdit, appState.currentBookToCreate, { id: bookId } /* editingBookIdRef */);
    const numPagesInp = window.ui.getElement('num-pages-input');
    if (numPagesInp) numPagesInp.disabled = false; // Allow changing page count even when editing
    injectJsonUploader(); // Add JSON upload option to the modal
  }
}

/**
 * Handles deleting a book from the library.
 * @param {string} bookId - The ID of the book to delete.
 */
function handleDeleteBook(bookId) {
  const bookToDelete = appState.books.find(b => b.id === bookId);
  if (!bookToDelete) {
    alert("Cannot delete book: Book not found.");
    return;
  }

  if (!confirm(`Are you sure you want to permanently delete the book "${bookToDelete.title}"? This action cannot be undone.`)) {
    return;
  }
  appState.books = appState.books.filter(b => b.id !== bookId);
  saveState();
  renderBooksGrid(); // Update the displayed book list
}

/* ------------------------- READER LOGIC ------------------------------ */
/**
 * Opens a book in the reader view.
 * @param {Book} book - The book object to open.
 * @param {HTMLElement} coverElement - The DOM element of the book cover (for animation).
 */
function openBook(book, coverElement) {
  if (!book || !Array.isArray(book.pages) || book.pages.length === 0) {
    console.error("Cannot open book: Book data is invalid or has no pages.", book);
    alert("This book cannot be opened as it appears to be empty or corrupted.");
    return;
  }
  appState.currentOpenBook = book;
  appState.isCoverViewActive = true; // Always start by showing the cover
  appState.currentOpenBookPageIndex = 0; // Index for the pages array (0 is cover)

  if (window.ui && typeof window.ui.openBookUI === 'function') {
    // Pass a callback to render the initial pages once the open animation completes
    window.ui.openBookUI(book, coverElement, renderCurrentPagesInReader);
  } else {
    console.error("UI function openBookUI is not available to open the book.");
  }
}

/**
 * Renders the current page(s) in the open book reader.
 */
function renderCurrentPagesInReader() {
  if (!appState.currentOpenBook) {
    console.warn("renderCurrentPagesInReader called but no book is currently open.");
    return;
  }
  if (window.ui && typeof window.ui.renderCurrentPagesUI === 'function') {
    window.ui.renderCurrentPagesUI(
        appState.currentOpenBook,
        appState.currentOpenBookPageIndex,
        appState.isCoverViewActive,
        window.ui.convertMarkdownToHTMLUI // Pass the markdown converter from ui.js
    );
  } else {
    console.error("UI function renderCurrentPagesUI is not available.");
  }
}

/**
 * Navigates pages in the book reader (turns pages).
 * @param {number} amount - Number of pages to turn. Positive for next, negative for previous.
 * Typically +2 or -2 for spreads.
 */
function navigateReaderPage(amount) {
  if (!appState.currentOpenBook) return;

  const totalPagesInBook = appState.currentOpenBook.pages.length;

  if (appState.isCoverViewActive) {
    // Currently viewing the cover (page 0)
    if (amount > 0 && totalPagesInBook > 1) { // Moving from cover to first spread
      appState.isCoverViewActive = false;
      appState.currentOpenBookPageIndex = 1; // Actual page 1 (left page of first content spread)
    }
    // No action if amount < 0 from cover (already at the beginning)
  } else {
    // Currently viewing a spread
    let newPageIndex = appState.currentOpenBookPageIndex + amount;

    if (newPageIndex <= 0) { // Turning back, potentially to cover
      appState.isCoverViewActive = true;
      appState.currentOpenBookPageIndex = 0; // Show cover
    } else if (newPageIndex >= totalPagesInBook) {
      // At the end or trying to go past it.
      // Allow turning to the very last page if it's a right page of a spread.
      // If newPageIndex points to the last page, and it's a right page, that's okay.
      // If currentOpenBookPageIndex is already showing the last page(s), no change.
      // This logic means we don't go "beyond" the book.
      // The renderCurrentPagesUI will handle displaying "End of Book".
      if (amount > 0 && appState.currentOpenBookPageIndex < totalPagesInBook -1) {
          // If there's at least one more page to show as a right page or start of new spread
          appState.currentOpenBookPageIndex = Math.min(newPageIndex, totalPagesInBook -1);
          // Ensure it's an odd index for left page, unless it's the very last page alone
          if (appState.currentOpenBookPageIndex % 2 === 0 && appState.currentOpenBookPageIndex < totalPagesInBook -1) {
             // landed on an even page that should be a right page, adjust if not last page
          } else if (appState.currentOpenBookPageIndex % 2 === 0 && appState.currentOpenBookPageIndex === totalPagesInBook -1) {
            // Last page is an even index (e.g. page 2 of a 2-page book after cover)
            // This means it's a single page on the right. The currentOpenBookPageIndex should be its preceding odd index.
             appState.currentOpenBookPageIndex = Math.max(1, totalPagesInBook - 2); // Show the spread containing the last page
          }


      } else {
          return; // No change if trying to go past the end from the last spread
      }


    } else {
       appState.currentOpenBookPageIndex = newPageIndex;
    }

    // Ensure page index for spreads is always odd (points to left page of spread)
    // and at least 1 (since 0 is cover).
    if (!appState.isCoverViewActive) {
        if (appState.currentOpenBookPageIndex % 2 === 0) { // If landed on an even (right) page index
            appState.currentOpenBookPageIndex -= 1; // Adjust to the preceding odd (left) page index
        }
        appState.currentOpenBookPageIndex = Math.max(1, appState.currentOpenBookPageIndex);
    }
  }
  renderCurrentPagesInReader();
}

/**
 * Closes the book reader and returns to the library view.
 */
function closeBookReader() {
  if (window.ui && typeof window.ui.closeBookUI === 'function') {
    window.ui.closeBookUI();
  }
  appState.currentOpenBook = null;
  appState.isCoverViewActive = false;
  appState.currentOpenBookPageIndex = 0;
  // No need to saveState() here as reader state is transient.
}

/* ----------------- GLOBAL KEYDOWN HANDLERS -------------------- */
/**
 * Handles global keydown events (Escape key, Arrow keys for reader).
 * @param {KeyboardEvent} event - The keydown event.
 */
function handleGlobalKeydown(event) {
  if (!window.ui || !window.ui.getElement) return;

  const isReaderOpen = bookReaderContainerEl && !bookReaderContainerEl.classList.contains('hidden');
  const isModalOpen  = bookCreationModalEl && !bookCreationModalEl.classList.contains('hidden');

  if (isReaderOpen) {
    if (event.key === 'ArrowLeft')  navigateReaderPage(-2); // Go back a spread
    if (event.key === 'ArrowRight') navigateReaderPage(2);  // Go forward a spread
    if (event.key === 'Escape')     closeBookReader();
  }
  
  if (isModalOpen && event.key === 'Escape') {
    if (window.ui && typeof window.ui.hideBookCreationModalUI === 'function') {
      // Pass the editingBookIdRef for ui.js to potentially use/reset
      window.ui.hideBookCreationModalUI({ id: appState.editingBookId });
    }
  }
}

/* --------------- PROFILE / LIBRARY TEXT EDIT PROMPTS -------------------- */
/**
 * Saves the username entered in the initial prompt.
 */
function handleSaveUsername() {
  if (!usernameInputEl) return;
  const name = usernameInputEl.value.trim();
  if (!name) {
    alert('Please enter your name to continue.');
    usernameInputEl.focus();
    return;
  }
  appState.userName = name;
  saveState();
  if (window.ui && typeof window.ui.renderUI === 'function') {
    window.ui.renderUI(appState, renderBooksGrid); // Re-render main UI
  }
}

/**
 * Handles changing the username via a prompt.
 */
function handleChangeUsername() {
  const newName = prompt('Enter your new name:', appState.userName);
  if (newName === null) return; // User cancelled

  if (newName.trim()) {
    appState.userName = newName.trim();
    saveState();
    if (window.ui && typeof window.ui.renderUI === 'function') {
      window.ui.renderUI(appState, renderBooksGrid);
    }
  } else {
    alert("Name cannot be empty. Your current name has been kept.");
  }
}

/**
 * Handles changing the library title via a prompt.
 */
function handleChangeLibraryTitle() {
  const newTitle = prompt('Enter the new library name:', appState.libraryTitle);
  if (newTitle === null) return; // User cancelled

  if (newTitle.trim()) {
    appState.libraryTitle = newTitle.trim();
    saveState();
    if (window.ui && typeof window.ui.renderUI === 'function') {
      window.ui.renderUI(appState, renderBooksGrid);
    }
  } else {
    alert("Library name cannot be empty. The current title has been kept.");
  }
}

/**
 * Handles changing the custom welcome message via a prompt.
 */
function handleChangeCustomWelcomeMessage() {
  const newMessage = prompt('Enter your custom welcome message (e.g., "My Awesome"):', appState.customWelcomeMessage);
  if (newMessage === null) return; // User cancelled

  // Allow empty message if user desires to remove it
  appState.customWelcomeMessage = newMessage.trim(); 
  saveState();
  if (window.ui && typeof window.ui.renderUI === 'function') {
    window.ui.renderUI(appState, renderBooksGrid);
  }
}
