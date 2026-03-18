/**
 * CALO FOR TEAMS — Google Apps Script
 * ─────────────────────────────────────────────────────────────────
 * HOW TO DEPLOY:
 *
 * 1. Go to https://script.google.com and click "New project"
 * 2. Delete the existing code and paste ALL of this file in
 * 3. Click "Save" (give it a name like "Calo for Teams")
 * 4. Click "Deploy" → "New deployment"
 * 5. Choose type: "Web app"
 * 6. Set:
 *      Execute as:  Me
 *      Who has access:  Anyone
 * 7. Click "Deploy" and authorise when prompted
 * 8. Copy the Web app URL (looks like https://script.google.com/macros/s/ABC.../exec)
 * 9. Paste that URL into employee-signup.html where it says:
 *      const SHEETS_URL = 'PASTE_YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';
 * ─────────────────────────────────────────────────────────────────
 */

// ── Sheet names ──────────────────────────────────────────────────
var SAMPLES_SHEET   = 'Sample Requests';
var EMPLOYER_SHEET  = 'Sample Requests';   // alias kept for safety
var EMPLOYEES_SHEET = 'Employee Rosters';  // legacy bulk-submit tab

// ── Column headers ───────────────────────────────────────────────
var SAMPLES_HEADERS   = ['Timestamp', 'Business Name', 'Office Address', 'Contact Name', 'Work Email', 'Phone', 'Delivery Date', 'Company Size', 'Dietary Preferences', 'Delivery Instructions'];
var EMPLOYER_HEADERS  = ['Timestamp', 'Business Name', 'Address', 'Delivery Instructions', 'Email', 'Phone', 'Wants Samples', 'Delivery Date', 'Diet Preferences'];
var EMPLOYEE_HEADERS  = ['Timestamp', 'Submission ID', 'Company Name', 'Row #', 'Full Name', 'Work Email', 'Phone', 'Dietary Preference', 'Allergies', 'Delivery Days'];
var COMPANY_HEADERS   = ['Timestamp', 'Full Name', 'Work Email', 'Phone', 'Dietary Preference', 'Allergies', 'Delivery Days'];

// ── Handle GET requests (used by employee-signup.html) ───────────
function doGet(e) {
  try {
    var raw  = e.parameter.data;
    if (!raw) return respond({ result: 'error', message: 'No data param' });
    var data = JSON.parse(decodeURIComponent(raw));
    return handleData(data);
  } catch (err) {
    return respond({ result: 'error', message: err.toString() });
  }
}

// ── Handle POST requests ─────────────────────────────────────────
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    return handleData(data);
  } catch (err) {
    return respond({ result: 'error', message: err.toString() });
  }
}

// ── Shared logic ─────────────────────────────────────────────────
function handleData(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ts = new Date().toISOString();

  if (data.type === 'samples') {
    // ── Sample request form (get-samples.html) ───────────────
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

  } else if (data.type === 'employer') {
    // ── Legacy sample request (old field names) ──────────────
    var sheet = getOrCreateSheet(ss, EMPLOYER_SHEET, EMPLOYER_HEADERS);
    sheet.appendRow([
      ts,
      data.businessName         || '',
      data.address              || '',
      data.deliveryInstructions || '',
      data.email                || '',
      data.phone                || '',
      data.wantsSamples         || '',
      data.deliveryDate         || '',
      (data.diets || []).join(', ')
    ]);

  } else if (data.type === 'employee') {
    // ── Individual employee self-registration ────────────────
    // Route into a company-specific tab named after the company
    var companyName = (data.company_name || 'Unknown Company').toString().trim();
    var tabName     = sanitiseTabName(companyName);
    var sheet       = getOrCreateSheet(ss, tabName, COMPANY_HEADERS);
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
    // ── Legacy bulk-submit (admin adds all rows at once) ─────
    var sheet        = getOrCreateSheet(ss, EMPLOYEES_SHEET, EMPLOYEE_HEADERS);
    var companyName  = data.company_name || '';
    var submissionId = ts + '-' + Math.random().toString(36).substr(2, 6).toUpperCase();

    (data.employees || []).forEach(function(emp, i) {
      sheet.appendRow([
        ts,
        submissionId,
        companyName,
        i + 1,
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

// ── Helpers ──────────────────────────────────────────────────────

function sanitiseTabName(name) {
  // Google Sheets tab names: max 100 chars, no [ ] * ? / \
  return name.replace(/[\[\]\*\?\/\\]/g, '').substring(0, 100).trim() || 'Unknown Company';
}

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

function respond(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
