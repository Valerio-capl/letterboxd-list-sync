// glues the modules together

let syncRunning = false;

async function runSync(sourceUrl) {
  const content = new Content();

  // the id of the receiver is read from its posters, so the list needs at least one film;
  const filmListId = content.getFilmListId();
  if (!filmListId) {
    throw new Error("Open the destination list page (it must contain at least one film).");
  }

  // same origin as the current page, otherwise the fetch would be blocked;
  const source = new URL(new URL(sourceUrl).pathname, location.origin).href;
  if (content._fixUrl(source) === content.BaseUrl) {
    throw new Error("The source list is the same as the destination list.");
  }

  const sourceList = await content.getList(source);
  if (sourceList.size === 0) {
    throw new Error("The source list is empty, or the link is not a list.");
  }
  const receiverList = await content.getList();
  const missing = new Sync().compare(sourceList, receiverList);
  if (missing.length === 0) return { ok: true, missing: 0 };

  const csvContent = new Csv().build(missing);
  const settings = await content.getListSettings();

  // the browser navigates to the preview page, where the films are confirmed;
  new Importer(content).submitImport({ csvContent, filmListId, ...settings });
  return { ok: true, missing: missing.length };
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "PING") {
    sendResponse({ ok: true });
    return;
  }
  if (message?.type !== "SYNC_LIST") return;
  if (syncRunning) {
    sendResponse({ ok: false, error: "Sync already in progress." });
    return;
  }
  syncRunning = true;
  
  runSync(message.sourceUrl)
    .catch(error => ({ ok: false, error: error.message }))
    .then(result => {
      syncRunning = false;
      sendResponse(result);
    });

  return true;
});