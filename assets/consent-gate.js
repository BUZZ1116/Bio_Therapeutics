(function () {
  'use strict';

  var storageScope = document.body.getAttribute('data-consent-scope') || 'case';
  var storageKey = 'tksg-isms-kb-1.0018:' + storageScope + ':legal-consent:v1';
  var gate = document.getElementById('tksgConsentGate');
  var checkbox = document.getElementById('tksgConsentCheck');
  var agreeButton = document.getElementById('tksgConsentAgree');
  var protectedContent = Array.prototype.slice.call(document.querySelectorAll('[data-tksg-consent-content]'));

  if (!gate || !checkbox || !agreeButton) return;

  function hasSessionConsent() {
    try {
      return window.sessionStorage.getItem(storageKey) === 'agreed';
    } catch (error) {
      return false;
    }
  }

  function rememberSessionConsent() {
    try {
      window.sessionStorage.setItem(storageKey, 'agreed');
    } catch (error) {
      /* 若瀏覽器停用儲存功能，本次頁面仍可繼續使用。 */
    }
  }

  function setKnowledgeBaseLocked(locked) {
    document.body.classList.toggle('tksgConsentPending', locked);
    protectedContent.forEach(function (element) {
      if (locked) {
        element.setAttribute('inert', '');
        element.setAttribute('aria-hidden', 'true');
      } else {
        element.removeAttribute('inert');
        element.removeAttribute('aria-hidden');
      }
    });
  }

  function closeGate() {
    rememberSessionConsent();
    setKnowledgeBaseLocked(false);
    gate.hidden = true;
    gate.setAttribute('aria-hidden', 'true');
    var search = document.getElementById('q');
    if (search) search.focus();
  }

  function openGate() {
    setKnowledgeBaseLocked(true);
    gate.hidden = false;
    gate.removeAttribute('aria-hidden');
    window.setTimeout(function () { checkbox.focus(); }, 0);
  }

  checkbox.addEventListener('change', function () {
    agreeButton.disabled = !checkbox.checked;
  });

  agreeButton.addEventListener('click', function () {
    if (!checkbox.checked) return;
    closeGate();
  });

  document.addEventListener('keydown', function (event) {
    if (gate.hidden) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      return;
    }

    if (event.key !== 'Tab') return;
    var focusable = Array.prototype.slice.call(gate.querySelectorAll('input:not([disabled]), button:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])'));
    if (!focusable.length) return;
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  if (hasSessionConsent()) {
    setKnowledgeBaseLocked(false);
    gate.hidden = true;
    gate.setAttribute('aria-hidden', 'true');
  } else {
    openGate();
  }
}());
