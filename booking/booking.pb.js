/// <reference path="../pb_data/types.d.ts" />

onRecordAfterCreateRequest((e) => {
  const r = e.record;
  const method = r.getString("contact_method");
  const restaurant = r.getString("restaurant_name");
  const firstName = r.getString("prospect_first_name");
  const slotKey = r.getString("slot_key");
  const slotLabel = r.getString("starts_label");
  const contact = r.getString("contact_value");
  const team = [
    { Address: "romain@servicecompris.pro" },
    { Address: "ft@servicecompris.pro" },
    { Address: "damien@servicecompris.pro" },
  ];

  const subject = `RDV Service Compris - ${restaurant} - ${slotLabel}`;
  const channel = method === "meet" ? "Google Meet" : method === "whatsapp" ? "WhatsApp" : "Téléphone";
  const calendarUrl = buildCalendarUrl(restaurant, firstName, slotKey, contact);

  const text = [
    `RDV confirmé`,
    ``,
    `Restaurant : ${restaurant}`,
    `Prospect : ${firstName}`,
    `Créneau : ${slotLabel}`,
    `Canal : ${channel}`,
    `Contact : ${contact}`,
    method === "meet" ? `Google Calendar : ${calendarUrl}` : ``,
  ].join("\n");

  const html = `<!DOCTYPE html>
<html lang="fr">
<body style="margin:0;padding:0;background:#020617;color:#fff;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#020617;">
    <tr>
      <td align="center" style="padding:32px 18px;">
        <table width="560" cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;background:#0f172a;border:1px solid rgba(255,255,255,.1);border-radius:12px;overflow:hidden;">
          <tr><td style="height:4px;background:#bef264;"></td></tr>
          <tr>
            <td style="padding:30px;">
              <p style="margin:0 0 10px;color:#bef264;font-size:12px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;">Service Compris Booking</p>
              <h1 style="margin:0 0 18px;font-size:24px;line-height:1.15;color:#fff;">RDV confirmé</h1>
              <p style="margin:0 0 18px;color:#cbd5e1;font-size:15px;line-height:1.6;">Un rendez-vous a été réservé pour <strong style="color:#fff;">${escapeHtml(firstName)}</strong>.</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;color:#cbd5e1;">
                ${row("Restaurant", restaurant)}
                ${row("Créneau", slotLabel)}
                ${row("Canal", channel)}
                ${row("Contact", contact)}
              </table>
              ${method === "meet" ? `<p style="margin:24px 0 0;"><a href="${calendarUrl}" style="display:inline-block;background:#bef264;color:#020617;text-decoration:none;font-weight:800;padding:13px 18px;border-radius:8px;">Ouvrir l'évènement Google Calendar</a></p>` : ""}
              ${method === "meet" ? `<p style="margin:14px 0 0;color:#94a3b8;font-size:12px;line-height:1.5;">Le lien ouvre un évènement Google Calendar prérempli avec les participants. La création automatique d'un lien Google Meet nécessite un compte Google Calendar connecté côté serveur.</p>` : ""}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const to = method === "meet" ? [{ Address: contact }].concat(team) : team;
  const message = new MailerMessage({
    From: {
      Address: "romain@streammate.ai",
      Name: "Service Compris",
    },
    To: to,
    Subject: subject,
    Text: text,
    HTML: html,
  });

  $app.newMailClient().send(message);
}, "booking_requests");

function row(label, value) {
  return `<tr>
    <td style="padding:9px 0;color:#94a3b8;width:110px;">${escapeHtml(label)}</td>
    <td style="padding:9px 0;color:#fff;font-weight:700;">${escapeHtml(value)}</td>
  </tr>`;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildCalendarUrl(restaurant, firstName, slotKey, contact) {
  const date = slotKey.slice(0, 10).replace(/-/g, "");
  const hour = Number(slotKey.slice(11, 13));
  const start = `${date}T${String(hour).padStart(2, "0")}0000`;
  const end = `${date}T${String(hour + 1).padStart(2, "0")}0000`;
  const title = encodeURIComponent(`RDV Service Compris - ${restaurant}`);
  const details = encodeURIComponent(`Prospect : ${firstName}\nContact : ${contact}\nCréer le lien Google Meet depuis Google Calendar.`);
  const attendees = encodeURIComponent([contact, "romain@servicecompris.pro", "ft@servicecompris.pro", "damien@servicecompris.pro"].join(","));
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&add=${attendees}`;
}
