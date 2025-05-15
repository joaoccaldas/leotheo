// Lulu's Library - script.js (Updated JSON Upload in Modal & Bug Fixes)

// --- DOM Elements ---
const saveUsernameBtnEl = document.getElementById('save-username-btn');
const usernameInputEl = document.getElementById('username-input');
const changeUsernameBtnEl = document.getElementById('change-username-btn');
const editPageTitleBtnEl = document.getElementById('edit-page-title-btn');
const editCustomWelcomeBtnEl = document.getElementById('edit-custom-welcome-btn');
const themeToggleBtnEl = document.getElementById('theme-toggle-btn');
const addBookBtnEl = document.getElementById('add-book-btn');
const cancelCreationBtnEl = document.getElementById('cancel-creation-btn');
const nextStepBtnEl = document.getElementById('next-step-btn');
const backToStep1BtnEl = document.getElementById('back-to-step1-btn');
const saveBookBtnEl = document.getElementById('save-book-btn');
const prevPageEditorBtnEl = document.getElementById('prev-page-editor-btn');
const nextPageEditorBtnEl = document.getElementById('next-page-editor-btn');
const closeBookBtnEl = document.getElementById('close-book-btn');
const turnPrevBtnEl = document.getElementById('turn-prev');
const turnNextBtnEl = document.getElementById('turn-next');

// --- State ---
let appState = {
    userName: '',
    libraryTitle: "Lulu's Library",
    customWelcomeMessage: "Welcome to",
    currentTheme: 'normal',
    books: [],
    currentBookToCreate: { title: '', pages: [] },
    currentPageEditorIndex: 0,
    editingBookId: null,
    currentOpenBook: null,
    currentOpenBookPageIndex: 0,
    isCoverViewActive: false,
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    if (typeof window.ui === 'undefined' || typeof window.ui.getElement !== 'function') {
        console.error("FATAL: ui.js did not load or define window.ui correctly.");
        document.body.innerHTML = '<div style="color:red; text-align:center;">Application Error. Please refresh.</div>';
        return;
    }
    loadState();
    window.ui.applyThemeUI(appState.currentTheme);
    window.ui.renderUI(appState, renderBooksGrid);
    attachEventListeners();
});

// --- Local Storage ---
function loadState() {
    try {
        const stored = localStorage.getItem('webBookAppData');
        if (stored) {
            const data = JSON.parse(stored);
            Object.assign(appState, {
                userName: data.userName || appState.userName,
                libraryTitle: data.libraryTitle || appState.libraryTitle,
                customWelcomeMessage: data.customWelcomeMessage || appState.customWelcomeMessage,
                currentTheme: data.currentTheme || appState.currentTheme,
                books: data.books || appState.books
            });
        }
    } catch (e) {
        console.error("Error loading state:", e);
    }
    // Reset transient
    appState.currentBookToCreate = { title: '', pages: [] };
    appState.currentPageEditorIndex = 0;
    appState.editingBookId = null;
    appState.currentOpenBook = null;
    appState.currentOpenBookPageIndex = 0;
    appState.isCoverViewActive = false;
}

function saveState() {
    try {
        const persistent = {
            userName: appState.userName,
            libraryTitle: appState.libraryTitle,
            customWelcomeMessage: appState.customWelcomeMessage,
            currentTheme: appState.currentTheme,
            books: appState.books
        };
        localStorage.setItem('webBookAppData', JSON.stringify(persistent));
    } catch (e) {
        console.error("Error saving state:", e);
    }
}

// --- Theme ---
function toggleTheme() {
    appState.currentTheme = appState.currentTheme === 'normal' ? 'caldas' : 'normal';
    window.ui.applyThemeUI(appState.currentTheme);
    saveState();
}

// --- Render ---
function renderBooksGrid() {
    window.ui.renderBooksGridUI(
        appState.books,
        appState.userName,
        appState.currentTheme,
        openBook,
        handleStartEditBook,
        handleDeleteBook
    );
}

