---
Date: 2026-02-09 15:08
Type: Page
Title: Photos
---

<style>
.photos-grid {
	--somepics-gap: 1rem;
	--somepics-caption-color: var(--muted);
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
	gap: var(--somepics-gap);
	align-items: start;
	margin: 0.75rem 0;
}

.photos-grid .somepics_item {
	display: block;
}

.photos-grid .somepics_caption {
	text-align: left;
}

/* Hide specific image by id/alt/src (uses :has for full figure removal) */
.photos-grid .somepics_item:has(a.somepics_link[href*="698352185cddc"]),
.photos-grid .somepics_item:has(img[alt="header-image"]),
.photos-grid .somepics_item:has(img[src*="698352185cddc"]) {
	display: none !important;
}

/* Fallback if :has isn't supported */
.photos-grid a.somepics_link[href*="698352185cddc"],
.photos-grid img[alt="header-image"],
.photos-grid img[src*="698352185cddc"] {
	display: none !important;
}
.photos-grid a.somepics_link[href*="698352185cddc"] + .somepics_caption,
.photos-grid img[alt="header-image"] + .somepics_caption,
.photos-grid img[src*="698352185cddc"] + .somepics_caption {
	display: none !important;
}
</style>

<div class="photos-grid">
	<script src="https://hunsanger.paste.lol/some-pics.js/raw?user=hunsanger&pretty&count=12"></script>
</div>
