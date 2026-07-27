/**
 * Fetches an HTML fragment over XHR and injects it into a target element.
 * On success (HTTP 200) the response replaces the element's innerHTML, an optional callback runs, and dynamic events are re-wired via refreshEvents().
 * Missing files (HTTP 404) are logged as a warning and ignored.
 *
 * @param {string} fileToLoad - URL/path of the HTML fragment to load.
 * @param {HTMLElement} intoElement - Element whose innerHTML will be replaced.
 * @param {Function} [callback] - Optional function run after content is injected.
 * @returns {void}
 */
function includeHTML(fileToLoad, intoElement, callback) {
  if (!fileToLoad || !intoElement) {
    console.warn("Nothing to load.");
    return;
  }

  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function () {
    if (this.readyState == 4) {
      if (this.status == 200) {
        intoElement.innerHTML = this.responseText;
        if (callback) {
          callback();
        }

        refreshEvents();
      }
      if (this.status == 404) {
        console.warn("File " + fileToLoad + " not found.");
      }
    }
  }

  xhttp.open("GET", fileToLoad, true);
  xhttp.send();
}

/**
 * Scans the document for elements carrying a `w3-include-html` attribute, removes the attribute (to prevent re-processing), and loads the referenced HTML fragment into each element via includeHTML().
 *
 * @returns {void}
 */
function reloadTaggedHtml() {
  const attributeToFind = "w3-include-html";
  var allTaggedElements = document.querySelectorAll("[" + attributeToFind + "]");
  for (let i = 0; i < allTaggedElements.length; i++) {
    const taggedElement = allTaggedElements[i];
    const fileToLoad = taggedElement.getAttribute(attributeToFind);
    taggedElement.removeAttribute(attributeToFind);
    includeHTML(fileToLoad, taggedElement);
  }
}

/**
 * Attaches click handlers to all `.caret` elements to make collapsible tree
 * nodes expand/collapse. Each click:
 *   1. Enforces accordion behavior — any other open caret in the same nav list
 *      is collapsed, so at most one section is expanded at a time.
 *   2. Toggles the current caret's nested list and rotates its arrow (via the
 *      `caret-down` class, ">" becomes "v").
 *   3. When expanding, scrolls the center content pane to the section heading
 *      referenced by the caret's `data-target` attribute (e.g. div#vaera).
 * A `clickListener` marker attribute ensures each element is wired only once,
 * so the function is safe to call repeatedly after new content is injected.
 *
 * @returns {void}
 */
