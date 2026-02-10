/**
 * TAG FEED (Infinite Scroll + Lazy Content Loading)
 *
 * What this script does:
 * 1) Fetches the tag page at /tag/<tag> (e.g., /tag/running)
 * 2) Parses its list of posts (expects: <article><ul><li><a>... <i>DATE</i></li>...</ul></article>)
 * 3) Renders posts in batches (infinite scroll I think the kids call it) as you approach the bottom
 * 4) Limits concurrent post fetches so fast scrolling doesnâ€™t hammer omg.lol servers
 * 5) Allows you to show status of loads at the top of the page out of the total 
 *
 * How to use (example):
 * <div id="tag-feed" data-tag="running" data-batch-size="10" data-concurrent="4" data-show-status="false">Loading...</div>
 * <script src="https://scripts.brebs.net/tag-feed-infinite.js"></script>
 * ??? Questions or comments reach out eric@runs.lol
 */
 
document.addEventListener("DOMContentLoaded", () => {
  const el = document.getElementById("tag-feed");
  if (!el) return;

  const baseUrl = window.location.origin;

  // Require data-tag so the script doesn't accidentally default to "running"
  const tag = el.dataset.tag?.trim();
  if (!tag) {
    console.error("tag-feed: missing data-tag attribute");
    el.textContent = "No tag specified.";
    return;
  }

  // Optional: hide/show status line
  const showStatus = (el.dataset.showStatus ?? "true").toLowerCase() !== "false";
  const authorName = (el.dataset.author || "Chris Hunsanger").trim();

  // How many placeholders to add each time we need more posts
  const batchSize = Math.max(1, Number(el.dataset.batchSize || el.dataset.perPage || 10));

  // Tag index URL on THIS site (same origin)
  const tagPath = `/tag/${encodeURIComponent(tag)}`;
  const parser = new DOMParser();

  // ---- Concurrency limiting (queue) ----
  const MAX_CONCURRENT_FETCHES = Math.max(1, Number(el.dataset.concurrent || 4));
  let inFlight = 0;
  const queue = [];

  function runQueue() {
    while (inFlight < MAX_CONCURRENT_FETCHES && queue.length) {
      const job = queue.shift();
      inFlight++;

      job()
        .catch(() => {})
        .finally(() => {
          inFlight--;
          runQueue();
        });
    }
  }

  function enqueue(job) {
    queue.push(job);
    runQueue();
  }

  // Fetch and return the inner HTML of a post's <article> (or <main> fallback)
  async function fetchPostArticle(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Post fetch failed: ${res.status}`);
    const html = await res.text();
    const doc = parser.parseFromString(html, "text/html");
    const article = doc.querySelector("article") || doc.querySelector("main");
    return article ? article.innerHTML : "<p>(No article found.)</p>";
  }

  // ---- State ----
  let allPosts = []; // Array<{ url: string, date: string }>
  let nextIndex = 0;

  // ---- Elements ----
  const list = document.createElement("div");
  list.className = "tag-entry-list";

  const status = document.createElement("p");
  status.className = "tag-feed-status";
  if (showStatus) status.textContent = "Loading...";

  const sentinel = document.createElement("div");
  sentinel.className = "tag-feed-sentinel";
  sentinel.style.height = "1px";

  // Mount elements (status is optional)
  el.innerHTML = "";
  if (showStatus) el.appendChild(status);
  el.appendChild(list);
  el.appendChild(sentinel);

  // Helper for status updates
  function setStatusText(text) {
    if (!showStatus) return;
    status.textContent = text;
  }
  function setStatusHtml(html) {
    if (!showStatus) return;
    status.innerHTML = html;
  }

  // ---- Lazy loader (loads full post content when entry approaches viewport) ----
  const entryObserver = new IntersectionObserver(
    (entries, obs) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;

        const articleEl = entry.target;
        obs.unobserve(articleEl);

        const url = articleEl.getAttribute("data-url");
        const contentEl = articleEl.querySelector(".tag-entry-content");
        if (!url || !contentEl) continue;

        // Don't load the same entry twice
        if (articleEl.getAttribute("data-loaded") === "1") continue;
        articleEl.setAttribute("data-loaded", "1");

        enqueue(async () => {
          try {
            const content = await fetchPostArticle(url);
            contentEl.innerHTML = content;

            // Encourage image lazy-loading when possible
            contentEl.querySelectorAll("img").forEach((img) => {
              img.loading = "lazy";
              img.decoding = "async";
            });
          } catch (e) {
            console.warn("Error loading post:", url, e);
            articleEl.classList.add("tag-entry-error");
            contentEl.innerHTML =
              `<p class="tag-entry-error-text">Could not load post content.</p>`;
          }
        });
      }
    },
    {
      root: null,
      rootMargin: "800px 0px", // preload buffer
      threshold: 0.01,
    }
  );

  // Render the next batch of placeholders
  function renderBatch() {
    const remaining = allPosts.length - nextIndex;
    if (remaining <= 0) {
      setStatusText(`All posts loaded for "${tag}".`);
      return;
    }

    const batch = allPosts.slice(nextIndex, nextIndex + batchSize);
    nextIndex += batch.length;

    const frag = document.createDocumentFragment();

    batch.forEach((p) => {
      const article = document.createElement("article");
      article.className = "tag-entry";
      article.setAttribute("data-url", p.url);

      article.innerHTML = `
        <div class="tag-entry-meta">
          ${authorName ? `<span class="tag-entry-name">${authorName}</span>` : ""}
          <a class="tag-entry-date-link" href="${p.url}">
            ${
              p.date
                ? `<time class="tag-entry-date">${p.date}</time>`
                : `<span class="tag-entry-date">View post</span>`
            }
          </a>
        </div>
        <div class="tag-entry-content">
          <p class="tag-entry-loading">Loading post...</p>
        </div>
      `;

      frag.appendChild(article);
      entryObserver.observe(article);
    });

    list.appendChild(frag);

    const left = allPosts.length - nextIndex;
    setStatusHtml(
      left > 0
        ? `Loaded ${nextIndex} of ${allPosts.length} posts. <em>Scroll for more...</em>`
        : `All posts loaded for "${tag}".`
    );
  } // renderBatch ends here

  // ---- Infinite scroll trigger (loads next batch when sentinel approaches viewport) ----
  const sentinelObserver = new IntersectionObserver(
    (entries) => {
      const e = entries[0];
      if (!e.isIntersecting) return;
      renderBatch();
    },
    {
      root: null,
      rootMargin: "1200px 0px",
      threshold: 0.01,
    }
  );

  // Fetch the tag index and build allPosts[]
  async function init() {
    setStatusText("Loading...");

    const res = await fetch(tagPath);
    if (!res.ok) throw new Error(`Tag page fetch failed: ${res.status}`);

    const html = await res.text();
    const doc = parser.parseFromString(html, "text/html");

    // Tag template expected:
    // <article class="tag-index"><ul><li><a href="...">Title</a> <i>DATE</i></li>...</ul></article>
	const links = Array.from(doc.querySelectorAll("article.tag-index ul li a, .tag-index ul li a"));
	
    allPosts = links
      .map((a) => {
        const li = a.closest("li");
        if (!li) return null;

        const href = a.getAttribute("href");
        if (!href) return null;

        const dateEl = li.querySelector("i");
        const dateText = dateEl ? dateEl.textContent.trim() : "";

        const fullUrl = new URL(href, baseUrl).toString();
        return { url: fullUrl, date: dateText };
      })
      .filter(Boolean);

    if (!allPosts.length) {
      // If status is hidden, write to container so the user still sees something
      if (showStatus) setStatusText(`No posts found for tag: ${tag}`);
      else el.textContent = `No posts found for tag: ${tag}`;

      sentinelObserver.disconnect();
      return;
    }

    setStatusText(`Found ${allPosts.length} posts for "${tag}". Loading...`);

    sentinelObserver.observe(sentinel);
    renderBatch(); // first batch immediately
  }

  init().catch((err) => {
    console.error(err);
    if (showStatus) setStatusText("Error loading tag feed.");
    else el.textContent = "Error loading tag feed.";
  });
});
