const admin = require("firebase-admin");
const { readRows, writeStatus } = require("./sheets");
const { publishToPlatform } = require("./dispatch");

function db() {
  return admin.firestore();
}

/**
 * Runs the full posting job for a single user: reads their sheet, finds
 * rows whose status matches their configured "ready" value, publishes
 * each to every platform they've connected, and writes the outcome back.
 */
async function runForUser(userId) {
  const userSnap = await db().collection("users").doc(userId).get();
  if (!userSnap.exists) return { userId, skipped: "user not found" };
  const user = userSnap.data();
  if (!user.sheetConnected) return { userId, skipped: "no sheet connected" };

  const sheetSnap = await db().collection("users").doc(userId).collection("config").doc("sheet").get();
  if (!sheetSnap.exists) return { userId, skipped: "no sheet config" };
  const sheet = sheetSnap.data();
  const { sheetId, tabName, headers, mapping } = sheet;
  const readyValue = sheet.readyValue || "ready";
  const postedValue = sheet.postedValue || "posted";

  const connectorsSnap = await db().collection("users").doc(userId).collection("connectors").get();
  const enabledPlatforms = user.enabledPlatforms || [];
  const connectors = connectorsSnap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((c) => enabledPlatforms.includes(c.platform));
  if (connectors.length === 0) return { userId, skipped: "no selected & configured connectors" };

  const rows = await readRows(sheetId, tabName, headers);
  const readyRows = rows.filter((r) => r[mapping.status] === readyValue);

  const results = [];
  for (const row of readyRows) {
    const videoInfo = {
      videoUrl: row[mapping.videoLink],
      title: row[mapping.videoName],
      description: row[mapping.videoName],
      caption: row[mapping.videoName],
    };

    const outcomes = [];
    for (const connector of connectors) {
      const outcome = await publishToPlatform(connector.platform, connector, videoInfo);
      outcomes.push(outcome);
    }

    const failures = outcomes.filter((o) => !o.ok);
    const finalStatus =
      failures.length === 0
        ? postedValue
        : `error: ${failures.map((f) => `${f.platform} — ${f.error}`).join("; ")}`;

    await writeStatus(sheetId, tabName, row.rowNumber, mapping.status, headers, finalStatus);
    results.push({ row: row.rowNumber, video: videoInfo.title, outcomes, finalStatus });
  }

  return { userId, processed: readyRows.length, results };
}

async function runForAllUsers() {
  const usersSnap = await db().collection("users").where("sheetConnected", "==", true).get();
  const summaries = [];
  for (const doc of usersSnap.docs) {
    summaries.push(await runForUser(doc.id));
  }
  return summaries;
}

module.exports = { runForUser, runForAllUsers };
