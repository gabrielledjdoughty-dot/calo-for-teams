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
var EMPLOYER_SHEET  = 'Sample Requests';
var EMPLOYEES_SHEET = 'Employee Rosters';

// ── Column headers ───────────────────────────────────────────────
var EMPLOYER_HEADERS  = ['Timestamp', 'Business Name', 'Address', 'Delivery Instructions', 'Email', 'Phone', 'Wants Samples', 'Delivery Date', 'Diet Preferences'];
var EMPLOYEE_HEADERS  = ['Timestamp', 'Submission ID', 'Company Name', 'Row #', 'Full Name', 'Work Email', 'Phone', 'Dietary Preference', 'Allergies', 'Delivery Days'];

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

  if (data.type === 'employer') {
    // ── Sample request form ──────────────────────────────────
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

  } else if (data.type === 'employees') {
    // ── Employee roster form ─────────────────────────────────
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
