const userStore = require('../services/userStore');
const videoSheetService = require('../services/videoSheetService');

exports.list = async (req, res) => {
  try {
    const user = await userStore.findById(req.userId);
    if (!user || !user.videoSheetId) {
      return res.status(400).json({ error: 'Connect a video sheet first' });
    }

    const rows = await videoSheetService.getVideoRows(user.videoSheetId, user.columnMapping);
    const videos = rows.map((r) => ({
      rowIndex: r.rowIndex,
      videoLink: r.videoLink,
      title: r.title,
      description: r.description,
      status: r.status,
      platforms: r.platforms,
    }));

    res.json({ videos });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
