class Importer {
  constructor(content) {
    this.content = content;
    this.ImportUrl = new URL("/import/list/", location.origin).href;
    this.MaxCsvBytes = 1_000_000;
    this.ValidSchemas = [
      ["Name", "Year"],
      ["Name", "Year", "URL"],
      ["Position", "Name", "Year"],
      ["Position", "Name", "Year", "URL"],
      ["Position", "Name", "Year", "URL", "Description"],
    ];
  }

  // checks the csv string;
  _checkCsv(csvContent) {
    if (!csvContent || !csvContent.trim()) throw new Error("empty CSV.");
    if (new Blob([csvContent]).size > this.MaxCsvBytes) {
      throw new Error("CSV size exceeded.");
    }

    const lines = csvContent.replace(/^\uFEFF/, "").split(/\r?\n/).filter(line => line.trim());
    const columns = lines[0].split(",").map(column => column.trim().replace(/^"(.*)"$/, "$1"));
    const validHeader = this.ValidSchemas.some(schema =>
      schema.length === columns.length &&
      schema.every((column, i) => column === columns[i])
    );
    if (!validHeader) throw new Error(`Invalid CSV header: ${lines[0]}`);
    if (lines.length < 2) throw new Error("CSV has no films.");
  }

  // sends the csv to letterboxd, the browser then navigates to the preview page;
  submitImport({ csvContent, filmListId, name, notes = "", publicList = false, sharePolicy = "You", numberedList = false }) {
    if (!/(\.|^)letterboxd\.com$/i.test(location.hostname)) throw new Error(" open Letterboxd first.");
    if (!filmListId) throw new Error("filmListId missing.");
    if (!name) throw new Error("list name missing.");
    this._checkCsv(csvContent);

    const csrf = this.content.getCsrf(true);
    if (!csrf) {
      throw new Error("CSRF token not found in the #signin form: open a standard Letterboxd list page (not /edit/).");
    }

    const fields = { filmListId, __csrf: csrf, name, notes, publicList, sharePolicy, numberedList };
    const form = document.createElement("form");
    form.method = "POST";
    form.action = this.ImportUrl;
    form.enctype = "multipart/form-data";
    form.style.display = "none";

    for (const [key, value] of Object.entries(fields)) {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = String(value);
      form.appendChild(input);
    }

    const transfer = new DataTransfer();
    transfer.items.add(new File([csvContent], "missing-films.csv", { type: "text/csv" }));
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.name = "file";
    fileInput.files = transfer.files;
    form.appendChild(fileInput);

    document.body.appendChild(form);
    HTMLFormElement.prototype.submit.call(form);
  }
}