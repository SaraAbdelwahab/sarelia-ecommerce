'use strict';

/** Consistent success envelope */
const ok = (res, data = {}, status = 200) =>
  res.status(status).json({ success: true, ...data });

/** Consistent error envelope */
const fail = (res, message, status = 400) =>
  res.status(status).json({ success: false, message });

module.exports = { ok, fail };