// --- JSON-in-Modal ---
function injectJsonUploaderInModal() {
    const step1El = window.ui.getElement('modal-step-1');
    if (!step1El || step1El.querySelector('#json-upload-input')) return;
    const div = document.createElement('div');
    div.className = 'mb-4';
    const label = document.createElement('label');
    label.htmlFor = 'json-upload-input';
    label.textContent = 'Upload JSON:';
    const input = document.createElement('input');
    input.type = 'file';
    input.id = 'json-upload-input';
    input.accept = 'application/json';
    div.append(label, input);
    step1El.insertBefore(div, step1El.firstChild);
    input.addEventListener('change', handleJsonUpload);
}

function handleJsonUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
        try {
            const data = JSON.parse(reader.result);
            if (!data.title || !Array.isArray(data.pages)) throw new Error('Invalid JSON structure');
            // Populate modal inputs and state
            appState.currentBookToCreate.title = data.title;
            appState.currentBookToCreate.pages = data.pages.map((p, i) => ({
                content: p.content || '',
                ...(i === 0 && { coverImageUrl: p.coverImageUrl || '' })
            }));
            appState.currentPageEditorIndex = 0;
            // Update UI fields in Step 1
            const titleInp = window.ui.getElement('book-title-input');
            const numInp = window.ui.getElement('num-pages-input');
            if (titleInp) titleInp.value = data.title;
            if (numInp) numInp.value = data.pages.length;
        } catch (err) {
            alert('Failed to load JSON: ' + err.message);
        }
    };
    reader.readAsText(file);
}

// --- Listeners ---
function attachEventListeners() {
    saveUsernameBtnEl?.addEventListener('click', handleSaveUsername);
    usernameInputEl?.addEventListener('keypress', e => e.key === 'Enter' && handleSaveUsername());
    changeUsernameBtnEl?.addEventListener('click', handleChangeUsername);
    editPageTitleBtnEl?.addEventListener('click', handleChangeLibraryTitle);
    editCustomWelcomeBtnEl?.addEventListener('click', handleChangeCustomWelcomeMessage);
    themeToggleBtnEl?.addEventListener('click', toggleTheme);
    addBookBtnEl?.addEventListener('click', () => {
        appState.editingBookId = null;
        appState.currentBookToCreate = { title: '', pages: [{ content: '', coverImageUrl: '' }] };
        appState.currentPageEditorIndex = 0;
        window.ui.showBookCreationModalUI(null, appState.currentBookToCreate, { id: null });
        window.ui.getElement('num-pages-input').disabled = false;
        injectJsonUploaderInModal();
    });
    cancelCreationBtnEl?.addEventListener('click', () => window.ui.hideBookCreationModalUI({ id: appState.editingBookId }));
    nextStepBtnEl?.addEventListener('click', handleModalNextStep);
    backToStep1BtnEl?.addEventListener('click', handleModalBackToStep1);
    saveBookBtnEl?.addEventListener('click', handleSaveBook);
    prevPageEditorBtnEl?.addEventListener('click', () => changeEditorPage(-1));
    nextPageEditorBtnEl?.addEventListener('click', () => changeEditorPage(1));
    closeBookBtnEl?.addEventListener('click', closeBook);
    turnPrevBtnEl?.addEventListener('click', () => turnPage(-2));
    turnNextBtnEl?.addEventListener('click', () => turnPage(2));
    document.addEventListener('keydown', handleGlobalKeydown);
}

