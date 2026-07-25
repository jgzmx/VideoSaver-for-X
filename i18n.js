// i18n.js
// data-i18n / data-i18n-placeholder / data-i18n-title 属性を持つ要素に
// chrome.i18n.getMessage() の結果を反映します。

function applyI18n(root = document) {
  root.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    const msg = chrome.i18n.getMessage(key);
    if (msg) el.textContent = msg;
  });

  root.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    const msg = chrome.i18n.getMessage(key);
    if (msg) el.setAttribute("placeholder", msg);
  });

  root.querySelectorAll("[data-i18n-title]").forEach((el) => {
    const key = el.getAttribute("data-i18n-title");
    const msg = chrome.i18n.getMessage(key);
    if (msg) el.setAttribute("title", msg);
  });
}

document.addEventListener("DOMContentLoaded", () => applyI18n());
