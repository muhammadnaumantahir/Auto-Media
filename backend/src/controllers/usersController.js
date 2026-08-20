const userStore = require('../services/userStore');
const videoSheetService = require('../services/videoSheetService');

const SUPPORTED_PLATFORMS = ['youtube', 'facebook', 'snapchat', 'tiktok'];

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    videoSheetUrl: user.videoSheetUrl,
    columnMapping: user.columnMapping,
    enabledPlatforms: user.enabledPlatforms,
    connectedPlatforms: Object.keys(user.platformTokens || {}),
    createdAt: user.createdAt,
  };
}

// GET /api/users
exports.list = async (req, res) => {
  try {
    const users = await userStore.listUsers();
    res.json({ users: users.map(publicUser) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/users  { firstName, lastName, email }
exports.create = async (req, res) => {
  try {
    const { firstName, lastName, email } = req.body;
    if (!firstName) {
      return res.status(400).json({ error: 'firstName is required' });
    }
    if (email) {
      const existing = await userStore.findByEmail(email);
      if (existing) {
        return res.status(409).json({ error: 'A user with that email already exists' });
      }
    }
    const user = await userStore.createUser({ firstName, lastName, email });
    res.status(201).json({ user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/users/:id
exports.get = async (req, res) => {
  try {
    const user = await userStore.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/users/:id
exports.remove = async (req, res) => {
  try {
    await userStore.deleteUser(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/users/:id/sheet/preview  { sheetUrl }
exports.previewSheet = async (req, res) => {
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

// POST /api/users/:id/sheet  { sheetUrl, columnMapping }
exports.linkSheet = async (req, res) => {
  try {
    const user = await userStore.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { sheetUrl, columnMapping } = req.body;
    if (!sheetUrl || !columnMapping) {
      return res.status(400).json({ error: 'sheetUrl and columnMapping are required' });
    }

    const sheetId = videoSheetService.extractSheetId(sheetUrl);
    const updated = await userStore.updateUser(req.params.id, {
      videoSheetId: sheetId,
      videoSheetUrl: sheetUrl,
      columnMapping,
    });

    res.json({ user: publicUser(updated) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/users/:id/sheet
exports.unlinkSheet = async (req, res) => {
  try {
    const updated = await userStore.updateUser(req.params.id, {
      videoSheetId: '',
      videoSheetUrl: '',
      columnMapping: {},
    });
    res.json({ user: publicUser(updated) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/users/:id/platforms  { platforms: ["youtube","tiktok"] }
exports.setPlatforms = async (req, res) => {
  try {
    const { platforms } = req.body;
    if (!Array.isArray(platforms)) {
      return res.status(400).json({ error: 'platforms must be an array' });
    }
    const invalid = platforms.filter((p) => !SUPPORTED_PLATFORMS.includes(p));
    if (invalid.length) {
      return res.status(400).json({ error: `Unsupported platform(s): ${invalid.join(', ')}` });
    }

    const updated = await userStore.updateUser(req.params.id, { enabledPlatforms: platforms });
    res.json({ user: publicUser(updated) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.SUPPORTED_PLATFORMS = SUPPORTED_PLATFORMS;
