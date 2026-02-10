// Enhanced some.pics embed script
// Based on original work by Adam Newbold, extended by EricMWalk
//
// Usage:
// <script src="https://scripts.brebs.net/some.pics.js?user=USERNAME"></script>
//
// Options:
//   &count=1        â†’ number of images to show (default 1)
//   &alt            â†’ include image alt text
//   &desc           â†’ show image description (Markdown supported)
//   &pretty         â†’ enable rounded corners and shadow
//   &exclude=TOKEN  â†’ hide items by id/url/image src (comma-separated or repeated)
//   &exclude_desc=TEXT â†’ hide items when description contains TEXT (comma-separated or repeated)
//   &domain=example.com â†’ use a custom domain for image links
//
// Questions / feedback: eric@runs.lol

(function () {
  const scriptTag = document.currentScript;
  const url = new URL(scriptTag.src);

  const username = url.searchParams.get("user");
  if (!username) {
    console.error("Missing ?user= parameter in some.pics embed");
    return;
  }

  // === Inject default styles once ===
  if (!document.getElementById("somepics-default-styles")) {
    const style = document.createElement("style");
    style.id = "somepics-default-styles";
    style.textContent = `
      :root {
        --somepics-max-width: 100%;
        --somepics-image-radius: 8px;
        --somepics-image-shadow: 0 2px 6px rgba(0,0,0,0.15);
        --somepics-gap: 0.65rem;
      }

      .somepics_item {
        margin-bottom: var(--somepics-gap);
        margin: 0;
        padding: 0;
        display: inline-block;
      }

      .somepics_link {
        display: inline-block;
        line-height: 0;
        text-decoration: none;
      }

      .somepics_image {
        max-width: var(--somepics-max-width);
        height: auto;
        display: block;
      }

      .somepics_caption {
        margin-top: 0.4rem;
        font-size: var(--somepics-caption-size, 0.95rem);
        color: var(--somepics-caption-color);
        line-height: 1.4;
        text-align: center;
      }
      
      .somepics_caption p {
        margin: 0;
      }

      .somepics_item[data-pretty="true"] .somepics_image {
        border-radius: var(--somepics-image-radius);
        box-shadow: var(--somepics-image-shadow);
      }
    `;
    document.head.appendChild(style);
  }

  // === Flags ===
  const count = parseInt(url.searchParams.get("count") || "1", 10);
  const includeAlt = url.searchParams.has("alt");
  const includeDescription =
    url.searchParams.has("desc") || url.searchParams.has("description");
  const prettyStyle = url.searchParams.has("pretty");
  const excludeTokens = collectListParams(url, [
    "exclude",
    "exclude_id",
    "exclude-id",
  ]);
  const excludeDescTokens = collectListParams(url, [
    "exclude_desc",
    "exclude-desc",
    "exclude_description",
    "exclude-description",
  ]);

  // === Domain override ===
  let customDomain = url.searchParams.get("domain");
  if (!customDomain || customDomain.trim() === "") {
    customDomain = `${username}.some.pics`;
  } else {
    customDomain = customDomain
      .replace(/^https?:\/\//, "")
      .replace(/\/$/, "");
  }

  // === Lightweight Markdown parser ===
  function markdownToHtml(md) {
    if (!md) return "";

    let html = md.trim();

    html = html.replace(
      /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener">$1</a>'
    );
    html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
    html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

    html = html.replace(/\n{2,}/g, "</p><p>");
    html = `<p>${html.replace(/\n/g, "<br>")}</p>`;

    return html;
  }

  fetch(`https://${username}.some.pics/json`)
    .then((res) => res.json())
    .then((feed) => {
      const items = (feed.items || []).filter((item) => !shouldExclude(item));

      items.slice(0, count).forEach((item, index) => {
        const temp = document.createElement("div");
        temp.innerHTML = item.content_html || "";
        const imgTag = temp.querySelector("img");
        if (!imgTag) return;

        // Rewrite item URL
        let itemUrl;
        try {
          const itemURLObj = new URL(item.url);
          itemURLObj.hostname = customDomain;
          itemUrl = itemURLObj.toString();
        } catch {
          const path = item.url.replace(/^https?:\/\/[^/]+/, "");
          itemUrl = `https://${customDomain}${path}`;
        }

        // === Build figure ===
        const figure = document.createElement("figure");
        figure.className = "somepics_item";
        figure.dataset.index = index + 1;
        figure.dataset.user = username;
        figure.dataset.pretty = prettyStyle ? "true" : "false";

        const img = document.createElement("img");
        img.src = imgTag.getAttribute("src");
        img.className = "somepics_image";

        if (includeAlt) img.alt = imgTag.getAttribute("alt") || "";

        const link = document.createElement("a");
        link.href = itemUrl;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.className = "somepics_link";
        link.appendChild(img);

        figure.appendChild(link);

        if (includeDescription && item.content_text) {
          const caption = document.createElement("figcaption");
          caption.className = "somepics_caption";
          caption.innerHTML = markdownToHtml(item.content_text);
          caption.dataset.format = "markdown";
          figure.appendChild(caption);
        }

        scriptTag.parentNode.insertBefore(figure, scriptTag);
      });
    })
    .catch((err) =>
      console.error("Error getting pics from some.pics JSON:", err)
    );

  function collectListParams(parsedUrl, keys) {
    const tokens = [];
    keys.forEach((key) => {
      const values = parsedUrl.searchParams.getAll(key);
      values.forEach((value) => {
        if (!value) return;
        value
          .split(",")
          .map((token) => token.trim())
          .filter(Boolean)
          .forEach((token) => tokens.push(token));
      });
    });
    return tokens;
  }

  function normalizeToken(token) {
    return (token || "").trim().toLowerCase();
  }

  function extractIdFromUrl(maybeUrl) {
    if (!maybeUrl) return "";
    try {
      const parsed = new URL(maybeUrl);
      return parsed.pathname.replace(/^\/+/, "").replace(/\/+$/, "");
    } catch {
      const cleaned = maybeUrl.split("?")[0];
      return cleaned.split("/").filter(Boolean).slice(-1)[0] || "";
    }
  }

  function anyTokenMatches(tokens, values) {
    if (!tokens.length) return false;
    const normalizedValues = values
      .map(normalizeToken)
      .filter((value) => value.length > 0);
    if (!normalizedValues.length) return false;
    return tokens.some((token) => {
      const normalizedToken = normalizeToken(token);
      if (!normalizedToken) return false;
      return normalizedValues.some((value) => value.includes(normalizedToken));
    });
  }

  function shouldExclude(item) {
    if (!excludeTokens.length && !excludeDescTokens.length) return false;

    const itemUrl = item.url || "";
    const itemId = item.id || extractIdFromUrl(itemUrl);
    const contentText = item.content_text || "";

    let imageSrc = "";
    if (item.content_html) {
      try {
        const temp = document.createElement("div");
        temp.innerHTML = item.content_html || "";
        const imgTag = temp.querySelector("img");
        imageSrc = imgTag ? imgTag.getAttribute("src") || "" : "";
      } catch {
        imageSrc = "";
      }
    }

    const matchesExclude = anyTokenMatches(excludeTokens, [
      itemUrl,
      itemId,
      imageSrc,
    ]);
    const matchesDesc = anyTokenMatches(excludeDescTokens, [contentText]);

    return matchesExclude || matchesDesc;
  }
})();
