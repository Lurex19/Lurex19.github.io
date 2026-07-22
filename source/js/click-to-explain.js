/**
 * Self-contained "find meaning" feature. On text selection it shows a floating
 * button; clicking it looks up the selected word (gematria for Hebrew, the
 * kabbalah grid otherwise) and renders the result in the info box. Kabbalah
 * grid and Hebrew-letter datasets are fetched once on init. Exposes
 * window.closeInfoBox() for the info box close button.
 *
 * Visual styling lives in source/styles/mycss.css:
 *   #find-meaning-btn            - base look of the floating button
 *   #find-meaning-btn.is-visible - shown state (toggled from JS)
 * JS only sets the dynamic top/left position of the button.
 */
// Kabbalah / gematria "find meaning" feature
(function () {
  let kabbalahGrid = {};
  let hebrewLettersData = {};
  let lastSelectedText = "";
  // 1. Создание кнопки (здесь всё верно)
  const btn = document.createElement('button');
  btn.id = 'find-meaning-btn';
  btn.innerHTML = 'Найти смысл';
  document.body.appendChild(btn);

  // 2. Загрузка данных (добавьте проверки, чтобы не было ошибок)
  fetch('kabbalah_grid.json?v=' + Date.now()).then(res => res.json()).then(data => { kabbalahGrid = data; });
  fetch('hebrew_letters.json?v=' + Date.now()).then(res => res.json()).then(data => { hebrewLettersData = data; });

  /**
   * Builds an HTML explanation for a selected word.
   * - Hebrew words: sums the gematria value of each letter and lists per-letter
   *   values/descriptions from hebrewLettersData.
   * - Other words: looks the term up in kabbalahGrid, returning its description
   *   and, when present, its associated "world".
   *
   * @param {string} word - The normalized selected word to analyze.
   * @returns {string|null} HTML markup for the info box, or null if no match.
   */
  function getWordInfo(word) {
    const isHebrew = /[\u0590-\u05FF]/.test(word);
    if (isHebrew) {
      let sum = 0;
      let details = "<ul>";
      for (let char of word) {
        if (hebrewLettersData[char]) {
          sum += hebrewLettersData[char].val;
          details += `<li><b>${char}</b> (${hebrewLettersData[char].val}): ${hebrewLettersData[char].desc}</li>`;
        }
      }
      return `<h4>Гематрия: ${sum}</h4>${details}</ul>`;
    } else {
      if (kabbalahGrid[word]) {
        const entry = kabbalahGrid[word];
        const desc = typeof entry === 'object' ? entry.desc : entry;
        const world = typeof entry === 'object' ? `<br><br><b>Мир:</b> ${entry.world || 'Не определен'}` : "";
        return `<h4>${word.toUpperCase()}</h4>${desc}${world}`;
      }
    }
    return null;
  }

  /**
   * Handles text-selection events. After a short debounce, reads the current
   * selection, normalizes it (trim, strip trailing punctuation, lowercase),
   * and — if it is a meaningful word — positions and shows the "Найти смысл"
   * button next to the selection. Hides the button otherwise.
   *
   * @param {Event} e - The originating mouseup/touchend/selectionchange event.
   * @returns {void}
   */
  function handleSelection(e) {
    if (e.target === btn || btn.contains(e.target)) return;

    setTimeout(() => {
      const selectionObj = window.getSelection();
      if (!selectionObj || selectionObj.rangeCount === 0) {
        btn.classList.remove('is-visible');
        return;
      }

      const selectedString = selectionObj.toString();
      const text = selectedString.trim().replace(/[.,!?;:"]+$/, "").toLowerCase();

      if (text.length > 1) {
        lastSelectedText = text;
        const range = selectionObj.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        if (rect.width > 0) {
          btn.style.top = (rect.bottom + 8) + 'px';
          /*  btn.style.left = (rect.left + window.scrollX) + 'px';*/
          btn.style.left = rect.left + 'px';
          btn.classList.add('is-visible');
        }
      } else {
        btn.classList.remove('is-visible');
      }
    }, 350);
  }

  document.addEventListener('mouseup', handleSelection);
  document.addEventListener('touchend', handleSelection);
  document.addEventListener('selectionchange', handleSelection);

  // 5. Логика клика
  /**
   * Click handler for the floating "Найти смысл" button. Analyzes the last
   * selected word and, on a hit, populates and reveals the info box, then
   * clears the current text selection.
   *
   * @param {MouseEvent} e - The button click event.
   * @returns {void}
   */
  btn.onclick = function (e) {
    e.stopPropagation();
    btn.classList.remove('is-visible');

    const infoBox = document.getElementById("kabbalah-info-box");
    const infoContent = document.getElementById("info-box-content");

    if (infoBox && infoContent) {
      const result = getWordInfo(lastSelectedText);
      if (result) {
        infoContent.innerHTML = result;
        infoBox.className = "info-box-visible";
      }
      /* else {
          window.open('https://www.google.com/search?q=' + encodeURIComponent('сведенборг ' + lastSelectedText), '_blank');
      }*/
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
      }

    }
  };

  /**
   * Hides the Kabbalah info box and the floating button, and clears any active
   * text selection. Exposed globally so the info box close button can call it.
   *
   * @returns {void}
   */
  window.closeInfoBox = function () {
    const infoBox = document.getElementById("kabbalah-info-box");
    if (infoBox) infoBox.className = "info-box-hidden";
    btn.classList.remove('is-visible');
    window.getSelection().removeAllRanges();
  };
})();
