/**
 * Google Apps Script for Wedding RSVP
 * Replace SHEET_ID and SHEET_NAME before deploying.
 */
const SHEET_ID = 'YOUR_SHEET_ID';
const SHEET_NAME = 'RSVPs';
const DUPLICATE_WINDOW_MINUTES = 10;

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const required = ['fullName', 'email', 'attendance'];
    for (const field of required) {
      if (!data[field]) throw new Error('Missing field: ' + field);
    }

    // Duplicate submission prevention
    const props = PropertiesService.getScriptProperties();
    const key = (data.email + data.fullName).toLowerCase();
    const now = Date.now();
    const last = Number(props.getProperty(key));
    if (last && now - last < DUPLICATE_WINDOW_MINUTES * 60 * 1000) {
      return ContentService.createTextOutput(JSON.stringify({ ok: false, error: 'Duplicate submission' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    props.setProperty(key, String(now));

    const ss = SpreadsheetApp.openById(SHEET_ID);
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) sheet = ss.insertSheet(SHEET_NAME);

    const row = [
      new Date(),
      data.fullName,
      data.email,
      data.attendance,
      Number(data.guestsCount || 0),
      data.mealPreference || '',
      data.songRequest || '',
      data.message || ''
    ];
    sheet.appendRow(row);

    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Deployment instructions:
 * 1. Open Google Sheets and create a sheet.
 * 2. Extensions → Apps Script → New project; paste this code.
 * 3. Replace SHEET_ID and SHEET_NAME above.
 * 4. Deploy → New deployment → Select type "Web app".
 *    - Execute as: Me
 *    - Who has access: Anyone with the link
 * 5. Copy the Web App URL and set APPS_SCRIPT_URL in script.js.
 * 6. If CORS errors occur, configure doPost to return appropriate headers:
 *      return ContentService.createTextOutput(...).setMimeType(...)
 *        .setHeader('Access-Control-Allow-Origin', '*');
 */
