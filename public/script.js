/* --------------------------------------------------------------------------
   Header — hairline appears once the page has scrolled off the top.
   -------------------------------------------------------------------------- */
(() => {
  "use strict";

  const header = document.querySelector(".site-header");
  if (!header) return;

  const sentinel = document.createElement("div");
  sentinel.setAttribute("aria-hidden", "true");
  sentinel.style.cssText = "position:absolute;top:0;left:0;width:1px;height:1px;pointer-events:none;";
  document.body.prepend(sentinel);

  new IntersectionObserver(
    ([entry]) => header.classList.toggle("is-stuck", !entry.isIntersecting),
    { rootMargin: "0px" }
  ).observe(sentinel);
})();

/* --------------------------------------------------------------------------
   Contact form.

   Both buttons post to the same endpoint; the one that submitted decides the
   request type. Success is shown only after the server accepts the request —
   never optimistically.
   -------------------------------------------------------------------------- */
(() => {
  "use strict";

  const form = document.getElementById("contact-form");
  const status = document.getElementById("form-status");
  const thanks = document.getElementById("contact-thanks");
  const main = document.getElementById("main");
  if (!form || !status || !thanks) return;

  const emailField = form.elements.email;
  const buttons = Array.from(form.querySelectorAll("button[type=submit]"));
  const ENDPOINT = form.getAttribute("action") || "/api/contact";

  let submitting = false;
  let completed = false;
  let lastClicked = null;
  let statusMessage = "";
  let inContact = main?.dataset.activeSection === "contact";
  let visit = inContact ? 1 : 0;

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      lastClicked = button;
    });
  });

  function translateStatus() {
    status.textContent = window.AEKRLanguage?.text(statusMessage) ?? statusMessage;
  }

  document.addEventListener("aekr:languagechange", translateStatus);

  function setStatus(message, variant) {
    statusMessage = message;
    translateStatus();
    status.classList.remove("form-status--success", "form-status--error");
    if (variant) status.classList.add(`form-status--${variant}`);
  }

  function setBusy(isBusy, activeButton) {
    submitting = isBusy;
    buttons.forEach((button) => {
      button.disabled = isBusy || completed;
    });
    if (activeButton) {
      activeButton.setAttribute("aria-busy", isBusy ? "true" : "false");
    }
  }

  function syncContactVisit(records = navigationObserver?.takeRecords() || []) {
    records.forEach((record, index) => {
      // A complete leave/re-entry can occur in one observer batch.
      const section = index + 1 < records.length ? records[index + 1].oldValue : main.dataset.activeSection;
      const entering = section === "contact" && !inContact;
      inContact = section === "contact";
      if (!entering) return;
      visit++;
      if (!completed) return;
      completed = false;
      form.hidden = false;
      thanks.hidden = true;
      lastClicked = null;
      setStatus("");
      setBusy(submitting);
    });
  }

  const navigationObserver = main ? new MutationObserver(syncContactVisit) : null;
  navigationObserver?.observe(main, {
    attributes: true,
    attributeFilter: ["data-active-section"],
    attributeOldValue: true,
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    syncContactVisit();
    if (submitting || completed) return;

    const trigger = event.submitter || lastClicked || buttons[0];
    const requestType = trigger && trigger.dataset.requestType === "pricing" ? "pricing" : "contact";

    const email = (emailField.value || "").trim();
    const comment = (form.elements.comment.value || "").trim();
    const company = (form.elements.company.value || "").trim();

    if (!email || !emailField.checkValidity()) {
      emailField.setAttribute("aria-invalid", "true");
      emailField.focus();
      setStatus("Enter a valid email address so we can reply.", "error");
      return;
    }
    emailField.removeAttribute("aria-invalid");

    setBusy(true, trigger);
    setStatus("Sending…");
    const requestVisit = visit;

    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, comment, company, requestType }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const result = await response.json();
      if (result?.ok !== true) throw new Error("rejected");

      syncContactVisit();
      if (requestVisit !== visit) return;
      completed = true;
      form.reset();
      setStatus("");
      form.hidden = true;
      thanks.hidden = false;
      if (inContact || !main?.dataset.activeSection) {
        thanks.focus({ preventScroll: true });
        thanks.scrollIntoView({ block: "start", behavior: "instant" });
      }
    } catch (error) {
      // The comment is deliberately left in place so nothing typed is lost.
      syncContactVisit();
      if (requestVisit === visit) setStatus("We couldn't send your request. Please try again.", "error");
    } finally {
      setBusy(false, trigger);
      if (requestVisit !== visit) setStatus("");
    }
  });
})();
