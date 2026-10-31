const SOURCE_URL_KEY = "sourceUrl";

const formEl = document.getElementById("sync-form");
const inputEl = document.getElementById("list-url");
const buttonEl = document.getElementById("sync-button");
const statusEl = document.getElementById("status");
const targetEl = document.getElementById("target");

// returns the first-page URL of a Letterboxd list, or null if it is not a list URL;
function normalizeListUrl(rawUrl) {
  let url;
  try {
    url = new URL((rawUrl || "").trim());
  } catch (error) {
    return null;
  }

  const isLetterboxd = url.hostname === "letterboxd.com" || url.hostname.endsWith(".letterboxd.com");
  if (!isLetterboxd) return null;
  let path = url.pathname.replace(/\/page\/\d+\/?$/, "");
  path = path.replace(/\/+$/, "") + "/";

  // must look like /user/list/list-name/
  if (!/^\/[^/]+\/list\/[^/]+\/$/.test(path)) return null;
  return `${url.origin}${path}`;
}

function setStatus(message, state = "") {
  statusEl.textContent = message;
  statusEl.dataset.state = state;
}

function setInvalid(isInvalid) {
  inputEl.setAttribute("aria-invalid", String(isInvalid));
}

function setLoading(isLoading) {
  buttonEl.disabled = isLoading;
  buttonEl.classList.toggle("is-loading", isLoading);
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

const CONTENT_FILES = ["src/content.js", "src/sync.js", "src/csv.js", "src/import.js", "main.js"];
async function isContentScriptReady(tabId) {
  try {
    const response = await chrome.tabs.sendMessage(tabId, { type: "PING" });
    return response?.ok === true;
  } catch (error) {
    return false;
  }
}

// Asks the content script of the tab to run the whole sync;
async function startSync(tabId, sourceUrl) {
  try {
    await ensureContentScript(tabId);
  } catch (error) {
    throw new Error(`Unable to start the script on the page: ${error.message}`);
  }

  const response = await chrome.tabs.sendMessage(tabId, { type: "SYNC_LIST", sourceUrl });
  if (!response?.ok) {
    throw new Error(response?.error || "Sync unsuccessful.");
  }
  return response;
}

async function ensureContentScript(tabId) {
  if (await isContentScriptReady(tabId)) return;
  await chrome.scripting.executeScript({ target: { tabId }, files: CONTENT_FILES });
}

// Restores the last source link and shows which list is the destination
async function init() {
  const stored = await chrome.storage.local.get(SOURCE_URL_KEY);
  inputEl.value = stored[SOURCE_URL_KEY] || "";
  let targetUrl = null;
  try {
    const tab = await getActiveTab();
    targetUrl = normalizeListUrl(tab?.url);
  } catch (error) {
    // no access to the tab: the check is repeated on submit
  }

  targetEl.textContent = targetUrl
    ? `Destination: ${new URL(targetUrl).pathname}`
    : "Open the destination list on Letterboxd.";
}

formEl.addEventListener("submit", async event => {
  event.preventDefault();

  const sourceUrl = normalizeListUrl(inputEl.value);
  if (!sourceUrl) {
    setInvalid(true);
    setStatus("Enter the link to a list, for example letterboxd.com/utente/list/nomelista/.", "error");
    inputEl.focus();
    return;
  }
  setInvalid(false);

  setLoading(true);
  setStatus("Sync in progress...");

  try {
    const tab = await getActiveTab();
    const targetUrl = normalizeListUrl(tab?.url);
    if (!targetUrl) {
      throw new Error("Open your destination list page on Letterboxd, then press Sync.");
    }
    if (targetUrl === sourceUrl) {
      throw new Error("The source list is the same as the destination list.");
    }

    inputEl.value = sourceUrl;
    await chrome.storage.local.set({ [SOURCE_URL_KEY]: sourceUrl });

    const result = await startSync(tab.id, sourceUrl);
    if (result.missing === 0) {
      setStatus("The lists are already synchronized.", "success");
    } else {
      setStatus(`${result.missing} films to import: check the preview on Letterboxd.`, "success");
    }
  } catch (error) {
    setStatus(error.message, "error");
  } finally {
    setLoading(false);
  }
});

inputEl.addEventListener("input", () => {
  setInvalid(false);
  setStatus("");
});
init();