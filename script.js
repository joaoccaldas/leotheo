// Lulu’s Library – script.js (FULL, cover-first, JSON starts after cover)
// ===================================================================
//  ▸ Works with ui.js (helper set intact)
//  ▸ Page 0 is always the cover; JSON pages begin at page 1
//  ▸ Leaving cover → first spread is pages 1–2 (index = 1)
//  ▸ JSON upload inserts an empty cover then parsed pages
// -------------------------------------------------------------------

/* -------------------- DOM ELEMENT REFERENCES --------------------- */
const $ = (id) => document.getElementById(id);
const saveUsernameBtnEl       = $('save-username-btn');
const usernameInputEl         = $('username-input');
const changeUsernameBtnEl     = $('change-username-btn');
const editPageTitleBtnEl      = $('edit-page-title-btn');
const editCustomWelcomeBtnEl  = $('edit-custom-welcome-btn');
const themeToggleBtnEl        = $('theme-toggle-btn');
const addBookBtnEl            = $('add-book-btn');
const cancelCreationBtnEl     = $('cancel-creation-btn');
const nextStepBtnEl           = $('next-step-btn');
const backToStep1BtnEl        = $('back-to-step1-btn');
const saveBookBtnEl           = $('save-book-btn');
const prevPageEditorBtnEl     = $('prev-page-editor-btn');
const nextPageEditorBtnEl     = $('next-page-editor-btn');
const closeBookBtnEl          = $('close-book-btn');
const turnPrevBtnEl           = $('turn-prev');
const turnNextBtnEl           = $('turn-next');

/* --------------------------- APP STATE --------------------------- */
let appState = {
  userName: '',
  libraryTitle: "Lulu's Library",
  customWelcomeMessage: 'Welcome to',
  currentTheme: 'normal',
  books: [],
  // modal-only scratch
  currentBookToCreate: { title: '', pages: [] },
  currentPageEditorIndex: 0,
  editingBookId: null,
  // reader-only state
  currentOpenBook: null,
  currentOpenBookPageIndex: 0, // 0 = cover, 1 = first left page
  isCoverViewActive: false,
};

/* ------------------------------ INIT ----------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  if (!window.ui || typeof window.ui.showBookCreationModalUI !== 'function') {
    return alert('ui.js failed to load.');
  }
  loadState();
  window.ui.applyThemeUI(appState.currentTheme);
  window.ui.renderUI(appState, renderBooksGrid);
  attachEventListeners();
});

/* --------------------------- PERSISTENCE ------------------------- */
function loadState() {
  try {
    const raw = localStorage.getItem('webBookAppData');
    if (!raw) return;
    const data = JSON.parse(raw);
    Object.assign(appState, {
      userName:              data.userName              ?? appState.userName,
      libraryTitle:          data.libraryTitle          ?? appState.libraryTitle,
      customWelcomeMessage:  data.customWelcomeMessage  ?? appState.customWelcomeMessage,
      currentTheme:          data.currentTheme          ?? appState.currentTheme,
      books:                 data.books                 ?? appState.books,
    });
  } catch (err) {
    console.error('Bad saved data', err);
  }
}
function saveState() {
  const { userName, libraryTitle, customWelcomeMessage, currentTheme, books } = appState;
  localStorage.setItem('webBookAppData', JSON.stringify({ userName, libraryTitle, customWelcomeMessage, currentTheme, books }));
}

/* ----------------------------- THEME ----------------------------- */
function toggleTheme() {
  appState.currentTheme = appState.currentTheme === 'normal' ? 'caldas' : 'normal';
  window.ui.applyThemeUI(appState.currentTheme);
  saveState();
}

/* --------------------------- LANDING GRID ----------------------- */
function renderBooksGrid() {
  window.ui.renderBooksGridUI(appState.books, appState.userName, appState.currentTheme, openBook, handleStartEditBook, handleDeleteBook);
}

/* ----------------------- JSON UPLOAD (MODAL) -------------------- */
function injectJsonUploader() {
  const step1 = window.ui.getElement('modal-step-1');
  if (!step1 || step1.querySelector('#json-upload-input')) return;
  const wrapper = document.createElement('div');
  wrapper.className = 'mb-4';
  wrapper.innerHTML = `<label for="json-upload-input" class="mr-2">Upload JSON:</label><input type="file" id="json-upload-input" accept="application/json" class="border p-1"/>`;
  step1.insertBefore(wrapper, step1.firstChild);
  wrapper.querySelector('input').addEventListener('change', handleJsonUpload);
}
function handleJsonUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  const fr = new FileReader();
  fr.onload = () => {
    try {
      const data = JSON.parse(fr.result);
      if (!data.title || !Array.isArray(data.pages)) throw new Error('Invalid JSON');
      // insert blank cover first
      appState.currentBookToCreate.title = data.title;
      appState.currentBookToCreate.pages = [ { content:'', coverImageUrl:'' }, ...data.pages.map(p => ({ content: p.content || '' })) ];
      appState.currentPageEditorIndex = 0;
      // reflect in UI fields
      window.ui.getElement('book-title-input').value = data.title;
      window.ui.getElement('num-pages-input').value = appState.currentBookToCreate.pages.length; // includes cover
    } catch (err) {
      alert('JSON error: ' + err.message);
    }
  };
  fr.readAsText(file);
}