// --- Modal Logic ---
function handleModalNextStep() {
    const titleInp = window.ui.getElement('book-title-input');
    const numInp = window.ui.getElement('num-pages-input');
    if (!titleInp || !numInp) return;
    const title = titleInp.value.trim();
    const numPages = parseInt(numInp.value, 10);
    if (!title) { alert('Enter a title'); return; }
    if (isNaN(numPages) || numPages < 1) { alert('Invalid page count'); return; }
    appState.currentBookToCreate.title = title;
    // Adjust pages count based on state.pages
    const pages = appState.currentBookToCreate.pages;
    if (pages.length < numPages) {
        for (let i = pages.length; i < numPages; i++) pages.push({ content: '', coverImageUrl: '' });
    } else if (pages.length > numPages) {
        pages.splice(numPages);
    }
    // Switch to content step
    window.ui.getElement('modal-step-1').classList.add('hidden');
    window.ui.getElement('modal-step-2').classList.remove('hidden');
    appState.currentPageEditorIndex = 0;
    window.ui.renderPageContentInputsUI(appState.currentBookToCreate, appState.currentPageEditorIndex, attachDynamicModalListeners);
}

function handleModalBackToStep1() {
    _saveCurrentPageContentFromModal();
    window.ui.getElement('modal-step-2').classList.add('hidden');
    window.ui.getElement('modal-step-1').classList.remove('hidden');
}

function changeEditorPage(dir) {
    _saveCurrentPageContentFromModal();
    const total = appState.currentBookToCreate.pages.length;
    appState.currentPageEditorIndex = Math.min(Math.max(appState.currentPageEditorIndex + dir, 0), total - 1);
    window.ui.renderPageContentInputsUI(appState.currentBookToCreate, appState.currentPageEditorIndex, attachDynamicModalListeners);
}

function _saveCurrentPageContentFromModal() {
    const ta = document.getElementById(`page-content-${appState.currentPageEditorIndex}`);
    if (ta) appState.currentBookToCreate.pages[appState.currentPageEditorIndex].content = ta.value;
    if (appState.currentPageEditorIndex === 0) {
        const coverInp = document.getElementById('cover-image-url-input');
        if (coverInp) appState.currentBookToCreate.pages[0].coverImageUrl = coverInp.value.trim();
    }
}

function attachDynamicModalListeners() {
    const ta = document.getElementById(`page-content-${appState.currentPageEditorIndex}`);
    if (ta) ta.addEventListener('input', e => appState.currentBookToCreate.pages[appState.currentPageEditorIndex].content = e.target.value);
    const delBtn = document.getElementById('delete-page-btn-modal');
    if (delBtn) delBtn.addEventListener('click', handleDeletePage);
}

function handleSaveBook() {
    _saveCurrentPageContentFromModal();
    const cover = appState.currentBookToCreate.pages[0];
    if (!cover.content.trim() && !cover.coverImageUrl) {
        alert('Cover needs content or image');
        return;
    }
    if (appState.editingBookId) {
        const idx = appState.books.findIndex(b => b.id === appState.editingBookId);
        if (idx > -1) {
            appState.books[idx] = { ...appState.books[idx], title: appState.currentBookToCreate.title, pages: JSON.parse(JSON.stringify(appState.currentBookToCreate.pages)) };
        }
    } else {
        appState.books.push({
            id: 'book-' + Date.now(),
            title: appState.currentBookToCreate.title,
            pages: JSON.parse(JSON.stringify(appState.currentBookToCreate.pages)),
            coverColor: window.ui.getRandomColorUI()
        });
    }
    saveState();
    renderBooksGrid();
    window.ui.hideBookCreationModalUI({ id: appState.editingBookId });
}

function handleDeletePage() {
    if (appState.currentBookToCreate.pages.length <= 1) { alert('Cannot delete last page'); return; }
    if (confirm('Delete this page?')) {
        appState.currentBookToCreate.pages.splice(appState.currentPageEditorIndex, 1);
        appState.currentPageEditorIndex = Math.max(0, appState.currentPageEditorIndex - 1);
        window.ui.renderPageContentInputsUI(appState.currentBookToCreate, appState.currentPageEditorIndex, attachDynamicModalListeners);
        const numInp = window.ui.getElement('num-pages-input');
        if (numInp) numInp.value = appState.currentBookToCreate.pages.length;
    }
}

