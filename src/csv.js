class Csv {
  constructor() {
    this.Header = ["Position", "Name", "Year", "URL", "Description"];
  }
  // builds the csv string from the films returned by Sync.compare(); 
  build(films) {
    if (!films || films.length === 0) return null;
    const rows = films.map((film, i) => {
      const row = [i + 1, film.title, film.year, film.url, ""];
      return row.map(cell => this._escape(cell)).join(",");
    });

    return [this.Header.join(","), ...rows].join("\r\n");
  }

  // quotes the cell if it has a comma, a quote or a line break, quotes inside are doubled;
  _escape(value) {
    const text = value === null || value === undefined ? "" : String(value);
    if (/[",\r\n]/.test(text)) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  }
}