/* ----------------------- EVENT LISTENERS ----------------------- */
function attachEventListeners() {
  // profile / theme
  saveUsernameBtnEl?.addEventListener('click', handleSaveUsername);
  usernameInputEl?.addEventListener('keypress', (e) => e.key==='Enter' && handleSaveUsername());
  changeUsernameBtnEl?.addEventListener('click', handleChangeUsername);
  editPageTitleBtnEl?.addEventListener('click', handleChangeLibraryTitle);
  editCustomWelcomeBtnEl?.addEventListener('click', handleChangeCustomWelcomeMessage);
  themeToggleBtnEl?.addEventListener('click', toggleTheme);

  // new book
  addBookBtnEl?.addEventListener('click', () => {
    appState.editingBookId = null;
    appState.currentBookToCreate = { title:'', pages:[{content:'',coverImageUrl:''}] }; // cover only
    appState.currentPageEditorIndex = 0;
    window.ui.showBookCreationModalUI(null, appState.currentBookToCreate, {id:null});
    window.ui.getElement('num-pages-input').disabled = false;
    injectJsonUploader();
  });

  // modal nav
  cancelCreationBtnEl?.addEventListener('click', () => window.ui.hideBookCreationModalUI({id:appState.editingBookId}));
  nextStepBtnEl?.addEventListener('click', handleModalNextStep);
  backToStep1BtnEl?.addEventListener('click', handleModalBackToStep1);
  saveBookBtnEl?.addEventListener('click', handleSaveBook);
  prevPageEditorBtnEl?.addEventListener('click', () => changeEditorPage(-1));
  nextPageEditorBtnEl?.addEventListener('click', () => changeEditorPage(1));

  // reader
  closeBookBtnEl?.addEventListener('click', closeBook);
  turnPrevBtnEl?.addEventListener('click', () => turnPage(-2));
  turnNextBtnEl?.addEventListener('click', () => turnPage(2));

  document.addEventListener('keydown', handleGlobalKeydown);
}

/* ------------------- MODAL: STEP LOGIC & EDITORS ----------------- */
function handleModalNextStep() {
  const titleInp = window.ui.getElement('book-title-input');
  const numInp   = window.ui.getElement('num-pages-input');
  if (!titleInp || !numInp) return;
  const title = titleInp.value.trim();
  let num   = parseInt(numInp.value,10);
  if (!title) return alert('Enter a title');
  if (isNaN(num) || num<1) return alert('Invalid page count');

  // ensure pages array matches requested length
  const pages = appState.currentBookToCreate.pages;
  if (pages.length < num) while (pages.length < num) pages.push({content:'', coverImageUrl:''});
  if (pages.length > num) pages.splice(num);

  appState.currentBookToCreate.title = title;
  window.ui.getElement('modal-step-1').classList.add('hidden');
  window.ui.getElement('modal-step-2').classList.remove('hidden');
  appState.currentPageEditorIndex = 0;
  window.ui.renderPageContentInputsUI(appState.currentBookToCreate, appState.currentPageEditorIndex, attachDynamicModalListeners);
}
function handleModalBackToStep1() {
  saveCurrentPageDraft();
  window.ui.getElement('modal-step-2').classList.add('hidden');
  window.ui.getElement('modal-step-1').classList.remove('hidden');
}
function changeEditorPage(delta) {
  saveCurrentPageDraft();
  const total = appState.currentBookToCreate.pages.length;
  appState.currentPageEditorIndex = Math.max(0, Math.min(total-1, appState.currentPageEditorIndex+delta));
  window.ui.renderPageContentInputsUI(appState.currentBookToCreate, appState.currentPageEditorIndex, attachDynamicModalListeners);
}
function saveCurrentPageDraft() {
  const ta = document.getElementById(`page-content-${appState.currentPageEditorIndex}`);
  if (ta) appState.currentBookToCreate.pages[appState.currentPageEditorIndex].content = ta.value;
  if (appState.currentPageEditorIndex===0) {
    const coverInp = $('cover-image-url-input');
    if (coverInp) appState.currentBookToCreate.pages[0].coverImageUrl = coverInp.value.trim();
  }
}
function attachDynamicModalListeners() {
  const ta = document.getElementById(`page-content-${appState.currentPageEditorIndex}`);
  ta?.addEventListener('input', e => appState.currentBookToCreate.pages[appState.currentPageEditorIndex].content = e.target.value);
  $('delete-page-btn-modal')?.addEventListener('click', handleDeletePage);
}
function handleDeletePage() {
  if (appState.currentPageEditorIndex===0) return alert('Cannot delete cover');
  if (appState.currentBookToCreate.pages.length<=2) return alert('Book must have at least cover + 1 page');
  if (!confirm('Delete this page?')) return;
  appState.currentBookToCreate.pages.splice(appState.currentPageEditorIndex,1);
  appState.currentPageEditorIndex = Math.max(1, appState.currentPageEditorIndex-1);
  window.ui.renderPageContentInputsUI(appState.currentBookToCreate, appState.currentPageEditorIndex, attachDynamicModalListeners);
  window.ui.getElement('num-pages-input').value = appState.currentBookToCreate.pages.length;
}
function handleSaveBook() {
  saveCurrentPageDraft();
  if (!appState.currentBookToCreate.pages.length) return alert('Book has no pages');
  const cover = appState.currentBookToCreate.pages[0];
  if (!cover.content.trim() && !cover.coverImageUrl) return alert('Cover needs content or image');

  if (appState.editingBookId) {
    const idx = appState.books.findIndex(b=>b.id===appState.editingBookId);
    if (idx>-1) appState.books[idx] = { ...appState.books[idx], title: appState.currentBookToCreate.title, pages: JSON.parse(JSON.stringify(appState.currentBookToCreate.pages)) };
  } else {
    appState.books.push({ id:'book-'+Date.now(), title:appState.currentBookToCreate.title, pages:JSON.parse(JSON.stringify(appState.currentBookToCreate.pages)), coverColor: window.ui.getRandomColorUI() });
  }
  saveState();
  renderBooksGrid();
  window.ui.hideBookCreationModalUI({id:appState.editingBookId});
}

