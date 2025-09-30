const SHEET_NAME = 'RSVPs';

function doPost(e) {
  const props = PropertiesService.getScriptProperties();
  const allowedOrigin = props.getProperty('ALLOWED_ORIGIN') || '*';
  const sheetId = props.getProperty('SHEET_ID');
  const calendlyBase = props.getProperty('CALENDLY_BASE_URL');
  const sendCalendlyEmail = props.getProperty('SEND_CALENDLY_EMAIL') === 'true';
  const notifyEmail = props.getProperty('NOTIFY_EMAIL');

  const response = ContentService.createTextOutput();
  response.setMimeType(ContentService.MimeType.JSON);
  response.append('{"ok":false}');

  if (!sheetId) {
    return withCors(response, allowedOrigin, { ok: false, error: 'Missing SHEET_ID property' });
  }

  if (!e?.postData?.contents) {
    return withCors(response, allowedOrigin, { ok: false, error: 'Missing body' });
  }

  let payload;
  try {
    payload = JSON.parse(e.postData.contents);
  } catch (error) {
    return withCors(response, allowedOrigin, { ok: false, error: 'Invalid JSON' });
  }

  const lock = LockService.getScriptLock();
  lock.tryLock(3000);

  try {
    const sheet = getSheet(sheetId);
    sheet.appendRow([
      new Date(),
      payload.name || '',
      payload.allergies || '',
      payload.attendance || '',
      payload.submittedAt || '',
      payload.userAgent || ''
    ]);

    if (sendCalendlyEmail && payload.shouldSendCalendlyEmail && notifyEmail) {
      sendCalendlyMessage({
        notifyEmail,
        name: payload.name,
        calendlyBase
      });
    }

    return withCors(response, allowedOrigin, { ok: true });
  } catch (error) {
    return withCors(response, allowedOrigin, { ok: false, error: error.message });
  } finally {
    lock.releaseLock();
  }
}

function getSheet(sheetId) {
  const ss = SpreadsheetApp.openById(sheetId);
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['Timestamp', 'Nombre', 'Alergias', 'Asistencia', 'Enviado desde', 'User Agent']);
  }
  return sheet;
}

function sendCalendlyMessage({ notifyEmail, name, calendlyBase }) {
  if (!notifyEmail || !calendlyBase) return;
  const inviteeName = name || 'Invitado';
  const htmlBody = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;color:#1d1b16;">
    <p>Hola ${inviteeName},</p>
    <p>¡Gracias por confirmar tu asistencia! Para coordinar los detalles finales, agenda una llamada en el enlace a continuación:</p>
    <p><a href="${calendlyBase}" style="background:#406977;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;">Agendar con Calendly</a></p>
    <p>Si el enlace no se abre, copia y pega esta dirección en tu navegador:<br>${calendlyBase}</p>
    <p>Con cariño,<br>Valeria & Mateo</p>
  </body></html>`;
  GmailApp.sendEmail(notifyEmail, 'Confirmación de asistencia', 'Confirma tu asistencia', {
    htmlBody
  });
}

function withCors(output, origin, data) {
  output.setContent(JSON.stringify(data));
  output.setHeader('Access-Control-Allow-Origin', origin);
  output.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  output.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  return output;
}

function doOptions(e) {
  const props = PropertiesService.getScriptProperties();
  const allowedOrigin = props.getProperty('ALLOWED_ORIGIN') || '*';
  const response = ContentService.createTextOutput('');
  response.setMimeType(ContentService.MimeType.TEXT);
  response.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  return response;
}
