// Parses the offline membership sheet (exported as CSV) into rows for
// POST /bookings/booking/offline/import. Header names are matched loosely so
// the sheet can be exported from Excel/Google Sheets without renaming columns.

const HEADER_ALIASES = {
  fullname: ["name", "fullname", "full name", "member", "member name", "customer name"],
  phone: ["phone", "mobile", "mobile no", "phone no", "contact", "contact no", "mobile number"],
  email: ["email", "email id"],
  purchaseDate: ["date", "purchase date", "booking date", "membership date"],
  membershipNumber: ["membership no", "membership number", "membership", "card no", "membership id"],
  leadSource: ["source", "lead source", "reference", "lead"],
  salesPerson: ["sales person", "salesperson", "sold by", "executive", "sales"],
  branch: ["branch", "location", "city", "centre", "center"],
  amount: ["amount", "price", "selling cost", "paid", "amount paid"],
  paymentMode: ["payment mode", "mode", "payment", "payment method"],
  remarks: ["remarks", "remark", "notes", "comment"],
};

const clean = (value) => String(value ?? "").replace(/\s+/g, " ").trim();
const headerKey = (header) => {
  const normalized = clean(header).toLowerCase().replace(/[._]/g, " ").replace(/\s+/g, " ");
  return Object.keys(HEADER_ALIASES).find((key) => HEADER_ALIASES[key].includes(normalized));
};

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  const source = text.replace(/^﻿/, "");
  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (quoted) {
      if (char === '"' && source[i + 1] === '"') { field += '"'; i += 1; }
      else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") { row.push(field); field = ""; }
    else if (char === "\n" || char === "\r") {
      if (char === "\r" && source[i + 1] === "\n") i += 1;
      row.push(field); rows.push(row); row = []; field = "";
    } else field += char;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  return rows.filter((cells) => cells.some((cell) => clean(cell) !== ""));
}

export function csvToImportRows(text) {
  const [header = [], ...body] = parseCsv(text);
  const keys = header.map(headerKey);
  const missing = ["fullname", "phone", "purchaseDate", "membershipNumber"].filter((key) => !keys.includes(key));
  if (missing.length) {
    throw new Error("Missing required column(s): " + missing.join(", ") + ". Expected headers like Name, Phone, Date, Membership No.");
  }
  return body.map((cells) => {
    const row = {};
    keys.forEach((key, index) => { if (key) row[key] = clean(cells[index]); });
    return row;
  });
}
