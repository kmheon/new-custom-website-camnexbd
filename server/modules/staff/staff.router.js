const express = require('express');
const router = express.Router();
const staffService = require('./staff.service');
const {
  staffLoginSchema,
  staffCreateUserSchema,
  staffUpdateUserSchema,
  changePasswordSchema,
  roleSchema
} = require('./staff.schemas');
const {
  loginLimiter,
  createSession,
  destroySession,
  requirePermission,
  requireAdmin,
  validateBody
} = require('../../middleware/auth');
const { PERMISSIONS } = require('../../shared/permissions');

// Login for Admin / Staff
router.post(['/auth/admin/login', '/auth/staff/login', '/staff/login'], loginLimiter, validateBody(staffLoginSchema), (req, res) => {
  try {
    const user = staffService.login(req.body.email, req.body.password, req.ip);
    const isStaffApp = req.originalUrl.includes('/staff');
    const appType = isStaffApp ? 'staff' : 'admin';
    const session = createSession(user.id, user.role, user.email, user.name, res, appType);

    res.json({
      success: true,
      user,
      csrfToken: session.csrfToken
    });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// Current user profile
router.get('/auth/me', (req, res) => {
  if (!req.user) {
    return res.json({ authenticated: false, user: null });
  }
  res.json({
    authenticated: true,
    user: req.user
  });
});

// Logout
router.post(['/auth/logout', '/auth/admin/logout', '/auth/staff/logout'], (req, res) => {
  const token = req.cookies?.camnex_staff_session || req.cookies?.camnex_admin_session || req.cookies?.camnex_session;
  destroySession(token, res, 'all');
  res.json({ success: true, message: 'Logged out successfully' });
});

// Change Password
router.post('/staff/change-password', requireAdmin, validateBody(changePasswordSchema), (req, res) => {
  try {
    staffService.changePassword(req.user.id, req.body.currentPassword, req.body.newPassword);
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// Permissions list
router.get('/staff/permissions', requireAdmin, (req, res) => {
  res.json(Object.entries(PERMISSIONS).map(([k, v]) => ({ key: v, label: k })));
});

// Users Management
router.get('/staff/users', requirePermission(PERMISSIONS.STAFF_ACCESS), (req, res) => {
  try {
    const users = staffService.listUsers();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/staff/users', requirePermission(PERMISSIONS.STAFF_MANAGE), validateBody(staffCreateUserSchema), (req, res) => {
  try {
    const created = staffService.createUser(req.body, req.user);
    res.json(created);
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message });
    res.status(500).json({ error: err.message });
  }
});

router.put('/staff/users/:id', requirePermission(PERMISSIONS.STAFF_MANAGE), validateBody(staffUpdateUserSchema), (req, res) => {
  try {
    staffService.updateUser(req.params.id, req.body, req.user);
    res.json({ success: true });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// Roles Management
router.get('/staff/roles', requirePermission(PERMISSIONS.STAFF_ACCESS), (req, res) => {
  try {
    const roles = staffService.listRoles();
    res.json(roles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/staff/roles', requirePermission(PERMISSIONS.ROLES_MANAGE), validateBody(roleSchema), (req, res) => {
  try {
    const created = staffService.createRole(req.body, req.user);
    res.json(created);
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message });
    res.status(500).json({ error: err.message });
  }
});

router.put('/staff/roles/:id', requirePermission(PERMISSIONS.ROLES_MANAGE), validateBody(roleSchema), (req, res) => {
  try {
    staffService.updateRole(req.params.id, req.body, req.user);
    res.json({ success: true });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message });
    res.status(500).json({ error: err.message });
  }
});

router.delete('/staff/roles/:id', requirePermission(PERMISSIONS.ROLES_MANAGE), (req, res) => {
  try {
    staffService.deleteRole(req.params.id, req.user);
    res.json({ success: true });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message });
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

