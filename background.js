// background.js
// X(旧Twitter)が埋め込み表示(oEmbed)のために公開している
// syndication API から動画情報を取得します。ログインや認証情報は一切使わず、
// 誰でもアクセスできる公開エンドポイントのみを利用します。

const SYNDICATION_ENDPOINT = "https://cdn.syndication.twimg.com/tweet-result";

// syndication API が要求する token パラメータの計算式。
// 埋め込みウィジェット(widgets.js)が使っているものと同じ公開の計算方法です。
function computeToken(tweetId) {
  const num = Number(tweetId) / 1e15;
  return (num * Math.PI).toString(36).replace(/(0+|\.)/g, "");
}

async function fetchTweetVideoInfo(tweetId) {
  const token = computeToken(tweetId);
  const url = `${SYNDICATION_ENDPOINT}?id=${tweetId}&token=${token}`;

  const res = await fetch(url, { method: "GET" });
  if (!res.ok) {
    throw new Error(chrome.i18n.getMessage("errFetchFailed", [String(res.status)]));
  }
  const data = await res.json();

  if (data.__typename === "TweetTombstone") {
    throw new Error(chrome.i18n.getMessage("errTombstone"));
  }

  // media は data.mediaDetails または data.video に入っている場合がある
  const mediaList = data.mediaDetails || data.entities?.media || [];
  const variantsSets = [];

  for (const media of mediaList) {
    const variants = media?.video_info?.variants;
    if (variants && variants.length) {
      variantsSets.push(variants);
    }
  }
  // ルート直下に video がある場合(古い形式)にも対応
  if (data.video?.variants?.length) {
    variantsSets.push(data.video.variants);
  }

  if (variantsSets.length === 0) {
    throw new Error(chrome.i18n.getMessage("errNoVideoFound"));
  }

  // 複数動画がある場合は最初の動画を対象にする(ポップアップでは全件返す)
  const results = variantsSets.map((variants) => {
    const mp4s = variants
      .filter((v) => v.content_type === "video/mp4" && v.url)
      .map((v) => ({ url: v.url, bitrate: v.bitrate || 0 }))
      .sort((a, b) => b.bitrate - a.bitrate);
    return mp4s;
  });

  return { tweetId, text: data.text || "", variantsSets: results };
}

function guessFilename(tweetId, index) {
  const suffix = index > 0 ? `_${index + 1}` : "";
  return `${tweetId}${suffix}.mp4`;
}

async function downloadVariant(tweetId, videoIndex, url, bitrate) {
  const filename = guessFilename(tweetId, videoIndex);
  const downloadId = await chrome.downloads.download({
    url,
    filename,
    saveAs: false,
  });
  return downloadId;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    try {
      if (message.type === "GET_VIDEO_INFO") {
        const info = await fetchTweetVideoInfo(message.tweetId);
        sendResponse({ ok: true, data: info });
      } else if (message.type === "DOWNLOAD_BEST") {
        const info = await fetchTweetVideoInfo(message.tweetId);
        const first = info.variantsSets[0];
        if (!first || first.length === 0) {
          throw new Error(chrome.i18n.getMessage("errNoDownloadableVideo"));
        }
        const best = first[0];
        const id = await downloadVariant(message.tweetId, 0, best.url, best.bitrate);
        sendResponse({ ok: true, downloadId: id });
      } else if (message.type === "DOWNLOAD_VARIANT") {
        const id = await downloadVariant(
          message.tweetId,
          message.videoIndex || 0,
          message.url,
          message.bitrate
        );
        sendResponse({ ok: true, downloadId: id });
      } else {
        sendResponse({ ok: false, error: "unknown message type" });
      }
    } catch (err) {
      sendResponse({ ok: false, error: err.message || String(err) });
    }
  })();
  return true; // 非同期で sendResponse を呼ぶため
});
