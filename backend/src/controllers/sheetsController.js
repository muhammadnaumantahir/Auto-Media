const userStore = require('../services/userStore');
const videoSheetService = require('../services/videoSheetService');

exports.previewHeaders = async (req, res) => {
  try {
    const { sheetUrl } = req.body;
    if (!sheetUrl) return res.status(400).json({ error: 'sheetUrl is required' });

    const { sheetId, sheetTitle, headers } = await videoSheetService.getSheetHeaders(sheetUrl);
    res.json({ sheetId, sheetTitle, headers });
  } catch (err) {
    res.status(400).json({
      error:
        'Could not read that sheet. Make sure it is shared (as Editor) with the service account email, then try again.',
      detail: err.message,
    });
  }
};

exports.connect = async (req, res) => {
  try {
    const { sheetUrl, columnMapping } = req.body;
    if (!sheetUrl || !columnMapping) {
      return res.status(400).json({ error: 'sheetUrl and columnMapping are required' });
    }

    const sheetId = videoSheetService.extractSheetId(sheetUrl);
    const user = await userStore.updateUser(req.userId, {
      videoSheetId: sheetId,
      videoSheetUrl: sheetUrl,
      columnMapping,
    });

    res.json({
      videoSheetUrl: user.videoSheetUrl,
      columnMapping: user.columnMapping,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.disconnect = async (req, res) => {
  try {
    await userStore.updateUser(req.userId, {
      videoSheetId: '',
      videoSheetUrl: '',
      columnMapping: {},
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
