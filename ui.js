// Lulu's Library - ui.js (Full, with Modal Helpers + Cover‑First Fixes)
// -----------------------------------------------------------------------------
//  This file defines window.ui and all rendering helpers used by script.js.
//  NOTHING from the original helper set has been removed – only improved.
// -----------------------------------------------------------------------------

(function (window) {
  "use strict";

  /* ------------------------------------------------------------------
   *  Bootstrap & utilities
   * ------------------------------------------------------------------ */
  const ui = (window.ui = {}); // expose immediately

  function getElement(id) {
    const el = document.getElementById(id);
    if (!el) console.warn(`UI_WARN: Element #${id} not found`);
    return el;
  }
  function qs(sel, parent = document) {
    const el = parent.querySelector(sel);
    if (!el) console.warn(`UI_WARN: Selector ${sel} not found`);
    return el;
  }

  /* ------------------------------------------------------------------
   *  Theme helpers
   * ------------------------------------------------------------------ */
  ui.applyThemeUI = (theme) => {
    const body = document.body;
    if (!body) return console.error("UI_ERROR: <body> missing");
    body.classList.toggle("caldas-mode", theme === "caldas");
    body.classList.toggle("normal-mode", theme !== "caldas");
    ui.updateThemeToggleButtonUI(theme);
  };

  ui.updateThemeToggleButtonUI = (theme) => {
    const icon = getElement("theme-toggle-icon");
    const txt = getElement("theme-toggle-text");
    if (!icon || !txt) return;
    if (theme === "caldas") {
      icon.textContent = "🎮";
      txt.textContent = "Caldas";
    } else {
      icon.textContent = "☀️";
      txt.textContent = "Normal";
    }
  };

  /* ------------------------------------------------------------------
   *  Landing‑page render (titles + grid)
   * ------------------------------------------------------------------ */
  ui.renderUI = (state, renderBooksGridFn) => {
    document.title = state.libraryTitle;
    const titleEl = getElement("page-main-title");
    const welcomeMsgEl = getElement("custom-welcome-message");
    titleEl && (titleEl.textContent = state.libraryTitle);
    welcomeMsgEl && (welcomeMsgEl.textContent = state.customWelcomeMessage);

    const prompt = getElement("username-prompt");
    const main = getElement("main-content");
    const nameTxt = getElement("username-text");
    const changeBtn = getElement("change-username-btn");
    const editTitleBtn = getElement("edit-page-title-btn");
    const editWelcomeBtn = getElement("edit-custom-welcome-btn");
    const userDisp = getElement("username-display-container");
    const greet = getElement("welcome-user-message");

    const hasUser = Boolean(state.userName);
    prompt?.classList.toggle("hidden", hasUser);
    main?.classList.toggle("hidden", !hasUser);
    changeBtn?.classList.toggle("hidden", !hasUser);
    editTitleBtn?.classList.toggle("hidden", !hasUser);
    editWelcomeBtn?.classList.toggle("hidden", !hasUser);
    userDisp?.classList.toggle("hidden", !hasUser);
    if (hasUser) {
      nameTxt && (nameTxt.textContent = `Hi, ${state.userName}!`);
      greet && (greet.textContent = `Here are your creations, ${state.userName}:`);
      renderBooksGridFn?.(state.books, state.userName, state.currentTheme);
    }
  };

  /* ------------------------------------------------------------------
   *  Books grid (landing)
   * ------------------------------------------------------------------ */
  ui.renderBooksGridUI = (
    books,
    userName,
    theme,
    openBookFn,
    editBookFn,
    deleteBookFn
  ) => {
    const gridEl = getElement("books-grid");
    const emptyEl = getElement("no-books-message");
    if (!gridEl || !emptyEl) return;
    gridEl.innerHTML = "";

    if (!books.length) {
      emptyEl.classList.remove("hidden");
      gridEl.classList.add("hidden");
      return;
    }
    emptyEl.classList.add("hidden");
    gridEl.classList.remove("hidden");

    books.forEach((book) => {
      const wrap = document.createElement("div");
      wrap.className = "relative group book-cover-container";

      const cover = document.createElement("div");
      cover.className =
        "book-cover-item rounded-lg shadow-md cursor-pointer flex flex-col justify-end items-center h-64 aspect-[2/3] bg-cover bg-center relative overflow-hidden";

      const first = book.pages?.[0] || {};
      if (first.coverImageUrl) {
        cover.style.backgroundImage = `url('${CSS.escape(first.coverImageUrl)}')`;
      } else {
        cover.style.backgroundColor =
          book.coverColor || (theme === "caldas" ? "#3a3a5e" : ui.getRandomColorUI());
      }

      const txtWrap = document.createElement("div");
      txtWrap.className =
        "relative z-10 flex flex-col justify-end items-center w-full p-2";
      const t = document.createElement("h3");
      t.className = "book-cover-title";
      t.textContent = book.title;
      const a = document.createElement("p");
      a.className = "book-cover-author";
      a.textContent = `By ${userName}`;
      txtWrap.append(t, a);
      cover.appendChild(txtWrap);

      cover.addEventListener("click", (e) => {
        if (e.target.closest(".book-action-btn")) return; // ignore button clicks
        openBookFn?.(book, cover);
      });

      // actions
      const actions = document.createElement("div");
      actions.className =
        "absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-1 z-20";
      const editBtn = document.createElement("button");
      editBtn.innerHTML = "✏️";
      editBtn.title = "Edit Book";
      editBtn.className =
        "book-action-btn p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-xs shadow";
      editBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        editBookFn?.(book.id);
      });
      const delBtn = document.createElement("button");
      delBtn.innerHTML = "🗑️";
      delBtn.title = "Delete Book";
      delBtn.className =
        "book-action-btn p-2 bg-red-500 text-white rounded-md hover:bg-red-600 text-xs shadow";
      delBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        deleteBookFn?.(book.id);
      });
      actions.append(editBtn, delBtn);
      wrap.append(actions, cover);
      gridEl.appendChild(wrap);
    });
  };

  ui.getRandomColorUI = () => {
    const letters = "789ABCD";
    return (
      "#" +
      Array.from({ length: 6 }, () => letters[(Math.random() * letters.length) | 0]).join("")
    );
  };

  /* ------------------------------------------------------------------
   *  Modal helpers (unchanged from original) – USED BY script.js
   * ------------------------------------------------------------------ */
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
    const coverImgContainerEl = getElement("cover-image-input-container");

    if (
      !modalEl ||
      !step1El ||
      !step2El ||
      !titleInputEl ||
      !pagesInputEl ||
      !modalTitleEl ||
      !saveBtnEl ||
      !coverImgUrlInputEl ||
      !coverImgContainerEl
    ) {
      return console.error("UI_ERROR: Missing elements for showBookCreationModalUI");
    }

    editingBookIdRef.id = bookToEdit ? bookToEdit.id : null;

    if (bookToEdit) {
      // edit mode
      currentBookData.title = bookToEdit.title;
      currentBookData.pages = JSON.parse(JSON.stringify(bookToEdit.pages || []));
      if (!currentBookData.pages.length)
        currentBookData.pages.push({ content: "", coverImageUrl: "" });
      titleInputEl.value = currentBookData.title;
      pagesInputEl.value = currentBookData.pages.length;
      pagesInputEl.disabled = true;
      modalTitleEl.textContent = "Edit Book";
      saveBtnEl.textContent = "Save Changes";
      coverImgUrlInputEl.value = currentBookData.pages[0].coverImageUrl || "";
    } else {
      // create mode
      currentBookData.title = "";
      currentBookData.pages = [{ content: "", coverImageUrl: "" }];
      titleInputEl.value = "";
      pagesInputEl.value = "1";
      pagesInputEl.disabled = false;
      modalTitleEl.textContent = "Create New Book";
      saveBtnEl.textContent = "Save Book";
      coverImgUrlInputEl.value = "";
    }

    modalEl.classList.remove("hidden");
    modalEl.classList.add("flex");
    step1El.classList.remove("hidden");
    step2El.classList.add("hidden");
    coverImgContainerEl.classList.add("hidden");
  };

  ui.hideBookCreationModalUI = function (editingBookIdRef) {
    const modalEl = getElement("book-creation-modal");
    const pagesInputEl = getElement("num-pages-input");
    const modalTitleEl = qs("#book-creation-modal #modal-step-1 h2");
    const saveBtnEl = getElement("save-book-btn");
    if (!modalEl || !pagesInputEl || !modalTitleEl || !saveBtnEl) return;

    modalEl.classList.add("hidden");
    modalEl.classList.remove("flex");
    if (editingBookIdRef) editingBookIdRef.id = null;
    pagesInputEl.disabled = false;
    modalTitleEl.textContent = "Create New Book";
    saveBtnEl.textContent = "Save Book";
  };

  ui.renderPageContentInputsUI = function (
    currentBookData,
    currentPageEditorIndex,
    attachDynamicListenersFn
  ) {
    const inputsContainerEl = getElement("page-content-inputs");
    const pageLabelEl = getElement("current-page-editor-label");
    const pageIndicatorEl = getElement("page-editor-indicator");
    const coverImgContainerEl = getElement("cover-image-input-container");
    const coverImgUrlInputEl = getElement("cover-image-url-input");
    const prevBtnEl = getElement("prev-page-editor-btn");
    const nextBtnEl = getElement("next-page-editor-btn");

    if (
      !inputsContainerEl ||
      !pageLabelEl ||
      !pageIndicatorEl ||
      !coverImgContainerEl ||
      !coverImgUrlInputEl ||
      !prevBtnEl ||
      !nextBtnEl
    ) {
      return console.error("UI_ERROR: Missing elements for renderPageContentInputsUI");
    }

    inputsContainerEl.innerHTML = "";
    const total = currentBookData.pages.length;

    // ensure page object exists
    if (!currentBookData.pages[currentPageEditorIndex]) {
      currentBookData.pages[currentPageEditorIndex] = {
        content: "",
        ...(currentPageEditorIndex === 0 && { coverImageUrl: "" }),
      };
    }

    const pageData = currentBookData.pages[currentPageEditorIndex];
    const labelText =
      currentPageEditorIndex === 0
        ? `Page 1 (Cover)`
        : `Page ${currentPageEditorIndex + 1}`;
    pageLabelEl.textContent = `Editing ${labelText}`;
    pageIndicatorEl.textContent = `Page ${currentPageEditorIndex + 1} of ${total}`;

    // cover controls
    if (currentPageEditorIndex === 0) {
      inputsContainerEl.appendChild(coverImgContainerEl);
      coverImgContainerEl.classList.remove("hidden");
      coverImgUrlInputEl.value = pageData.coverImageUrl || "";
    } else {
      coverImgContainerEl.classList.add("hidden");
    }

    // textarea
    const ta = document.createElement("textarea");
    ta.id = `page-content-${currentPageEditorIndex}`;
    ta.rows = currentPageEditorIndex === 0 ? 6 : 10;
    ta.className =
      "w-full p-3 border rounded-lg shadow-sm focus:ring-2 focus:border-accent resize-none mt-2 input-border bg-input text-input-text";
    ta.placeholder =
      `Enter content for ${labelText}...\nUse Markdown: **bold**, *italic*.\nOr HTML: <b>b</b>, <i>i</i>, <u>u</u>, <span style="font-size: PX; color: #HEX;">text</span>.`;
    ta.value = pageData.content;
    inputsContainerEl.appendChild(ta);
    ta.focus();

    prevBtnEl.disabled = currentPageEditorIndex === 0;
    nextBtnEl.disabled = currentPageEditorIndex === total - 1;

    // dynamic delete page btn inside step2
    const containerBtn = qs("#modal-step-2 .flex.justify-end.space-x-3");
    if (containerBtn) {
      let delBtn = getElement("delete-page-btn-modal");
      if (!delBtn) {
        delBtn = document.createElement("button");
        delBtn.id = "delete-page-btn-modal";
        delBtn.textContent = "Delete Page";
        delBtn.className =
          "px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition mr-auto"; // push left
        const backBtn = getElement("back-to-step1-btn");
        backBtn
          ? containerBtn.insertBefore(delBtn, backBtn)
          : containerBtn.appendChild(delBtn);
      }
      delBtn.disabled = total <= 1;
      delBtn.style.display = total <= 1 ? "none" : "inline-block";
    }

    attachDynamicListenersFn?.();
  };

  /* ------------------------------------------------------------------
   *  Reader open / close & page rendering
   * ------------------------------------------------------------------ */
  ui.openBookUI = function (book, coverEl, renderCurrentPagesFn) {
    const body = document.body;
    const landingEl = getElement("landing-page");
    const addBtnEl = getElement("add-book-btn");
    const readerContainerEl = getElement("book-reader-container");
    const readerEl = getElement("book-reader");
    if (!body || !landingEl || !addBtnEl || !readerContainerEl || !readerEl) return;

    // clone zoom effect
    const rect = coverEl.getBoundingClientRect();
    const clone = coverEl.cloneNode(true);
    clone.className = "book-transition-clone";
    clone.style.cssText = `position:fixed;top:${rect.top}px;left:${rect.left}px;width:${rect.width}px;height:${rect.height}px;z-index:9999;transition:all .6s ease;background-image:${coverEl.style.backgroundImage};background-color:${coverEl.style.backgroundColor};background-size:cover;background-position:center;`;
    body.appendChild(clone);
    landingEl.style.opacity = "0";
    addBtnEl.style.display = "none";

    requestAnimationFrame(() => {
      const targetW = Math.min(window.innerWidth * 0.9, 1200);
      const targetH = 700;
      clone.style.top = `${(window.innerHeight - targetH) / 2}px`;
      clone.style.left = `${(window.innerWidth - targetW) / 2}px`;
      clone.style.width = `${targetW}px`;
      clone.style.height = `${targetH}px`;
      clone.style.transform = "scale(1.05)";
    });

    setTimeout(() => {
      clone.remove();
      readerContainerEl.classList.remove("hidden");
      readerContainerEl.classList.add("flex");
      readerEl.classList.remove("hidden");
      readerEl.style.opacity = "1";
      renderCurrentPagesFn?.();
      landingEl.classList.add("hidden");
    }, 650);
  };

  ui.closeBookUI = function () {
    const readerEl = getElement("book-reader");
    const readerContainerEl = getElement("book-reader-container");
    const landingEl = getElement("landing-page");
    const addBtnEl = getElement("add-book-btn");
    if (!readerEl || !readerContainerEl || !landingEl || !addBtnEl) return;

    readerEl.style.opacity = "0";
    setTimeout(() => {
      readerContainerEl.classList.add("hidden");
      readerContainerEl.classList.remove("flex");
      readerEl.classList.add("hidden");
      landingEl.classList.remove("hidden");
      landingEl.style.opacity = "1";
      addBtnEl.style.display = "flex";
    }, 400);
  };

  ui.renderCurrentPagesUI = function (
    currentOpenBook,
    currentOpenBookPageIndex,
    isCoverViewActive,
    convertMarkdownToHTMLFn
  ) {
    const leftPageEl = getElement("left-page");
    const rightPageEl = getElement("right-page");
    if (!currentOpenBook || !leftPageEl || !rightPageEl || !convertMarkdownToHTMLFn)
      return;

    const leftPageContentEl = qs(".page-content", leftPageEl);
    const rightPageContentEl = qs(".page-content", rightPageEl);
    const prevBtnEl = getElement("turn-prev");
    const nextBtnEl = getElement("turn-next");
    if (!leftPageContentEl || !rightPageContentEl || !prevBtnEl || !nextBtnEl)
      return;

    // reset
    [leftPageEl, rightPageEl].forEach((el) => {
      el.style.backgroundImage = "";
      el.style.backgroundSize = "";
      el.className = el.className.replace(/\b(hidden-page|half-width-page|full-width-page)\b/g, "").trim();
    });
    leftPageContentEl.classList.remove("cover-text-on-image-container");
    rightPageContentEl.classList.remove("cover-text-on-image-container");

    const pages = currentOpenBook.pages;
    const total = pages.length;

    if (isCoverViewActive) {
      leftPageEl.classList.add("hidden-page");
      rightPageEl.classList.add("full-width-page");
      const cover = pages[0] || { content: "" };
      if (cover.coverImageUrl) {
        rightPageEl.style.backgroundImage = `url('${CSS.escape(
          cover.coverImageUrl
        )}')`;
        rightPageEl.style.backgroundSize = "contain";
        rightPageContentEl.classList.add("cover-text-on-image-container");
      }
      rightPageContentEl.innerHTML = convertMarkdownToHTMLFn(cover.content);
      leftPageContentEl.innerHTML = "";
      prevBtnEl.style.display = "none";
      nextBtnEl.style.display = total > 1 ? "block" : "none";
    } else {
      leftPageEl.classList.add("half-width-page");
      rightPageEl.classList.add("half-width-page");

      const lData = pages[currentOpenBookPageIndex] || { content: "" };
      const rData = pages[currentOpenBookPageIndex + 1] || {};
      leftPageContentEl.innerHTML = convertMarkdownToHTMLFn(lData.content);
      if (currentOpenBookPageIndex + 1 < total)
        rightPageContentEl.innerHTML = convertMarkdownToHTMLFn(rData.content || "");
      else
        rightPageContentEl.innerHTML =
          '<div class="p-4 text-center italic">End of Book</div>';

      prevBtnEl.style.display = "block";
      nextBtnEl.style.display =
        currentOpenBookPageIndex + 2 < total ? "block" : "none";
    }

    leftPageContentEl.scrollTop = 0;
    rightPageContentEl.scrollTop = 0;
  };

  /* ------------------------------------------------------------------
   *  Simple markdown → HTML
   * ------------------------------------------------------------------ */
  ui.convertMarkdownToHTMLUI = function (mdText) {
    if (typeof mdText !== "string") return "";
    let html = mdText.trim();

    // Bold / italic
    html = html
      .replace(/\*\*(.*?)\*\*|__(.*?)__/g, "<strong>$1$2</strong>")
      .replace(/\*(.*?)\*|_(.*?)_/g, "<em>$1$2</em>");

    // Paragraph split on blank lines (>=2 newlines)
    const paragraphs = html.split(/\n\s*\n+/);
    html = paragraphs
      .map((p) => {
        if (!p.trim()) return "";
        return "<p>" + p.replace(/\n/g, "<br />") + "</p>";
      })
      .join("");

    return html;
  };

  /* expose helpers */
  ui.getElement = getElement;
  ui.querySelector = qs;

  console.log("ui.js loaded with full helper set");
})(window);
