# VideoSaver for X

A Chrome extension for saving videos from X (formerly Twitter) posts. Also
works the same way on Chromium-based browsers such as Brave, Edge, Vivaldi,
and Opera.

English | [日本語](README.ja.md)

> **Disclaimer**
> This project is an unofficial, independently developed tool with no
> affiliation to X Corp. Copyright of videos belongs to the original poster.
> Redistributing or commercially using downloaded videos is not recommended.
> Use at your own risk.
> If X Corp. or a rights holder requests a takedown, it will be handled
> promptly. Please contact us via an Issue or the contact info below.

## Installation

1. Download and extract `VideoSaver-for-X.zip` from
   [**Releases**](https://github.com/jgzmx/VideoSaver-for-X/releases)
2. Open your browser's extensions page and turn on "Developer mode"
   - Chrome: `chrome://extensions`
   - Brave: `brave://extensions`
   - Edge: `edge://extensions`
   - Other Chromium-based browsers have a similar page
3. Click "Load unpacked" and select the extracted folder (the one that
   directly contains `manifest.json`)

See "Usage" below for details on how to use it.

## How it works

The extension retrieves video URLs from the syndication API
(`cdn.syndication.twimg.com`) that X publicly exposes for embed (oEmbed)
display. It doesn't use any login credentials or cookies — only publicly
accessible endpoints that anyone can reach. No header spoofing, rate-limit
evasion, or misuse of authentication is performed.

- Posts from private (locked) accounts or deleted posts cannot be retrieved
- Only videos and GIFs can be retrieved (regular image posts are not
  supported)
- Whether downloading videos itself violates X/Twitter's Terms of Service is
  something you should check and judge for yourself

## Supported languages

The UI language switches automatically based on your browser's display
language (`chrome.i18n`).

- 日本語 (ja)
- English (en) — fallback for unsupported languages
- 한국어 (ko)
- 简体中文 (zh_CN)
- Español (es)

Pull requests adding or improving translations are welcome. Add a
`_locales/<language-code>/messages.json` file.

## For developers: loading from source

Use this if you want to try the latest code directly or contribute.

1. `git clone` this repository, or get it via "Code → Download ZIP"
2. Open your browser's extensions page (see above)
3. Turn on "Developer mode"
4. Click "Load unpacked"
5. Select the folder that directly contains `manifest.json`

## Usage

### Method 1: Timeline button
When you open x.com / twitter.com, a "⬇ Save" button appears on posts that
contain a video. Clicking it automatically downloads the highest-quality
mp4.

### Method 2: Popup
Click the extension icon in the toolbar, paste a post URL, and click "Find
video" to see a list of available qualities — pick the one you want to
download.

## File structure

- `manifest.json` - Extension configuration (Manifest V3)
- `background.js` - Fetches video info and handles downloads
- `content.js` / `content.css` - Timeline save button
- `popup.html` / `popup.js` / `popup.css` - Popup UI
- `i18n.js` - Shared localization logic
- `_locales/` - Translation data for each language
- `LICENSE` - MIT License

## License

MIT License. See [LICENSE](./LICENSE) for details.

## Credits

Claude (Anthropic) was used to help generate the code for this project.

## Takedown requests / Contact

Rights holders or X Corp. representatives who wish to request a takedown or
similar action can reach out via a GitHub Issue. We will respond and act
promptly.
