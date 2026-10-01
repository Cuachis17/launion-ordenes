/**
 * server/users/admin.test.js
 * Pruebas de integración para rutas administrativas (/api/admin).
 * Verifica listado de usuarios, activación/desactivación y restricciones de seguridad.
 */

import test, { describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { setupTestEnvironment } from './testHelper.js';

describe('Pruebas de Administración de Usuarios (/api/admin)', () => {
  let env;
  let adminUser;
  let regularUser;
  let adminToken;
  let regularToken;

  before(async () => {
    env = await setupTestEnvironment();
    adminUser = await env.createUser({
      username: 'admin@union.com',
      role: 'admin',
      status: 'active'
    });
    regularUser = await env.createUser({
      username: 'chofer@union.com',
      role: 'user',
      status: 'active'
    });
    adminToken = env.createToken(adminUser);
    regularToken = env.createToken(regularUser);
  });

  after(async () => {
    if (env) {
      await env.cleanUp();
    }
  });

  test('no-admin -> 403 en GET /api/admin/users', async () => {
    const res = await env.apiFetch(`${env.baseUrl}/api/admin/users`, {
      headers: { Authorization: `Bearer ${regularToken}` }
    });
    assert.equal(res.status, 403);
    const data = await res.json();
    assert.match(data.message, /Forbidden/i);
  });

  test('admin -> 200 en GET /api/admin/users con lista sin passwords', async () => {
    const res = await env.apiFetch(`${env.baseUrl}/api/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.equal(res.status, 200);
    const users = await res.json();
    assert.ok(Array.isArray(users));
    assert.ok(users.length >= 2);
    for (const u of users) {
      assert.equal(u.password, undefined);
      assert.ok(u._id);
      assert.ok(u.username);
      assert.ok(u.status);
    }
  });

  test('admin desactiva y activa cuenta de otro usuario', async () => {
    // 1. Desactivamos al usuario normal
    const resDeact = await env.apiFetch(
      `${env.baseUrl}/api/admin/users/${regularUser._id}/status`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ status: 'inactive' })
      }
    );
    assert.equal(resDeact.status, 200);
    const deactUser = await resDeact.json();
    assert.equal(deactUser.status, 'inactive');
    assert.equal(deactUser.password, undefined);

    const dbUserInactive = await env.db.findOne({ _id: regularUser._id });
    assert.equal(dbUserInactive.status, 'inactive');

    // 2. Reactivamos la cuenta
    const resAct = await env.apiFetch(
      `${env.baseUrl}/api/admin/users/${regularUser._id}/status`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ status: 'active' })
      }
    );
    assert.equal(resAct.status, 200);
    const actUser = await resAct.json();
    assert.equal(actUser.status, 'active');

    const dbUserActive = await env.db.findOne({ _id: regularUser._id });
    assert.equal(dbUserActive.status, 'active');
  });

  test('admin no se puede desactivar a sí mismo (409 Conflict)', async () => {
    const res = await env.apiFetch(
      `${env.baseUrl}/api/admin/users/${adminUser._id}/status`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ status: 'inactive' })
      }
    );
    assert.equal(res.status, 409);
    const body = await res.json();
    assert.match(body.message, /No puedes desactivar tu propia cuenta/i);

    const dbAdmin = await env.db.findOne({ _id: adminUser._id });
    assert.equal(dbAdmin.status, 'active');
  });

  test('PATCH /api/admin/users/:id/status valida valor (400 si inválido)', async () => {
    const res = await env.apiFetch(
      `${env.baseUrl}/api/admin/users/${regularUser._id}/status`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ status: 'bloqueado' })
      }
    );
    assert.equal(res.status, 400);
  });

  test('PATCH /api/admin/users/:id/status retorna 404 si no existe', async () => {
    const res = await env.apiFetch(
      `${env.baseUrl}/api/admin/users/id_inexistente_999/status`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ status: 'inactive' })
      }
    );
    assert.equal(res.status, 404);
  });
});
