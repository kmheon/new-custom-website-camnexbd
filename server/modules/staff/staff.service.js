const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('../../../database');
const { logAudit } = require('../../middleware/auditLogger');
const { emitDomainEvent } = require('../../middleware/events');
const { PERMISSIONS, SYSTEM_ROLES } = require('../../shared/permissions');

class StaffService {
  login(email, password, ip = null) {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      const err = new Error('Invalid email or password.');
      err.statusCode = 401;
      throw err;
    }

    if (user.status === 'disabled') {
      const err = new Error('This account has been disabled. Please contact your system administrator.');
      err.statusCode = 403;
      throw err;
    }

    // Check account lockout
    if (user.locked_until) {
      const lockDate = new Date(user.locked_until);
      if (lockDate > new Date()) {
        const err = new Error(`Account temporarily locked due to excessive failed attempts. Please try again after ${lockDate.toLocaleTimeString()}.`);
        err.statusCode = 423;
        throw err;
      } else {
        // Lock expired, reset
        db.prepare('UPDATE users SET locked_until = NULL, failed_login_attempts = 0 WHERE id = ?').run(user.id);
      }
    }

    const isValid = bcrypt.compareSync(password, user.password_hash);
    if (!isValid) {
      const failed = (user.failed_login_attempts || 0) + 1;
      let lockedUntil = null;
      if (failed >= 5) {
        lockedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins lockout
      }
      db.prepare(`
        UPDATE users SET failed_login_attempts = ?, locked_until = ? WHERE id = ?
      `).run(failed, lockedUntil, user.id);

      logAudit({
        entity: 'auth',
        entityId: user.id,
        action: 'failed_login',
        actorId: user.id,
        actorName: user.name,
        ip
      });

      const err = new Error(failed >= 5 ? 'Account locked for 15 minutes due to 5 failed login attempts.' : 'Invalid email or password.');
      err.statusCode = failed >= 5 ? 423 : 401;
      throw err;
    }

    // Reset failed attempts on success, update last_login
    db.prepare(`
      UPDATE users SET failed_login_attempts = 0, locked_until = NULL, last_login = CURRENT_TIMESTAMP WHERE id = ?
    `).run(user.id);

    // Fetch user permissions
    const permissions = this.getUserPermissions(user.id, user.role);

    logAudit({
      entity: 'auth',
      entityId: user.id,
      action: 'login',
      actorId: user.id,
      actorName: user.name,
      ip
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions,
      must_change_password: Boolean(user.must_change_password),
      branch_id: user.branch_id,
      warehouse_id: user.warehouse_id
    };
  }

  getUserPermissions(userId, role) {
    if (role === 'admin' || role === 'super-admin') {
      return Object.values(PERMISSIONS);
    }
    try {
      const rows = db.prepare(`
        SELECT DISTINCT rp.permission_key
        FROM role_permissions rp
        JOIN user_roles ur ON rp.role_id = ur.role_id
        WHERE ur.user_id = ?
      `).all(userId);
      return rows.map(r => r.permission_key);
    } catch (_) {
      return role === 'admin' ? Object.values(PERMISSIONS) : [];
    }
  }

  changePassword(userId, currentPassword, newPassword) {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }

    if (!bcrypt.compareSync(currentPassword, user.password_hash)) {
      const err = new Error('Current password is incorrect.');
      err.statusCode = 400;
      throw err;
    }

    const newHash = bcrypt.hashSync(newPassword, 10);
    db.prepare(`
      UPDATE users SET password_hash = ?, must_change_password = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(newHash, userId);

    logAudit({
      entity: 'user',
      entityId: userId,
      action: 'change_password',
      actorId: userId,
      actorName: user.name
    });

    return true;
  }

  listUsers() {
    const users = db.prepare(`
      SELECT id, name, email, role, status, must_change_password, branch_id, warehouse_id, last_login, created_at
      FROM users ORDER BY created_at DESC
    `).all();

    for (const u of users) {
      u.must_change_password = Boolean(u.must_change_password);
      try {
        const roles = db.prepare(`
          SELECT r.id, r.name FROM user_roles ur
          JOIN roles r ON ur.role_id = r.id
          WHERE ur.user_id = ?
        `).all(u.id);
        u.roles = roles;
      } catch (_) {
        u.roles = [];
      }
    }
    return users;
  }

  createUser({ email, name, password, roleIds = [], branch_id = null, warehouse_id = null }, actor = null) {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      const err = new Error('A staff user with this email address already exists.');
      err.statusCode = 409;
      throw err;
    }

    const id = `usr-${Date.now()}`;
    const hash = bcrypt.hashSync(password, 10);
    const primaryRole = roleIds.includes('role-super-admin') ? 'super-admin' : 'staff';

    const tx = db.transaction(() => {
      db.prepare(`
        INSERT INTO users (id, name, email, password_hash, role, status, must_change_password, branch_id, warehouse_id, created_at)
        VALUES (?, ?, ?, ?, ?, 'active', 1, ?, ?, CURRENT_TIMESTAMP)
      `).run(id, name, email, hash, primaryRole, branch_id, warehouse_id);

      const insertRole = db.prepare('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)');
      for (const rid of roleIds) {
        insertRole.run(id, rid);
      }
    });

    tx();

    logAudit({
      entity: 'user',
      entityId: id,
      action: 'create',
      actorId: actor?.id,
      actorName: actor?.name,
      after: { email, name, roleIds, primaryRole }
    });

    return { id, email, name, role: primaryRole, roleIds, status: 'active', must_change_password: true };
  }

  updateUser(id, data, actor = null) {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    if (!user) return null;

    const tx = db.transaction(() => {
      db.prepare(`
        UPDATE users SET
          name = COALESCE(?, name),
          status = COALESCE(?, status),
          must_change_password = COALESCE(?, must_change_password),
          branch_id = COALESCE(?, branch_id),
          warehouse_id = COALESCE(?, warehouse_id),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        data.name ?? null,
        data.status ?? null,
        data.must_change_password !== undefined ? (data.must_change_password ? 1 : 0) : null,
        data.branch_id ?? null,
        data.warehouse_id ?? null,
        id
      );