function setupCaretEvents() {
  var caretElements = document.getElementsByClassName("caret");
  for (var i = 0; i < caretElements.length; i++) {
    var caretElement = caretElements[i];
    if (!!caretElement.getAttribute('clickListener')) {
      continue;
    }

    caretElement.setAttribute("clickListener", true);
    caretElement.addEventListener("click", function () {
      var nested = this.parentElement.querySelector(".nested");
      var willOpen = nested ? !nested.classList.contains("active") : true;

      // Accordion: collapse every other caret/nested in the same nav list.
      var container = this.closest("#myUL") || document;
      var openCarets = container.querySelectorAll(".caret.caret-down");
      for (var j = 0; j < openCarets.length; j++) {
        if (openCarets[j] !== this) {
          openCarets[j].classList.remove("caret-down");
        }
      }
      var openNested = container.querySelectorAll(".nested.active");
      for (var k = 0; k < openNested.length; k++) {
        if (openNested[k] !== nested) {
          openNested[k].classList.remove("active");
        }
      }

      // Toggle the clicked section and its arrow (">" <-> "v").
      if (nested) {
        nested.classList.toggle("active");
      }
      this.classList.toggle("caret-down");

      // On expand, scroll the center pane to the matching section heading.
      if (willOpen) {
        var targetId = this.getAttribute("data-target");
        if (targetId) {
          var section = document.getElementById(targetId);
          if (section) {
            section.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }
      }
    });
  }
  return;
};

/**
 * Re-initializes dynamic behavior after page load or content injection.
 * Processes any `w3-include-html` placeholders and (re)binds caret toggles.
 *
 * @returns {void}
 */
function refreshEvents() {
  reloadTaggedHtml();
  setupCaretEvents();
}

/**
 * Loads a document into the center pane, then narrows it down to a single section: 
 * 1) The whole `source/fdays/<fileName>.html` file is loaded.
 * 2) Then, the first `div.<selector>` inside it replaces the pane's content.
 *
 * @param {string} selector - CSS class of the section div to extract.
 * @param {string} fileName - Base name of the HTML file under source/fdays/.
 * @returns {void}
 */
function loadDocCenterSelector(selector, fileName) {
  // Load the whole selected content into a single element
  const fileToLoad = 'source/fdays/' + fileName + ".html";
  var intoElement = document.getElementById("w3-include-center");
  includeHTML(fileToLoad, intoElement, function () {

    // Now load only a portion of that loaded document into the given element, effectively loading only a selected portion of the whole document
    const selectedElements = document.querySelectorAll("div." + selector);
    if (selectedElements.length >= 1) {
      document.getElementById("w3-include-center").innerHTML = selectedElements[0].innerHTML;
    }
  });
};

/**
 * Loads a document into the right pane, then narrows it to a single section (first `div.<selector>`) and appends a "Тайны Небесные / Сведенборг" source heading. 
 * Also resets scroll position to the top after injection.
 *
 * @param {string} selector - CSS class of the section div to extract.
 * @param {string} fileName - Base name of the HTML file under source/fdays/.
 * @returns {void}
 */
function loadDocRightSelector(selector, fileName) {
  // Load the whole selected content into a single element
  const fileToLoad = 'source/fdays/' + fileName + '.html';
  var intoElement = document.getElementById("w3-include-right");
  includeHTML(fileToLoad, intoElement, function () {

    // Now load only a portion of that loaded document into the given element, effectively loading only a selected portion of the whole document
    const selectedElements = document.querySelectorAll("div." + selector);
    if (selectedElements.length >= 1) {
    //*  const addedText1 = "<h5>из ТАЙНЫ НЕБЕСНЫЕ Автор: Эммануил Сведенборг</h5><br>";*/
 const addedText1 = "<h5> </h5><br>";
      document.getElementById("w3-include-right").innerHTML = selectedElements[0].innerHTML + addedText1;
      document.body.scrollTop = 0;
      document.getElementById("w3-include-right").scrollTop = 0;
    }
  });
};

/**
 * Click handler for center-pane triggers. 
 * Uses the clicked element's id as the section selector and loads the matching section into the center pane.
 *
 * @param {HTMLElement} elementObject - Clicked element (its id is the selector).
 * @param {string} fileName - Base name of the HTML file under source/fdays/.
 * @returns {void}
 */
function ontgclick(elementObject, fileName) {
  if (elementObject && fileName) {
    loadDocCenterSelector(elementObject.id, fileName);
  }
};

/**
 * Click handler for right-pane triggers. 
 * Uses the clicked element's id as the section selector and loads the matching commentary into the right pane.
 *
 * @param {HTMLElement} elementObject - Clicked element (its id is the selector).
 * @param {string} fileName - Base name of the HTML file under source/fdays/.
 * @returns {void}
 */
function torclick(elementObject, fileName) {
  if (elementObject && fileName) {
    loadDocRightSelector(elementObject.id, fileName);
  }
};

/**
 * Top-level navigation handler. 
 * Maps the clicked nav item's id to its introductory content pane, loads that intro into #content-pane, then loads the associated left ("con<id>") and center ("<id>") panes once the intro layout is in place.
 *
 * @param {HTMLElement} elementObject - Clicked nav element (id drives routing).
 * @returns {void}
 */
function navclick(elementObject) {
  if (!elementObject) {
    return;
  }

  const paneId = elementObject.id;
  var contentPaneId = "";
  switch (paneId) {
    case "tegilimua":
    case "tegilim":
      contentPaneId = "integilim";
      break;
    case "aboutua":
    case "about":
      contentPaneId = "inabout";
      break;
    case "tora":
      contentPaneId = "intora";
      break;
        case "ptiha":
      contentPaneId = "inptiha";
      break;
  }

  var contentFileToLoad = "source/fdays/" + contentPaneId + ".html";
  var leftIntoContentElement = document.getElementById("content-pane");
  includeHTML(contentFileToLoad, leftIntoContentElement, function () {
    // Load left pane
    var leftFileToLoad = "source/fdays/con" + elementObject.id + ".html";
    var leftIntoElement = document.getElementById("w3-include-left");
    includeHTML(leftFileToLoad, leftIntoElement);

    // Load center pane
    var centerFileToLoad = "source/fdays/" + elementObject.id + ".html";
    var centerIntoElement = document.getElementById("w3-include-center");
    includeHTML(centerFileToLoad, centerIntoElement);
  });
};

// Load all
window.onload = refreshEvents;
