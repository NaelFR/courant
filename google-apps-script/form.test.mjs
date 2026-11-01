import { readFileSync } from "node:fs";
import vm from "node:vm";
import test from "node:test";
import assert from "node:assert/strict";
import { stripTypeScriptTypes } from "node:module";

const serverCode = readFileSync(new URL("./Code.gs", import.meta.url), "utf8");
const request = (overrides = {}) => ({
  parameter: {
    origin: "https://courantabc.fr", requestId: "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa",
    name: "Jean Dupont", city: "Lille", email: "jean@example.com", phone: "",
    message: "Je souhaite refaire mon installation électrique.", ...overrides,
  }, postData: { length: 500 },
});

function server({ quota = 100, mailError = false, saveError = false } = {}) {
  const rows = [];
  const emails = [];
  const properties = new Map(Object.entries({
    SPREADSHEET_ID: "private-sheet", RECIPIENT_EMAIL: "entreprise@example.com",
    ALLOWED_ORIGINS: "https://courantabc.fr,http://localhost:4321",
  }));
  let released = 0;
  const sheet = {
    getLastRow: () => rows.length,
    appendRow: (row) => {
      if (saveError && rows.length) throw new Error("Unavailable");
      rows.push(row);
    },
    setFrozenRows() {},
    getRange: (row, column) => ({
      setValue: (value) => { rows[row - 1][column - 1] = value; },
      createTextFinder: (value) => ({ matchEntireCell: () => ({
        findNext: () => rows.slice(1).find((item) => item[0] === value) || null,
      }) }),
    }),
  };
  const context = vm.createContext({
    console: { error() {} },
    PropertiesService: { getScriptProperties: () => ({
      getProperty: (key) => properties.get(key) || null,
      setProperty: (key, value) => properties.set(key, value),
    }) },
    SpreadsheetApp: { openById: () => ({ getSheetByName: () => sheet }), flush() {} },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() { released++; } }) },
    MailApp: { getRemainingDailyQuota: () => quota, sendEmail: (email) => {
      if (mailError) throw new Error("Email unavailable");
      emails.push(email);
    } },
    Utilities: { formatDate: () => "2026-11-01" },
    HtmlService: {
      XFrameOptionsMode: { ALLOWALL: "ALLOWALL" },
      createHtmlOutput: (html) => ({ html, setXFrameOptionsMode() { return this; } }),
    },
  });
  vm.runInContext(serverCode, context);
  return { rows, emails, properties, context, released: () => released,
    send: (event = request()) => context.doPost(event).html };
}

test("valid request is saved before acknowledgement, email uses visitor replyTo", () => {
  const app = server();
  assert.match(app.send(), /"ok":true/);
  assert.equal(app.rows.length, 2);
  assert.equal(app.rows[1][7], "Envoyée");
  assert.equal(app.emails.length, 1);
  assert.equal(app.emails[0].replyTo, "jean@example.com");
  assert.equal(app.emails[0].to, "entreprise@example.com");
  assert.equal(app.released(), 1);
});

test("unchanged retry neither duplicates a row nor sends another email", () => {
  const app = server();
  app.send();
  assert.match(app.send(), /"ok":true/);
  assert.equal(app.rows.length, 2);
  assert.equal(app.emails.length, 1);
});

for (const overrides of [
  { origin: "https://other.example" }, { website: "spam" },
  { email: "invalid" }, { message: "short" }, { name: "Jean\nBcc:spam" },
  { requestId: "bad" }, { city: "x".repeat(121) },
]) {
  test(`rejects invalid request: ${Object.keys(overrides)[0]}`, () => {
    const app = server();
    assert.match(app.send(request(overrides)), /Réessayez|réessayez/);
    assert.equal(app.rows.length, 0);
    assert.equal(app.emails.length, 0);
  });
}

test("unavailable sheet never returns success and releases lock", () => {
  const app = server({ saveError: true });
  assert.match(app.send(), /"ok":false/);
  assert.equal(app.emails.length, 0);
  assert.equal(app.released(), 1);
});

for (const options of [{ quota: 0 }, { mailError: true }]) {
  test(`notification failure preserves the request: ${JSON.stringify(options)}`, () => {
    const app = server(options);
    assert.match(app.send(), /"ok":true/);
    assert.equal(app.rows[1][7], "À notifier");
    assert.equal(app.emails.length, 0);
  });
}