      if (Array.isArray(data.roleIds)) {
        db.prepare('DELETE FROM user_roles WHERE user_id = ?').run(id);
        const insertRole = db.prepare('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)');
        for (const rid of data.roleIds) {
          insertRole.run(id, rid);
        }
      }
    });

    tx();

    logAudit({
      entity: 'user',
      entityId: id,
      action: 'update',
      actorId: actor?.id,
      actorName: actor?.name,
      after: data
    });

    return true;
  }

  // ROLES
  listRoles() {
    const roles = db.prepare('SELECT * FROM roles ORDER BY is_system DESC, name ASC').all();
    for (const r of roles) {
      r.is_system = Boolean(r.is_system);
      const perms = db.prepare('SELECT permission_key FROM role_permissions WHERE role_id = ?').all(r.id);
      r.permissions = perms.map(p => p.permission_key);
    }
    return roles;
  }

  createRole({ name, description = '', permissions = [] }, actor = null) {
    const id = `role-${Date.now()}`;
    const tx = db.transaction(() => {
      db.prepare(`
        INSERT INTO roles (id, name, description, is_system, created_at)
        VALUES (?, ?, ?, 0, CURRENT_TIMESTAMP)
      `).run(id, name, description);

      const insertPerm = db.prepare('INSERT INTO role_permissions (role_id, permission_key) VALUES (?, ?)');
      for (const p of permissions) {
        insertPerm.run(id, p);
      }
    });

    tx();

    logAudit({
      entity: 'role',
      entityId: id,
      action: 'create',
      actorId: actor?.id,
      actorName: actor?.name,
      after: { id, name, permissions }
    });

    return { id, name, description, is_system: false, permissions };
  }

  updateRole(id, { name, description, permissions }, actor = null) {
    const role = db.prepare('SELECT * FROM roles WHERE id = ?').get(id);
    if (!role) return null;

    const tx = db.transaction(() => {
      if (name || description !== undefined) {
        db.prepare(`
          UPDATE roles SET name = COALESCE(?, name), description = COALESCE(?, description), updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(name ?? null, description ?? null, id);
      }

      if (Array.isArray(permissions)) {
        db.prepare('DELETE FROM role_permissions WHERE role_id = ?').run(id);
        const insertPerm = db.prepare('INSERT INTO role_permissions (role_id, permission_key) VALUES (?, ?)');
        for (const p of permissions) {
          insertPerm.run(id, p);
        }
      }
    });

    tx();

    logAudit({
      entity: 'role',
      entityId: id,
      action: 'update',
      actorId: actor?.id,
      actorName: actor?.name,
      after: { id, name, permissions }
    });

    return true;
  }

  deleteRole(id, actor = null) {
    const role = db.prepare('SELECT * FROM roles WHERE id = ?').get(id);
    if (!role) return false;

    if (role.is_system) {
      const err = new Error('System roles cannot be deleted.');
      err.statusCode = 400;
      throw err;
    }

    const assignedCount = db.prepare('SELECT COUNT(*) as count FROM user_roles WHERE role_id = ?').get(id);
    if (assignedCount && assignedCount.count > 0) {
      const err = new Error(`Cannot delete role assigned to ${assignedCount.count} users. Please reassign users first.`);
      err.statusCode = 409;
      throw err;
    }

    const tx = db.transaction(() => {
      db.prepare('DELETE FROM role_permissions WHERE role_id = ?').run(id);
      db.prepare('DELETE FROM roles WHERE id = ?').run(id);
    });

    tx();

    logAudit({
      entity: 'role',
      entityId: id,
      action: 'delete',
      actorId: actor?.id,
      actorName: actor?.name
    });

    return true;
  }
}

module.exports = new StaffService();