// --- Book Actions ---
function handleStartEditBook(bookId) {
    const book = appState.books.find(b => b.id === bookId);
    if (!book) return;
    appState.editingBookId = bookId;
    appState.currentBookToCreate = JSON.parse(JSON.stringify(book));
    appState.currentPageEditorIndex = 0;
    window.ui.showBookCreationModalUI(book, appState.currentBookToCreate, { id: bookId });
    window.ui.getElement('num-pages-input').disabled = false;
    injectJsonUploaderInModal();
}

function handleDeleteBook(bookId) {
    if (confirm('Delete this book?')) {
        appState.books = appState.books.filter(b => b.id !== bookId);
        saveState();
        renderBooksGrid();
    }
}

// --- Reader ---
function openBook(book, coverEl) {
    appState.currentOpenBook = book;
    appState.isCoverViewActive = true;
    appState.currentOpenBookPageIndex = 0;
    window.ui.openBookUI(book, coverEl, renderCurrentPagesInReader);
}

function renderCurrentPagesInReader() {
    window.ui.renderCurrentPagesUI(
        appState.currentOpenBook,
        appState.currentOpenBookPageIndex,
        appState.isCoverViewActive,
        window.ui.convertMarkdownToHTMLUI
    );
}

function turnPage(amount) {
    if (!appState.currentOpenBook) return;
    const total = appState.currentOpenBook.pages.length;
    if (appState.isCoverViewActive && amount > 0) appState.isCoverViewActive = false;
    else if (!appState.isCoverViewActive) {
        if (amount > 0 && appState.currentOpenBookPageIndex + 2 < total) appState.currentOpenBookPageIndex += 2;
        else if (amount < 0) {
            if (appState.currentOpenBookPageIndex === 0) appState.isCoverViewActive = true;
            else appState.currentOpenBookPageIndex -= 2;
        }
    }
    renderCurrentPagesInReader();
}

function closeBook() {
    window.ui.closeBookUI();
    appState.currentOpenBook = null;
    appState.isCoverViewActive = false;
    appState.currentOpenBookPageIndex = 0;
}

// --- User & Global ---
function handleGlobalKeydown(e) {
    const reader = window.ui.getElement('book-reader-container');
    const modal = window.ui.getElement('book-creation-modal');
    if (reader && !reader.classList.contains('hidden')) {
        if (e.key === 'ArrowLeft') turnPage(-2);
        if (e.key === 'ArrowRight') turnPage(2);
        if (e.key === 'Escape') closeBook();
    }
    if (modal && !modal.classList.contains('hidden') && e.key === 'Escape') {
        window.ui.hideBookCreationModalUI({ id: appState.editingBookId });
    }
}

function handleSaveUsername() {
    const name = usernameInputEl.value.trim();
    if (!name) return alert('Enter your name');
    appState.userName = name;
    saveState();
    window.ui.renderUI(appState, renderBooksGrid);
}

function handleChangeUsername() {
    const newName = prompt('New name?', appState.userName);
    if (newName !== null && newName.trim()) {
        appState.userName = newName.trim();
        saveState();
        window.ui.renderUI(appState, renderBooksGrid);
    }
}

function handleChangeLibraryTitle() {
    const newTitle = prompt('Library name?', appState.libraryTitle);
    if (newTitle !== null && newTitle.trim()) {
        appState.libraryTitle = newTitle.trim();
        saveState();
        window.ui.renderUI(appState, renderBooksGrid);
    }
}

function handleChangeCustomWelcomeMessage() {
    const msg = prompt('Welcome message?', appState.customWelcomeMessage);
    if (msg !== null) {
        appState.customWelcomeMessage = msg.trim();
        saveState();
        window.ui.renderUI(appState, renderBooksGrid);
    }
}