// ── Sheet names ──────────────────────────────────────────────────
var SAMPLES_SHEET   = 'Sample Requests';
var EMPLOYEES_SHEET = 'Employee Rosters';
var SPREADSHEET_NAME = 'Calo for Teams - Form Data';

// ── Column headers ────────────────────────────────────────────────
var SAMPLES_HEADERS   = ['Timestamp', 'Business Name', 'Office Address', 'Contact Name', 'Work Email', 'Phone', 'Delivery Date', 'Company Size', 'Dietary Preferences', 'Delivery Instructions'];
var EMPLOYEE_HEADERS  = ['Timestamp', 'Submission ID', 'Company Name', 'Row #', 'Full Name', 'Work Email', 'Phone', 'Dietary Preference', 'Allergies', 'Delivery Days'];
var COMPANY_HEADERS   = ['Timestamp', 'Full Name', 'Work Email', 'Phone', 'Dietary Preference', 'Allergies', 'Delivery Days'];

// ── Find or create the spreadsheet ───────────────────────────────
function getSpreadsheet() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('SPREADSHEET_ID');
  if (id) {
    try { return SpreadsheetApp.openById(id); } catch(e) {}
  }
  var ss = SpreadsheetApp.create(SPREADSHEET_NAME);
  props.setProperty('SPREADSHEET_ID', ss.getId());
  return ss;
}

// ── Get or create a sheet with headers ───────────────────────────
function getOrCreateSheet(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length)
      .setBackground('#104B34')
      .setFontColor('#ffffff')
      .setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// ── Shared handler ────────────────────────────────────────────────
function handleData(data) {
  var ss = getSpreadsheet();
  var ts = new Date().toISOString();

  if (data.type === 'samples') {
    var sheet = getOrCreateSheet(ss, SAMPLES_SHEET, SAMPLES_HEADERS);
    sheet.appendRow([
      ts,
      data.business_name         || '',
      data.office_address        || '',
      data.contact_name          || '',
      data.work_email            || '',
      data.phone_number          || '',
      data.delivery_date         || '',
      data.company_size          || '',
      data.dietary_preferences   || '',
      data.delivery_instructions || ''
    ]);

  } else if (data.type === 'employee') {
    var companyName = (data.company_name || 'Unknown Company').toString().trim();
    var tabName = companyName.replace(/[\[\]\*\?\/\\]/g, '').substring(0, 100).trim() || 'Unknown Company';
    var sheet = getOrCreateSheet(ss, tabName, COMPANY_HEADERS);
    sheet.appendRow([
      ts,
      data.name      || '',
      data.email     || '',
      data.phone     || '',
      data.diet      || '',
      data.allergies || '',
      data.days      || ''
    ]);

  } else if (data.type === 'employees') {
    var sheet = getOrCreateSheet(ss, EMPLOYEES_SHEET, EMPLOYEE_HEADERS);
    var companyName = data.company_name || '';
    var submissionId = ts + '-' + Math.random().toString(36).substr(2, 6).toUpperCase();
    (data.employees || []).forEach(function(emp, i) {
      sheet.appendRow([
        ts, submissionId, companyName, i + 1,
        emp.name      || '',
        emp.email     || '',
        emp.phone     || '',
        emp.diet      || '',
        emp.allergies || '',
        emp.days      || ''
      ]);
    });
  }

  return respond({ result: 'success' });
}

// ── HTTP handlers ─────────────────────────────────────────────────
function doGet(e) {
  try {
    var raw = e.parameter.data || e.queryString;
    if (!raw) return respond({ result: 'error', message: 'no data' });
    var data = JSON.parse(decodeURIComponent(raw));
    return handleData(data);
  } catch (err) {
    return respond({ result: 'error', message: err.toString() });
  }
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    return handleData(data);
  } catch (err) {
    return respond({ result: 'error', message: err.toString() });
  }
}

function respond(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
