const CARDS = [
  "Krenko, Tin Street Kingpin",
  "Kazuul's Fury",
  "Artifact Mutation",
  "Shamanic Revelation",
  "Spinerock Knoll",
  "Garruk's Uprising",
  "Kodama's Reach",
  "Tamiyo's Safekeeping",
  "Vexing Shusher",
  "Goblin Bombardment",
  "Return of the Wildspeaker",
  "Rogue's Passage",
  "Traverse the Outlands",
  "Chancellor of the Forge",
  "Tendershoot Dryad",
  "Nature's Lore",
];

const SCRYFALL_API = "https://api.scryfall.com/cards/named";

const gallery = document.querySelector("#gallery");
const status = document.querySelector("#status");
const count = document.querySelector("#count");
const template = document.querySelector("#card-template");
const dialog = document.querySelector("#card-dialog");
const dialogContent = document.querySelector("#dialog-content");
const dialogClose = document.querySelector("#dialog-close");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function cardFaces(card) {
  return card.card_faces?.length ? card.card_faces : [card];
}

function imageForCard(card, preferredSize = "normal") {
  if (card.image_uris?.[preferredSize]) return card.image_uris[preferredSize];
  const firstFace = card.card_faces?.find((face) => face.image_uris?.[preferredSize]);
  return firstFace?.image_uris?.[preferredSize] ?? "";
}

function manaCost(card) {
  return cardFaces(card)
    .map((face) => face.mana_cost)
    .filter(Boolean)
    .join(" // ");
}

function typeLine(card) {
  return cardFaces(card)
    .map((face) => face.type_line)
    .filter(Boolean)
    .join(" // ");
}

function oracleText(card) {
  return cardFaces(card)
    .map((face) => {
      const heading = card.card_faces?.length ? `${face.name}${face.mana_cost ? ` ${face.mana_cost}` : ""}` : "";
      return [heading, face.oracle_text].filter(Boolean).join("\n");
    })
    .filter(Boolean)
    .join("\n\n---\n\n");
}

function printingsNote(card) {
  const pieces = [];
  if (card.set_name) pieces.push(card.set_name);
  if (card.collector_number) pieces.push(`#${card.collector_number}`);
  if (card.lang && card.lang !== "en") pieces.push(card.lang.toUpperCase());
  return pieces.join(" · ");
}

function escapeHtml(value = "") {
  return value.replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#039;",
    '"': "&quot;",
  }[char]));
}

function renderOracleText(text) {
  if (!text) return "<p><em>No Oracle text returned by Scryfall.</em></p>";
  return text
    .split("\n")
    .map((line) => {
      if (line === "---") return "<hr />";
      return line ? `<p>${escapeHtml(line)}</p>` : "";
    })
    .join("");
}

function plainOracleText(card) {
  return oracleText(card).replace(/\n---\n/g, "\n").trim() || "No Oracle text returned by Scryfall.";
}

async function fetchCard(name) {
  const exactUrl = `${SCRYFALL_API}?exact=${encodeURIComponent(name)}`;
  let response = await fetch(exactUrl);

  if (response.status === 404) {
    response = await fetch(`${SCRYFALL_API}?fuzzy=${encodeURIComponent(name)}`);
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.details || `Could not find “${name}”.`);
  }

  return response.json();
}

function setStatus(message, isError = false) {
  status.textContent = message;
  status.classList.toggle("error", isError);
}

function createCardTile(card) {
  const node = template.content.firstElementChild.cloneNode(true);
  const img = node.querySelector("img");
  const button = node.querySelector("button");
  const name = node.querySelector("h3");
  const details = node.querySelector(".type-line");
  const preview = node.querySelector(".oracle-preview");

  img.src = imageForCard(card, "normal");
  img.alt = `${card.name} card image`;
  name.textContent = card.name;
  details.textContent = typeLine(card) || printingsNote(card) || "Tap image for larger card";
  preview.textContent = plainOracleText(card);
  button.addEventListener("click", () => openCardDialog(card));

  return node;
}

function openCardDialog(card) {
  const faces = cardFaces(card);
  const images = faces
    .map((face) => face.image_uris?.large || face.image_uris?.normal)
    .filter(Boolean);

  dialogContent.innerHTML = `
    <article class="dialog-card">
      <div class="dialog-images">
        ${images.map((src) => `<img src="${src}" alt="${escapeHtml(card.name)} card image" />`).join("")}
      </div>
      <div class="dialog-copy">
        <h2>${escapeHtml(card.name)}</h2>
        <p><strong>${escapeHtml(manaCost(card))}</strong></p>
        <p>${escapeHtml(typeLine(card))}</p>
        <div class="oracle-text">${renderOracleText(oracleText(card))}</div>
        ${card.power || card.loyalty ? `<p><strong>${escapeHtml([card.power && `${card.power}/${card.toughness}`, card.loyalty && `Loyalty ${card.loyalty}`].filter(Boolean).join(" · "))}</strong></p>` : ""}
        <p>${escapeHtml(printingsNote(card))}</p>
        <p><a href="${card.scryfall_uri}" target="_blank" rel="noreferrer">Open on Scryfall</a></p>
      </div>
    </article>
  `;
  dialog.showModal();
}

async function loadCards() {
  gallery.innerHTML = "";
  count.textContent = `${CARDS.length} cards`;
  setStatus("Loading tournament reference…");

  const missing = [];

  for (const [index, name] of CARDS.entries()) {
    setStatus(`Loading ${index + 1}/${CARDS.length}: ${name}`);
    try {
      const card = await fetchCard(name);
      gallery.append(createCardTile(card));
      // Scryfall asks clients to avoid aggressive parallel requests.
      await sleep(80);
    } catch (error) {
      missing.push(`${name}: ${error.message}`);
    }
  }

  setStatus(
    missing.length ? `Some cards were not found: ${missing.join("; ")}` : "Official Oracle text ready",
    missing.length > 0,
  );
}

function initialize() {
  dialogClose.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });

  loadCards();
}

initialize();
