// Sends absence alerts to parents. Uses Twilio if credentials are present in
// .env; otherwise it just logs the message so you can develop/demo without keys.
// Messages are sent one-by-one but the caller runs this without awaiting each
// send (fire-and-forget) so the teacher's Save is not blocked.

let client = null;
const sid = process.env.TWILIO_ACCOUNT_SID;
const token = process.env.TWILIO_AUTH_TOKEN;

if (sid && token) {
  try {
    client = require("twilio")(sid, token);
  } catch (e) {
    console.warn("Twilio init failed, falling back to console:", e.message);
  }
}

function buildMessage({ name, subject, date }) {
  return `Dear parent, your ward ${name} was marked ABSENT for ${subject} on ${date}. - College Attendance System`;
}

async function sendAbsentAlert(parentPhone, info) {
  const body = buildMessage(info);

  if (!client || !parentPhone) {
    console.log(`[ALERT -> ${parentPhone || "no-number"}] ${body}`);
    return { sent: false, logged: true };
  }

  try {
    // WhatsApp first
    if (process.env.TWILIO_WHATSAPP_FROM) {
      await client.messages.create({
        from: process.env.TWILIO_WHATSAPP_FROM,
        to: `whatsapp:${parentPhone}`,
        body,
      });
      return { sent: true, channel: "whatsapp" };
    }
    // SMS fallback
    if (process.env.TWILIO_SMS_FROM) {
      await client.messages.create({
        from: process.env.TWILIO_SMS_FROM,
        to: parentPhone,
        body,
      });
      return { sent: true, channel: "sms" };
    }
    console.log(`[ALERT -> ${parentPhone}] ${body}`);
    return { sent: false, logged: true };
  } catch (e) {
    console.error("Alert send failed:", e.message);
    return { sent: false, error: e.message };
  }
}

// Fire all alerts in the background; returns immediately.
function sendAbsentAlertsBatch(list) {
  setImmediate(async () => {
    for (const item of list) {
      await sendAbsentAlert(item.parentPhone, item.info);
    }
  });
}

module.exports = { sendAbsentAlert, sendAbsentAlertsBatch };
