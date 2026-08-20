const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { runForAllUsers, runForUser } = require("./lib/runner");

admin.initializeApp();

// Runs automatically every 15 minutes: scans every user with a connected
// sheet, publishes any row marked "ready", writes the result back.
exports.scheduledPostingRun = onSchedule("every 15 minutes", async () => {
  const summary = await runForAllUsers();
  console.log(JSON.stringify(summary, null, 2));
});

// Callable from the app (see the "Run now" button on the Dashboard page)
// so you can trigger a run on demand instead of waiting for the schedule.
exports.runPostingNow = onCall(async (request) => {
  const { userId } = request.data || {};
  try {
    if (userId) {
      return await runForUser(userId);
    }
    return { users: await runForAllUsers() };
  } catch (err) {
    throw new HttpsError("internal", err.message || String(err));
  }
});