test("daily cap refuses new requests but still acknowledges an existing receipt", () => {
  const app = server();
  app.send();
  app.properties.set("DAILY_REQUESTS", JSON.stringify({ day: "2026-11-01", count: 50 }));
  assert.match(app.send(request({ requestId: "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb" })), /"ok":false/);
  assert.match(app.send(), /"ok":true/);
  assert.equal(app.rows.length, 2);
});

test("user content is never executed as spreadsheet formulas or injected into HTML", () => {
  const app = server();
  const html = app.send(request({ name: '=IMPORTXML("example.com")', message: "<script>bad()</script>" }));
  assert.ok(app.rows[1][2].startsWith("'="));
  assert.ok(!html.includes("bad()"));
  const malicious = app.context.response_("https://courantabc.fr", "</script><script>bad()</script>", false).html;
  assert.ok(!malicious.includes("</script><script>bad()"));
});

const clientCode = stripTypeScriptTypes(
  readFileSync(new URL("../src/scripts/quote-form.ts", import.meta.url), "utf8"),
).replace("export function", "function") + "\nexports.initQuoteForms = initQuoteForms;";

function client(configured = true) {
  const handlers = {};
  const button = { disabled: true, textContent: "Envoyer ma demande" };
  const status = { textContent: "" };
  const origin = { value: "" };
  const requestId = { value: "" };
  const control = { readOnly: false };
  let resets = 0;
  let timeout;
  let message;
  const form = {
    dataset: { configured: String(configured) },
    querySelector: (selector) => selector.startsWith("button") ? button :
      selector.includes("status") ? status : selector.includes("origin") ? origin : requestId,
    querySelectorAll: () => [control],
    addEventListener: (type, callback) => { handlers[type] = callback; },
    reportValidity: () => true, setAttribute() {}, removeAttribute() {},
    reset: () => { resets++; origin.value = ""; requestId.value = ""; },
  };
  const context = vm.createContext({
    exports: {}, crypto: { randomUUID: (() => { let id = 0; return () => `uuid-${++id}`; })() },
    document: { querySelectorAll: () => [form], createElement: () => ({}), body: { append() {} } },
    window: { location: { origin: "https://courantabc.fr" }, addEventListener: (_, callback) => { message = callback; } },
    setTimeout: (callback) => { timeout = callback; return 1; }, clearTimeout() {},
  });
  vm.runInContext(clientCode, context);
  context.exports.initQuoteForms();
  return { button, status, form, requestId, control, resets: () => resets,
    submit: () => { let prevented = false; handlers.submit({ preventDefault() { prevented = true; } }); return prevented; },
    timeout: () => timeout(),
    respond: (overrides = {}, responseOrigin = "https://n-example-script.googleusercontent.com") => message({
      origin: responseOrigin,
      data: { type: "courant:quote-result", requestId: requestId.value, ok: true, ...overrides },
    }),
  };
}

test("unconfigured form stays disabled", () => {
  assert.equal(client(false).button.disabled, true);
});

test("client requires matching request and Google origin; explicit receipt resets form", () => {
  const app = client();
  assert.equal(app.submit(), false);
  assert.equal(app.button.disabled, true);
  assert.equal(app.control.readOnly, true);
  assert.equal(app.submit(), true);
  app.respond({}, "https://attacker.example");
  app.respond({ requestId: "another-request" });
  assert.equal(app.resets(), 0);
  app.respond();
  assert.equal(app.resets(), 1);
  assert.equal(app.button.disabled, false);
  assert.equal(app.control.readOnly, false);
  assert.match(app.status.textContent, /bien été reçue/);
});

test("timeout preserves receipt identifier and fields for safe retry; late receipt accepted", () => {
  const app = client();
  const id = app.requestId.value;
  app.submit(); app.timeout();
  assert.equal(app.resets(), 0);
  assert.equal(app.requestId.value, id);
  assert.match(app.status.textContent, /n’a pas pu être confirmée/);
  app.submit();
  assert.equal(app.requestId.value, id);
  app.respond();
  assert.equal(app.resets(), 1);
});

test("server error preserves fields and never displays success", () => {
  const app = client();
  app.submit(); app.respond({ ok: false });
  assert.equal(app.resets(), 0);
  assert.equal(app.button.disabled, false);
  assert.match(app.status.textContent, /n’a pas pu être enregistrée/);
});
