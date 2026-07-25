const t = (key, subs) => chrome.i18n.getMessage(key, subs);

const form = document.getElementById("form");
const urlInput = document.getElementById("urlInput");
const fetchBtn = document.getElementById("fetchBtn");
const statusEl = document.getElementById("status");
const resultsEl = document.getElementById("results");

function setStatus(text, kind) {
  statusEl.textContent = text;
  statusEl.className = "status" + (kind ? ` ${kind}` : "");
}

function extractTweetId(input) {
  const trimmed = input.trim();
  const match = trimmed.match(/status\/(\d+)/) || trimmed.match(/^(\d+)$/);
  return match ? match[1] : null;
}

function formatBitrate(bitrate) {
  if (!bitrate) return t("qualityStandard");
  return t("qualityKbps", [String(Math.round(bitrate / 1000))]);
}

function renderResults(tweetId, variantsSets) {
  resultsEl.innerHTML = "";
  variantsSets.forEach((variants, videoIndex) => {
    if (!variants.length) return;

    const group = document.createElement("div");
    group.className = "video-group";

    const title = document.createElement("div");
    title.className = "video-group-title";
    title.textContent =
      variantsSets.length > 1
        ? t("videoGroupTitleMultiple", [String(videoIndex + 1)])
        : t("videoGroupTitleSingle");
    group.appendChild(title);

    variants.forEach((v) => {
      const btn = document.createElement("button");
      btn.className = "variant-btn";
      btn.innerHTML = `<span>${formatBitrate(v.bitrate)}</span><span>⬇</span>`;
      btn.addEventListener("click", () => {
        btn.disabled = true;
        chrome.runtime.sendMessage(
          {
            type: "DOWNLOAD_VARIANT",
            tweetId,
            videoIndex,
            url: v.url,
            bitrate: v.bitrate,
          },
          (response) => {
            btn.disabled = false;
            if (response?.ok) {
              setStatus(t("statusDownloadStarted"), "success");
            } else {
              setStatus(response?.error || t("statusDownloadFailed"), "error");
            }
          }
        );
      });
      group.appendChild(btn);
    });

    resultsEl.appendChild(group);
  });
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const tweetId = extractTweetId(urlInput.value);
  resultsEl.innerHTML = "";

  if (!tweetId) {
    setStatus(t("statusInvalidUrl"), "error");
    return;
  }

  fetchBtn.disabled = true;
  setStatus(t("statusFetching"));

  chrome.runtime.sendMessage({ type: "GET_VIDEO_INFO", tweetId }, (response) => {
    fetchBtn.disabled = false;
    if (chrome.runtime.lastError) {
      setStatus(t("statusCommError"), "error");
      return;
    }
    if (!response?.ok) {
      setStatus(response?.error || t("errNoVideoFound"), "error");
      return;
    }
    setStatus(
      t("statusFoundCount", [String(response.data.variantsSets.length)]),
      "success"
    );
    renderResults(tweetId, response.data.variantsSets);
  });
});

// 現在開いているタブがツイート詳細ページならURLを自動入力
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const tab = tabs[0];
  if (tab?.url && /status\/\d+/.test(tab.url)) {
    urlInput.value = tab.url;
  }
});
