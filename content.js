// content.js
// タイムライン上の動画付きツイートに保存ボタンを重ねて表示します。

const BUTTON_CLASS = "xvs-save-btn";
const PROCESSED_ATTR = "data-xvs-processed";

function nodeAncestorPath(node, root) {
  const path = [];
  let cur = node;
  while (cur && cur !== root) {
    path.unshift(cur);
    cur = cur.parentElement;
  }
  return path;
}

// 記事内に複数の /status/ リンクがある場合(引用ツイートなど)、
// 動画要素と最も近い(DOM上で共通の祖先が深い)リンクを優先して選ぶ。
// これにより「引用元の動画」と「引用している側のツイートID」を
// 取り違える問題を防ぐ。
function extractTweetIdNearVideo(article, videoEl) {
  const links = Array.from(article.querySelectorAll('a[href*="/status/"]'));
  if (links.length === 0) return null;

  const videoPath = nodeAncestorPath(videoEl, article);
  let best = null;
  let bestScore = -1;

  for (const link of links) {
    const linkPath = nodeAncestorPath(link, article);
    let common = 0;
    while (
      common < videoPath.length &&
      common < linkPath.length &&
      videoPath[common] === linkPath[common]
    ) {
      common++;
    }
    if (common > bestScore) {
      bestScore = common;
      best = link;
    }
  }

  const match = best?.getAttribute("href")?.match(/\/status\/(\d+)/);
  return match ? match[1] : null;
}

function createButton(tweetId) {
  const t = (key) => chrome.i18n.getMessage(key);

  const btn = document.createElement("button");
  btn.className = BUTTON_CLASS;
  btn.type = "button";
  btn.title = t("saveButtonTitle");
  btn.textContent = t("saveButtonLabel");

  btn.addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (btn.disabled) return;

    btn.disabled = true;
    const originalText = btn.textContent;
    btn.textContent = t("saveButtonFetching");

    chrome.runtime.sendMessage(
      { type: "DOWNLOAD_BEST", tweetId },
      (response) => {
        btn.disabled = false;
        if (chrome.runtime.lastError) {
          btn.textContent = t("saveButtonError");
          setTimeout(() => (btn.textContent = originalText), 2000);
          return;
        }
        if (response?.ok) {
          btn.textContent = t("saveButtonSaved");
        } else {
          btn.textContent = t("saveButtonFailed");
          console.warn("Video Saver for X:", response?.error);
        }
        setTimeout(() => (btn.textContent = originalText), 2000);
      }
    );
  });

  return btn;
}

function processArticle(article) {
  if (article.getAttribute(PROCESSED_ATTR)) return;

  const hasVideo = article.querySelector("video");
  if (!hasVideo) return;

  const tweetId = extractTweetIdNearVideo(article, hasVideo);
  if (!tweetId) return;

  article.setAttribute(PROCESSED_ATTR, "1");

  // 動画プレイヤーのコンテナに相対配置でボタンを重ねる
  const videoContainer =
    article.querySelector('[data-testid="videoPlayer"]') || hasVideo.parentElement;
  if (!videoContainer) return;

  const wrapper = document.createElement("div");
  wrapper.className = "xvs-btn-wrapper";
  wrapper.appendChild(createButton(tweetId));

  videoContainer.style.position = videoContainer.style.position || "relative";
  videoContainer.appendChild(wrapper);
}

function scan() {
  const articles = document.querySelectorAll('article[data-testid="tweet"]');
  articles.forEach(processArticle);
}

// 初回スキャン
scan();

// X はSPAで動的にDOMが差し替わるため MutationObserver で監視
const observer = new MutationObserver(() => {
  scan();
});
observer.observe(document.body, { childList: true, subtree: true });
