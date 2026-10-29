
class Content{
  constructor() {
    this.BaseUrl = this._fixUrl(document.URL);
    this.boxdBaseUrl = "https://boxd.it"
    this.parser = new DOMParser();
    this._csrf = null;
  }

  // reads a list and returns Map<boxd_id, [title, year, url]>;
  async getList(listUrl = this.BaseUrl){
    const baseUrl = this._fixUrl(listUrl);
    if (!baseUrl) throw new Error(`Not a Letterboxd URL: ${listUrl}`);

    const list = new Map();
    let skipped = 0;
    const failedPages = [];

    const firstDom = await this._fetchHtml(baseUrl);
    skipped += this._fillList(firstDom, list);

    const Pages = this._getPages(baseUrl, firstDom).slice(1);
    for (const page of Pages) {
      try {
        const dom = await this._fetchHtml(page);
        skipped += this._fillList(dom, list);
      } catch (error) {
        console.error(`Failed to load ${page}:`, error);
        failedPages.push(page);
      }
    }
    
    if (skipped > 0) {
      console.warn(`Skipped ${skipped} invalid film(s)`);
    }
    if (failedPages.length > 0) {
      console.warn(`List is incomplete, ${failedPages.length} page(s) failed:`, failedPages);
    }

    return list;
  }

  // fills the map in place, return number of skipped films;
  _fillList(dom, FilmList){
    let skipped = 0;
    dom.querySelectorAll("li.posteritem").forEach(poster => {
      const film = this._parsePoster(poster);
      if (film) {
        const [key, value] = film;
        FilmList.set(key, value);
      } else {
        skipped++;
      }
    });
    return skipped;
  }

  //  get urls of list's pages;
  _getPages(baseUrl, dom){
    const PagesUrls = [this.BaseUrl];
    const div_pages = document.querySelector(".pagination .paginate-pages");
    if (!div_pages) return PagesUrls;

    const pageItems = div_pages.querySelectorAll("li.paginate-page");
    const lastItem = pageItems[pageItems.length - 1];
    const lastPageNum = Number(lastItem?.textContent.trim());
    for (let i = 2; i <= lastPageNum; i++) {
      PagesUrls.push(`${this.BaseUrl}page/${i}/`);
    }
    return PagesUrls;
  }

  // from the poster element get all data needed;
  _parsePoster(poster){
    const div = poster.querySelector("div.react-component");
    if (!div) return null;

    const data = div.dataset;
    const rawTitle = data.itemName;
    const posterPath = this.safeParseJson(data.resolvablePosterPath);
    const boxd_id = posterPath?.postered?.lid;
    if (!rawTitle || !boxd_id) return null;

    const {title, year} = this._parseTitleYear(rawTitle);
    const url = boxd_id ? `${this.boxdBaseUrl}/${boxd_id}` : null;
    return [boxd_id, [title, year, url]];
  }

  // use regex to get title and year from raw title: "title (year)";
  _parseTitleYear(raw_name){
    if(!raw_name) return null;
    const match = raw_name.match(/^(.*?)\s*\((\d{4})\)$/);
    if (match) {
      return { title: match[1].trim(), year: match[2] };
    }
    return {title: raw_name, year: null};
  }

  // reads the token from the live DOM and keeps it in memory
  captureCsrf() {
    const input = document.querySelector('#signin input[name="__csrf"]');
    const token = input?.value?.trim();
    if (!token || /placeholder/i.test(token)) {
      this._csrf = null;
      return false;
    }
    this._csrf = token;
    return true;
  }

  getCsrf(refresh = false) {
    if (refresh || !this._csrf) this.captureCsrf();
    return this._csrf;
  }

  // numeric id of the list from data-list-identifier ("filmlist:89000779"), null if the list is empty;
  getFilmListId(root = document) {
    const div = root.querySelector("div.react-component[data-list-identifier]");
    const identifier = this.safeParseJson(div?.dataset.listIdentifier);
    const match = /^filmlist:(\d+)$/.exec(identifier?.uid ?? "");
    return match ? match[1] : null;
  }

  safeParseJson(raw) {
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (error){ return null;}
  }

  _fixUrl(rawUrl) {
    const url = new URL(rawUrl);
    let path = url.pathname.replace(/\/page\/\d+\/?$/, "");
    path = path.replace(/\/+$/, "") + "/";
    return `${url.origin}${path}`;
  }

  async _fetchHtml(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status} on ${url}`);
    const html = await response.text();
    return this.parser.parseFromString(html, "text/html");
  }
}
