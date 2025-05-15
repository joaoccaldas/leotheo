// Lulu's Library - ui.js (More Robust)

(function(window) {
    'use strict';

    // 1. Define window.ui object immediately.
    window.ui = {};

    // Helper to safely get elements
    // These helpers themselves don't rely on any DOM elements being present at definition time.
    function getElement(id) {
        const el = document.getElementById(id);
        if (!el) {
            console.warn(`UI_WARN: Element with ID '${id}' not found.`);
        }
        return el;
    }

    function querySelector(selector, parent = document) {
        const el = parent.querySelector(selector);
        if (!el) {
            console.warn(`UI_WARN: Element with selector '${selector}' not found in parent:`, parent);
        }
        return el;
    }

    // --- UI Rendering Functions ---
    // Now, attach functions to the pre-defined window.ui object.

    window.ui.applyThemeUI = function(currentTheme) {
        const bodyElement = document.body; // Get body when function is called
        if (!bodyElement) {
            console.error("UI_ERROR: document.body not found in applyThemeUI.");
            return;
        }
        bodyElement.classList.remove('normal-mode', 'caldas-mode');
        bodyElement.classList.add(currentTheme + '-mode');
        window.ui.updateThemeToggleButtonUI(currentTheme); // Call using window.ui
    };

    window.ui.updateThemeToggleButtonUI = function(currentTheme) {
        const iconEl = getElement('theme-toggle-icon');
        const textEl = getElement('theme-toggle-text');
        if (!iconEl || !textEl) return;

        if (currentTheme === 'caldas') {
            iconEl.textContent = '🎮';
            textEl.textContent = 'Caldas';
        } else {
            iconEl.textContent = '☀️';
            textEl.textContent = 'Normal';
        }
    };

    window.ui.renderUI = function(state, renderBooksGridFn) {
        const pageHtmlTitle = document.querySelector('title'); // Get when function is called
        const mainTitleEl = getElement('page-main-title');
        const customWelcomeEl = getElement('custom-welcome-message');
        const userPromptEl = getElement('username-prompt');
        const contentEl = getElement('main-content');
        const userTextEl = getElement('username-text');
        const changeUserBtnEl = getElement('change-username-btn');
        const editTitleBtnEl = getElement('edit-page-title-btn');
        const editWelcomeBtnEl = getElement('edit-custom-welcome-btn');
        const userDisplayContainerEl = getElement('username-display-container');
        const welcomeUserMsgEl = getElement('welcome-user-message');

        if (pageHtmlTitle) pageHtmlTitle.textContent = state.libraryTitle;
        if (mainTitleEl) mainTitleEl.textContent = state.libraryTitle;
        if (customWelcomeEl) customWelcomeEl.textContent = state.customWelcomeMessage;

        if (state.userName) {
            if (userPromptEl) userPromptEl.classList.add('hidden');
            if (contentEl) contentEl.classList.remove('hidden');
            if (userTextEl) userTextEl.textContent = `Hi, ${state.userName}!`;
            if (changeUserBtnEl) changeUserBtnEl.classList.remove('hidden');
            if (editTitleBtnEl) editTitleBtnEl.classList.remove('hidden');
            if (editWelcomeBtnEl) editWelcomeBtnEl.classList.remove('hidden');
            if (userDisplayContainerEl) userDisplayContainerEl.classList.remove('hidden');
            if (welcomeUserMsgEl) welcomeUserMsgEl.textContent = `Here are your creations, ${state.userName}:`;
            if (renderBooksGridFn) renderBooksGridFn(state.books, state.userName, state.currentTheme);
        } else {
            if (userPromptEl) userPromptEl.classList.remove('hidden');
            if (contentEl) contentEl.classList.add('hidden');
            if (changeUserBtnEl) changeUserBtnEl.classList.add('hidden');
            if (editTitleBtnEl) editTitleBtnEl.classList.add('hidden');
            if (editWelcomeBtnEl) editWelcomeBtnEl.classList.add('hidden');
            if (userDisplayContainerEl) userDisplayContainerEl.classList.add('hidden');
        }
    };

    window.ui.renderBooksGridUI = function(books, userName, currentTheme, openBookFn, editBookFn, deleteBookFn) {
        const gridEl = getElement('books-grid');
        const noBooksMsgEl = getElement('no-books-message');
        if (!gridEl || !noBooksMsgEl) return;

        gridEl.innerHTML = '';
        if (books.length === 0) {
            noBooksMsgEl.classList.remove('hidden');
            gridEl.classList.add('hidden');
            return;
        }
        noBooksMsgEl.classList.add('hidden');
        gridEl.classList.remove('hidden');

        books.forEach(book => {
            const bookItemContainer = document.createElement('div');
            bookItemContainer.classList.add('relative', 'group', 'book-cover-container');

            const coverDiv = document.createElement('div');
            coverDiv.classList.add('book-cover-item', 'rounded-lg', 'shadow-md', 'cursor-pointer', 'flex', 'flex-col', 'justify-end', 'items-center', 'h-64', 'aspect-[2/3]', 'bg-cover', 'bg-center', 'relative', 'overflow-hidden');

            const coverPageData = book.pages && book.pages[0];
            if (coverPageData && coverPageData.coverImageUrl) {
                coverDiv.style.backgroundImage = `url('${CSS.escape(coverPageData.coverImageUrl)}')`;
            } else {
                coverDiv.style.backgroundColor = book.coverColor || (currentTheme === 'caldas' ? '#3a3a5e' : window.ui.getRandomColorUI());
                coverDiv.style.backgroundImage = '';
            }

            const textContentWrapper = document.createElement('div');
            textContentWrapper.classList.add('relative', 'z-10', 'flex', 'flex-col', 'justify-end', 'items-center', 'w-full', 'p-2');

            const titleEl = document.createElement('h3');
            titleEl.classList.add('book-cover-title');
            titleEl.textContent = book.title;

            const authorEl = document.createElement('p');
            authorEl.classList.add('book-cover-author');
            authorEl.textContent = `By ${userName}`;

            textContentWrapper.appendChild(titleEl);
            textContentWrapper.appendChild(authorEl);
            coverDiv.appendChild(textContentWrapper);

            coverDiv.addEventListener('click', (e) => {
                if (e.target.closest('.book-action-btn')) return;
                if (openBookFn) openBookFn(book, coverDiv);
            });

            const actionsWrapper = document.createElement('div');
            actionsWrapper.classList.add('absolute', 'top-2', 'right-2', 'opacity-0', 'group-hover:opacity-100', 'transition-opacity', 'duration-200', 'flex', 'space-x-1', 'z-20');

            const editButton = document.createElement('button');
            editButton.innerHTML = '✏️';
            editButton.title = "Edit Book";
            editButton.classList.add('book-action-btn', 'p-2', 'bg-blue-500', 'text-white', 'rounded-md', 'hover:bg-blue-600', 'text-xs', 'shadow');
            editButton.addEventListener('click', (e) => { e.stopPropagation(); if (editBookFn) editBookFn(book.id); });

            const deleteButton = document.createElement('button');
            deleteButton.innerHTML = '🗑️';
            deleteButton.title = "Delete Book";
            deleteButton.classList.add('book-action-btn', 'p-2', 'bg-red-500', 'text-white', 'rounded-md', 'hover:bg-red-600', 'text-xs', 'shadow');
            deleteButton.addEventListener('click', (e) => { e.stopPropagation(); if (deleteBookFn) deleteBookFn(book.id); });

            actionsWrapper.appendChild(editButton);
            actionsWrapper.appendChild(deleteButton);
            bookItemContainer.appendChild(actionsWrapper);
            bookItemContainer.appendChild(coverDiv);
            gridEl.appendChild(bookItemContainer);
        });
    };

    window.ui.getRandomColorUI = function() {
        const letters = '789ABCD';
        let sixDigitColor = '#';
        for (let i = 0; i < 6; i++) {
            sixDigitColor += letters[Math.floor(Math.random() * letters.length)];
        }
        return sixDigitColor;
    };

    window.ui.showBookCreationModalUI = function(bookToEdit, currentBookData, editingBookIdRef) {
        const modalEl = getElement('book-creation-modal');
        const step1El = getElement('modal-step-1');
        const step2El = getElement('modal-step-2');
        const titleInputEl = getElement('book-title-input');
        const pagesInputEl = getElement('num-pages-input');
        const modalTitleEl = querySelector('#book-creation-modal #modal-step-1 h2');
        const saveBtnEl = getElement('save-book-btn');
        const coverImgUrlInputEl = getElement('cover-image-url-input');
        const coverImgContainerEl = getElement('cover-image-input-container');

        if (!modalEl || !step1El || !step2El || !titleInputEl || !pagesInputEl || !modalTitleEl || !saveBtnEl || !coverImgUrlInputEl || !coverImgContainerEl) {
            console.error("UI_ERROR: One or more critical elements for showBookCreationModalUI not found.");
            return;
        }

        editingBookIdRef.id = bookToEdit ? bookToEdit.id : null;

        if (bookToEdit) {
            currentBookData.title = bookToEdit.title;
            currentBookData.pages = JSON.parse(JSON.stringify(bookToEdit.pages || []));
            if (currentBookData.pages.length === 0) currentBookData.pages.push({ content: '', coverImageUrl: '' });

            titleInputEl.value = currentBookData.title;
            pagesInputEl.value = currentBookData.pages.length;
            pagesInputEl.disabled = true;
            modalTitleEl.textContent = "Edit Book";
            saveBtnEl.textContent = "Save Changes";
            coverImgUrlInputEl.value = (currentBookData.pages[0]) ? (currentBookData.pages[0].coverImageUrl || '') : '';
        } else {
            currentBookData.title = '';
            currentBookData.pages = [{ content: '', coverImageUrl: '' }];
            titleInputEl.value = '';
            pagesInputEl.value = '1';
            pagesInputEl.disabled = false;
            modalTitleEl.textContent = "Create New Book";
            saveBtnEl.textContent = "Save Book";
            coverImgUrlInputEl.value = '';
        }

        modalEl.classList.remove('hidden');
        modalEl.classList.add('flex');
        step1El.classList.remove('hidden');
        step2El.classList.add('hidden');
        coverImgContainerEl.classList.add('hidden');
    };

    window.ui.hideBookCreationModalUI = function(editingBookIdRef) {
        const modalEl = getElement('book-creation-modal');
        const pagesInputEl = getElement('num-pages-input');
        const modalTitleEl = querySelector('#book-creation-modal #modal-step-1 h2');
        const saveBtnEl = getElement('save-book-btn');
        if (!modalEl || !pagesInputEl || !modalTitleEl || !saveBtnEl) return;

        modalEl.classList.add('hidden');
        modalEl.classList.remove('flex');
        if (editingBookIdRef) editingBookIdRef.id = null; // Ensure ref is passed
        pagesInputEl.disabled = false;
        modalTitleEl.textContent = "Create New Book";
        saveBtnEl.textContent = "Save Book";
    };

    window.ui.renderPageContentInputsUI = function(currentBookData, currentPageEditorIndex, attachDynamicListenersFn) {
        const inputsContainerEl = getElement('page-content-inputs');
        const pageLabelEl = getElement('current-page-editor-label');
        const pageIndicatorEl = getElement('page-editor-indicator');
        const coverImgContainerEl = getElement('cover-image-input-container');
        const coverImgUrlInputEl = getElement('cover-image-url-input');
        const prevBtnEl = getElement('prev-page-editor-btn');
        const nextBtnEl = getElement('next-page-editor-btn');

        if (!inputsContainerEl || !pageLabelEl || !pageIndicatorEl || !coverImgContainerEl || !coverImgUrlInputEl || !prevBtnEl || !nextBtnEl) {
            console.error("UI_ERROR: One or more critical elements for renderPageContentInputsUI not found.");
            return;
        }

        inputsContainerEl.innerHTML = '';
        const numPagesTotal = currentBookData.pages.length;

        if (!currentBookData.pages[currentPageEditorIndex]) {
            currentBookData.pages[currentPageEditorIndex] = { content: '', ...(currentPageEditorIndex === 0 && { coverImageUrl: '' }) };
        }
        const pageData = currentBookData.pages[currentPageEditorIndex];

        const pageLabelText = currentPageEditorIndex === 0 ? `Page ${currentPageEditorIndex + 1} (Cover)` : `Page ${currentPageEditorIndex + 1}`;
        pageLabelEl.textContent = `Editing ${pageLabelText}`;
        pageIndicatorEl.textContent = `Page ${currentPageEditorIndex + 1} of ${numPagesTotal}`;

        if (currentPageEditorIndex === 0) {
            inputsContainerEl.appendChild(coverImgContainerEl);
            coverImgContainerEl.classList.remove('hidden');
            coverImgUrlInputEl.value = pageData.coverImageUrl || '';
        } else {
            coverImgContainerEl.classList.add('hidden');
        }

        const textarea = document.createElement('textarea');
        textarea.id = `page-content-${currentPageEditorIndex}`;
        textarea.rows = currentPageEditorIndex === 0 ? 6 : 10;
        textarea.classList.add('w-full', 'p-3', 'border', 'rounded-lg', 'shadow-sm', 'focus:ring-2', 'focus:border-accent', 'resize-none', 'mt-2', 'input-border', 'bg-input', 'text-input-text');
        textarea.placeholder = `Enter content for ${pageLabelText}...\nUse Markdown: **bold**, *italic*.\nOr HTML: <b>b</b>, <i>i</i>, <u>u</u>, <span style="font-size: PX; color: #HEX;">text</span>.`;
        textarea.value = pageData.content;
        inputsContainerEl.appendChild(textarea);
        textarea.focus();

        prevBtnEl.disabled = currentPageEditorIndex === 0;
        nextBtnEl.disabled = currentPageEditorIndex === numPagesTotal - 1;
        
        // Delete Page Button UI
        const modalStep2ButtonsContainer = querySelector('#modal-step-2 .flex.justify-end.space-x-3'); // Container for Save/Back
        if (modalStep2ButtonsContainer) {
            let deletePageBtn = getElement('delete-page-btn-modal');
            if (!deletePageBtn) {
                deletePageBtn = document.createElement('button');
                deletePageBtn.id = 'delete-page-btn-modal';
                deletePageBtn.textContent = 'Delete Page';
                deletePageBtn.classList.add('px-4', 'py-2', 'bg-red-600', 'text-white', 'font-medium', 'rounded-lg', 'hover:bg-red-700', 'transition', 'mr-auto'); // Use mr-auto to push to left
                // Insert before the "Back" button
                const backButtonModal = getElement('back-to-step1-btn');
                if (backButtonModal) {
                    modalStep2ButtonsContainer.insertBefore(deletePageBtn, backButtonModal);
                } else {
                    modalStep2ButtonsContainer.appendChild(deletePageBtn); // Fallback
                }
            }
            deletePageBtn.disabled = numPagesTotal <= 1;
            deletePageBtn.style.display = (numPagesTotal <= 1) ? 'none' : 'inline-block';
        }


        if (attachDynamicListenersFn) {
            attachDynamicListenersFn();
        }
    };

    window.ui.openBookUI = function(book, coverElement, renderCurrentPagesFn) {
        const bodyElement = document.body;
        const landingEl = getElement('landing-page');
        const addBtnEl = getElement('add-book-btn');
        const readerContainerEl = getElement('book-reader-container');
        const readerEl = getElement('book-reader');
        if (!bodyElement || !landingEl || !addBtnEl || !readerContainerEl || !readerEl) {
            console.error("UI_ERROR: One or more critical elements for openBookUI not found.");
            return;
        }

        const rect = coverElement.getBoundingClientRect();
        const clone = coverElement.cloneNode(true);
        const cloneActions = clone.querySelector('.absolute.top-2.right-2');
        if (cloneActions) cloneActions.remove();

        clone.classList.add('book-transition-clone');
        clone.style.width = `${rect.width}px`;
        clone.style.height = `${rect.height}px`;
        clone.style.top = `${rect.top}px`;
        clone.style.left = `${rect.left}px`;
        clone.style.backgroundImage = coverElement.style.backgroundImage;
        clone.style.backgroundColor = coverElement.style.backgroundColor;
        clone.style.backgroundSize = 'cover';
        clone.style.backgroundPosition = 'center';
        bodyElement.appendChild(clone);

        landingEl.style.opacity = '0';
        addBtnEl.style.display = 'none';

        setTimeout(() => {
            let targetWidth = Math.min(window.innerWidth * 0.9, 1200);
            let targetHeight = 700;
            if (readerEl.offsetWidth > 0 && readerEl.offsetHeight > 0) {
                targetWidth = readerEl.offsetWidth;
                targetHeight = readerEl.offsetHeight;
            }
            clone.style.width = `${targetWidth}px`;
            clone.style.height = `${targetHeight}px`;
            clone.style.top = `${(window.innerHeight - targetHeight) / 2}px`;
            clone.style.left = `${(window.innerWidth - targetWidth) / 2}px`;
            clone.style.transform = 'scale(1.05)';
        }, 50);

        setTimeout(() => {
            if (bodyElement.contains(clone)) bodyElement.removeChild(clone);
            readerContainerEl.classList.remove('hidden');
            readerContainerEl.classList.add('flex');
            readerEl.classList.remove('hidden');
            readerEl.style.opacity = '1';
            if (renderCurrentPagesFn) renderCurrentPagesFn();
            landingEl.classList.add('hidden');
        }, 750);
    };

    window.ui.renderCurrentPagesUI = function(currentOpenBook, currentOpenBookPageIndex, isCoverViewActive, convertMarkdownToHTMLFn) {
        const leftPageEl = getElement('left-page');
        const rightPageEl = getElement('right-page');
        if (!currentOpenBook || !leftPageEl || !rightPageEl || !convertMarkdownToHTMLFn) return;
        
        const leftPageContentEl = querySelector('.page-content', leftPageEl);
        const rightPageContentEl = querySelector('.page-content', rightPageEl);
        const turnPrevBtnEl = getElement('turn-prev');
        const turnNextBtnEl = getElement('turn-next');

        if (!leftPageContentEl || !rightPageContentEl || !turnPrevBtnEl || !turnNextBtnEl) return;

        const pages = currentOpenBook.pages;
        const numPagesTotal = pages.length;

        leftPageEl.style.backgroundImage = '';
        rightPageEl.style.backgroundImage = '';
        leftPageContentEl.classList.remove('cover-text-on-image-container');
        rightPageContentEl.classList.remove('cover-text-on-image-container');
        leftPageEl.classList.remove('hidden-page', 'full-width-page', 'half-width-page');
        rightPageEl.classList.remove('hidden-page', 'full-width-page', 'half-width-page');
        leftPageEl.classList.add('page-bg', 'page-text');
        rightPageEl.classList.add('page-bg', 'page-text');

        if (isCoverViewActive) {
            leftPageEl.classList.add('hidden-page');
            rightPageEl.classList.add('full-width-page');
            const coverData = pages[0];
            if (coverData) {
                if (coverData.coverImageUrl) {
                    rightPageEl.style.backgroundImage = `url('${CSS.escape(coverData.coverImageUrl)}')`;
                    rightPageContentEl.classList.add('cover-text-on-image-container');
                } else {
                     rightPageEl.style.backgroundImage = ''; // Explicitly clear if no image
                }
                rightPageContentEl.innerHTML = convertMarkdownToHTMLFn(coverData.content);
            } else {
                rightPageEl.style.backgroundImage = '';
                rightPageContentEl.innerHTML = '<div class="p-4 text-center italic">Cover not available.</div>';
            }
            leftPageContentEl.innerHTML = '';
            turnPrevBtnEl.style.display = 'none';
            turnNextBtnEl.style.display = numPagesTotal > 1 ? 'block' : 'none';
        } else {
            leftPageEl.classList.add('half-width-page');
            rightPageEl.classList.add('half-width-page');
            const leftPageData = pages[currentOpenBookPageIndex];
            leftPageEl.style.backgroundImage = ''; // No background for content pages
            if (leftPageData) {
                leftPageContentEl.innerHTML = convertMarkdownToHTMLFn(leftPageData.content);
            } else {
                leftPageContentEl.innerHTML = '';
            }
            const rightPageData = pages[currentOpenBookPageIndex + 1];
            rightPageEl.style.backgroundImage = ''; // No background for content pages
            if (rightPageData) {
                rightPageContentEl.innerHTML = convertMarkdownToHTMLFn(rightPageData.content);
            } else {
                rightPageContentEl.innerHTML = '<div class="p-4 text-center italic">End of Book</div>';
            }
            turnPrevBtnEl.style.display = 'block';
            turnNextBtnEl.style.display = (currentOpenBookPageIndex + 2) < numPagesTotal ? 'block' : 'none';
        }
        leftPageContentEl.scrollTop = 0;
        rightPageContentEl.scrollTop = 0;
    };

    window.ui.closeBookUI = function() {
        const readerEl = getElement('book-reader');
        const readerContainerEl = getElement('book-reader-container');
        const landingEl = getElement('landing-page');
        const addBtnEl = getElement('add-book-btn');
        const leftPageEl = getElement('left-page');
        const rightPageEl = getElement('right-page');

        if (!readerEl || !readerContainerEl || !landingEl || !addBtnEl || !leftPageEl || !rightPageEl) return;

        readerEl.style.opacity = '0';
        setTimeout(() => {
            readerContainerEl.classList.add('hidden');
            readerContainerEl.classList.remove('flex');
            readerEl.classList.add('hidden');
            leftPageEl.classList.remove('hidden-page', 'full-width-page', 'half-width-page');
            rightPageEl.classList.remove('hidden-page', 'full-width-page', 'half-width-page');
            landingEl.classList.remove('hidden');
            landingEl.style.opacity = '1';
            addBtnEl.style.display = 'flex';
        }, 500);
    };

    window.ui.convertMarkdownToHTMLUI = function(mdText) {
        if (typeof mdText !== 'string') return '';
        let html = mdText.trim();
        // Simpler Markdown: bold, italic
        html = html.replace(/\*\*(.*?)\*\*|__(.*?)__/g, '<strong>$1$2</strong>');
        html = html.replace(/\*(.*?)\*|_(.*?)_/g, '<em>$1$2</em>');

        // Preserve user-entered HTML tags by temporarily encoding them
        // This helps prevent them from being mangled by paragraph/newline logic
        const tempEncode = (str) => str.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const tempDecode = (str) => str.replace(/&lt;/g, '<').replace(/&gt;/g, '>');

        const tempEncodedHtmlTags = [];
        html = html.replace(/<[^>]+>/g, (match) => {
            tempEncodedHtmlTags.push(match);
            return `__HTML_PLACEHOLDER_${tempEncodedHtmlTags.length - 1}__`;
        });
        
        // Paragraphs are separated by one or more blank lines
        const paragraphs = html.split(/\n\s*\n+/);
        html = paragraphs.map(para => {
            if (para.trim() === '') return '';
            // Within each paragraph, replace single newlines with <br>
            return '<p>' + para.replace(/\n/g, '<br />') + '</p>';
        }).join('');

        // Restore HTML tags
        html = html.replace(/__HTML_PLACEHOLDER_(\d+)__/g, (match, index) => {
            return tempEncodedHtmlTags[parseInt(index, 10)] || '';
        });
        
        // Remove any completely empty paragraphs that might have formed
        html = html.replace(/<p>\s*(<br\s*\/?>\s*)*\s*<\/p>/gi, '');
        return html;
    };

    // Expose getElement and querySelector if script.js needs them (should be rare)
    window.ui.getElement = getElement;
    window.ui.querySelector = querySelector;

    console.log("ui.js loaded and window.ui defined."); // Confirmation log

})(window);