/* -------------------- BOOK LIST ACTIONS ------------------------- */
function handleStartEditBook(bookId) {
  const book = appState.books.find(b=>b.id===bookId);
  if (!book) return;
  appState.editingBookId = bookId;
  appState.currentBookToCreate = JSON.parse(JSON.stringify(book));
  appState.currentPageEditorIndex = 0;
  window.ui.showBookCreationModalUI(book, appState.currentBookToCreate, {id:bookId});
  $('num-pages-input').disabled = false;
  injectJsonUploader();
}
function handleDeleteBook(bookId) {
  if (!confirm('Delete this book?')) return;
  appState.books = appState.books.filter(b=>b.id!==bookId);
  saveState();
  renderBooksGrid();
}

/* ------------------------- READER ------------------------------ */
function openBook(book, coverEl) {
  appState.currentOpenBook = book;
  appState.isCoverViewActive = true;
  appState.currentOpenBookPageIndex = 0;
  window.ui.openBookUI(book, coverEl, renderCurrentPagesInReader);
}
function renderCurrentPagesInReader() {
  window.ui.renderCurrentPagesUI(appState.currentOpenBook, appState.currentOpenBookPageIndex, appState.isCoverViewActive, window.ui.convertMarkdownToHTMLUI);
}
function turnPage(amount) {
  if (!appState.currentOpenBook) return;
  const total = appState.currentOpenBook.pages.length;
  if (appState.isCoverViewActive && amount>0) {
    appState.isCoverViewActive = false;
    appState.currentOpenBookPageIndex = 1; // first spread starts at page 1
  } else if (!appState.isCoverViewActive) {
    if (amount>0 && appState.currentOpenBookPageIndex+2<total) {
      appState.currentOpenBookPageIndex += 2;
    } else if (amount<0) {
      if (appState.currentOpenBookPageIndex<=1) {
        appState.isCoverViewActive = true;
        appState.currentOpenBookPageIndex = 0;
      } else {
        appState.currentOpenBookPageIndex -= 2;
      }
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

/* ----------------- GLOBAL HANDLERS (ESC / arrows) --------------- */
function handleGlobalKeydown(e) {
  const readerOpen = !window.ui.getElement('book-reader').classList.contains('hidden');
  const modalOpen  = !window.ui.getElement('book-creation-modal').classList.contains('hidden');
  if (readerOpen) {
    if (e.key==='ArrowLeft')  turnPage(-2);
    if (e.key==='ArrowRight') turnPage(2);
    if (e.key==='Escape')     closeBook();
  }
  if (modalOpen && e.key==='Escape') window.ui.hideBookCreationModalUI({id:appState.editingBookId});
}

/* --------------- PROFILE / TEXT EDIT PROMPTS -------------------- */
function handleSaveUsername() {
  const name = usernameInputEl.value.trim();
  if (!name) return alert('Enter your name');
  appState.userName = name;
  saveState();
  window.ui.renderUI(appState, renderBooksGrid);
}
function handleChangeUsername() {
  const name = prompt('New name?', appState.userName);
  if (name!==null && name.trim()) {
    appState.userName = name.trim();
    saveState();
    window.ui.renderUI(appState, renderBooksGrid);
  }
}
function handleChangeLibraryTitle() {
  const title = prompt('Library name?', appState.libraryTitle);
  if (title!==null && title.trim()) {
    appState.libraryTitle = title.trim();
    saveState();
    window.ui.renderUI(appState, renderBooksGrid);
  }
}
function handleChangeCustomWelcomeMessage() {
  const msg = prompt('Welcome message?', appState.customWelcomeMessage);
  if (msg!==null) {
    appState.customWelcomeMessage = msg.trim();
    saveState();
    window.ui.renderUI(appState, renderBooksGrid);
  }
}
