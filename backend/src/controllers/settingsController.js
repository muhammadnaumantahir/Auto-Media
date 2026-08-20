const settingsStore = require('../services/settingsStore');
const videoSheetService = require('../services/videoSheetService');

// GET /api/settings
exports.get = (req, res) => {
  try {
    res.json({ settings: settingsStore.getPublicSettings() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/settings
// Body: { googleServiceAccountEmail, googleServiceAccountPrivateKey, masterSheetUrl,
//         platformCredentials: { youtube: {clientId, clientSecret}, ... } }
exports.update = (req, res) => {
  try {
    const { googleServiceAccountEmail, googleServiceAccountPrivateKey, masterSheetUrl, platformCredentials } =
      req.body;

    const updates = {};
    if (googleServiceAccountEmail !== undefined) updates.googleServiceAccountEmail = googleServiceAccountEmail;
    if (googleServiceAccountPrivateKey !== undefined) {
      updates.googleServiceAccountPrivateKey = googleServiceAccountPrivateKey;
    }
    if (masterSheetUrl !== undefined) {
      updates.masterSheetId = masterSheetUrl ? videoSheetService.extractSheetId(masterSheetUrl) : '';
    }
    if (platformCredentials !== undefined) updates.platformCredentials = platformCredentials;

    const settings = settingsStore.updateSettings(updates);
    res.json({ settings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/settings/test — verifies the saved Google credentials can
// actually reach the configured master sheet.
exports.test = async (req, res) => {
  try {
    const { masterSheetId } = settingsStore.getSettings();
    if (!masterSheetId) {
      return res.status(400).json({ ok: false, error: 'No master sheet configured yet' });
    }
    const { loadSheet } = require('../config/googleSheetsClient');
    const doc = await loadSheet(masterSheetId);
    res.json({ ok: true, sheetTitle: doc.title });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
};
