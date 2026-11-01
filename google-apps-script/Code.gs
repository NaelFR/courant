// Configure Script Properties, run setup once, then deploy as a public web app.
var HEADERS_ = ["Identifiant", "Date", "Nom", "Commune", "Email", "Téléphone", "Message", "Notification"];

function config_() {
  var properties = PropertiesService.getScriptProperties();
  var config = {
    properties: properties,
    spreadsheetId: properties.getProperty("SPREADSHEET_ID"),
    recipient: properties.getProperty("RECIPIENT_EMAIL"),
    origins: (properties.getProperty("ALLOWED_ORIGINS") || "").split(",").map(function (s) { return s.trim(); }).filter(Boolean),
  };
  if (!config.spreadsheetId || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.recipient || "") || !config.origins.length) {
    throw new Error("Configurer SPREADSHEET_ID, RECIPIENT_EMAIL et ALLOWED_ORIGINS.");
  }
  config.origins.forEach(function (origin) {
    if (!/^https:\/\/[a-z0-9.-]+(?::\d+)?$/i.test(origin) && !/^http:\/\/localhost:\d+$/.test(origin)) {
      throw new Error("Origine invalide : fournir le protocole et le domaine, sans chemin ni slash final.");
    }
  });
  return config;
}

function sheet_(config) {
  var spreadsheet = SpreadsheetApp.openById(config.spreadsheetId);
  var sheet = spreadsheet.getSheetByName("Demandes de devis") || spreadsheet.insertSheet("Demandes de devis");
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS_);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// Run manually in the editor to initialize the sheet and grant permissions.
function setup() {
  sheet_(config_());
  MailApp.getRemainingDailyQuota();
}

function doGet() {
  return HtmlService.createHtmlOutput("Ce service reçoit les demandes de devis du site Courant.");
}

function doPost(event) {
  var params = (event && event.parameter) || {};
  var origin = "";
  var ok = false;
  try {
    var config = config_();
    if (config.origins.indexOf(params.origin) === -1) throw new Error("Origine refusée.");
    origin = params.origin;
    if (!event.postData || event.postData.length > 40000) throw new Error("Requête invalide.");
    var data = validate_(params);
    save_(config, data);
    ok = true;
  } catch (error) {
    // Do not log the payload: it contains personal information.
    console.error("Demande non confirmée : " + error.message);
  }
  return response_(origin, params.requestId, ok);
}

function validate_(params) {
  if (params.website) throw new Error("Champ antispam renseigné.");
  var data = {};
  ["name", "city", "email", "phone", "message", "requestId"].forEach(function (key) {
    data[key] = String(params[key] || "").trim();
  });
  if (!/^[a-f0-9-]{36}$/i.test(data.requestId)) throw new Error("Identifiant invalide.");
  if (!data.name || data.name.length > 120 || !data.city || data.city.length > 120 ||
      data.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) ||
      data.phone.length > 40 || data.message.length < 10 || data.message.length > 5000 ||
      /[\r\n\x00]/.test(data.name + data.city + data.email + data.phone)) {
    throw new Error("Champs invalides.");
  }
  return data;
}

// Prevent spreadsheet formulas from being executed from visitor-controlled cells.
function cell_(value) {
  return /^[=+@\-\t\r]/.test(value) ? "'" + value : value;
}

function save_(config, data) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sheet = sheet_(config);
    var lastRow = sheet.getLastRow();
    if (lastRow > 1 && sheet.getRange(2, 1, lastRow - 1, 1).createTextFinder(data.requestId).matchEntireCell(true).findNext()) {
      return; // An unchanged retry must neither append a row nor send another email.
    }
    var day = Utilities.formatDate(new Date(), "Europe/Paris", "yyyy-MM-dd");
    var counter = JSON.parse(config.properties.getProperty("DAILY_REQUESTS") || "{}");
    var count = counter.day === day ? Number(counter.count) || 0 : 0;
    if (count >= 50) throw new Error("Limite quotidienne atteinte.");
    // This public endpoint has a honeypot and a global cap, not a CAPTCHA.
    config.properties.setProperty("DAILY_REQUESTS", JSON.stringify({ day: day, count: count + 1 }));
    sheet.appendRow([
      data.requestId, new Date(), cell_(data.name), cell_(data.city), cell_(data.email),
      cell_(data.phone), cell_(data.message), "À notifier",
    ]);
    SpreadsheetApp.flush(); // Receipt is confirmed only after durable storage.
    var row = sheet.getLastRow();
    try {
      if (MailApp.getRemainingDailyQuota() < 1) throw new Error("Quota email atteint.");
      MailApp.sendEmail({
        to: config.recipient,
        replyTo: data.email,
        subject: "Courant — Nouvelle demande de devis",
        body: "Nom : " + data.name + "\nCommune : " + data.city + "\nEmail : " + data.email +
          "\nTéléphone : " + (data.phone || "Non renseigné") + "\n\n" + data.message +
          "\n\nRéférence : " + data.requestId,
        name: "Courant — Demandes de devis",
      });
      sheet.getRange(row, 8).setValue("Envoyée");
    } catch (error) {
      console.error("Notification non confirmée ; consulter les lignes À notifier.");
      // The request remains recorded and the visitor can receive a valid receipt.
    }
  } finally {
    lock.releaseLock();
  }
}

function response_(origin, requestId, ok) {
  var payload = JSON.stringify({
    type: "courant:quote-result",
    requestId: String(requestId || "").slice(0, 36),
    ok: ok,
  }).replace(/</g, "\\u003c");
  var target = JSON.stringify(origin).replace(/</g, "\\u003c");
  var message = ok ? "Votre demande a bien été reçue." : "La demande n’a pas pu être enregistrée. Contactez l’entreprise directement ou réessayez.";
  var html = '<!doctype html><html lang="fr"><meta charset="utf-8"><title>Demande de devis</title><body><p>' + message + '</p>';
  if (origin) html += '<script>window.top.postMessage(' + payload + ',' + target + ');</script>';
  return HtmlService.createHtmlOutput(html + '</body></html>')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
