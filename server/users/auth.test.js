/**
 * server/users/auth.test.js
 * Pruebas de integración para autenticación, verificación y permisos de usuario.
 * Cubre invalidación inmediata ante cuenta inactiva y protección de atributos en PUT.
 */

import test, { describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { setupTestEnvironment } from './testHelper.js';

describe('Pruebas de Autenticación y Control de Usuarios (/api)', () => {
  let env;
  let activeUser;
  let activeToken;
  let secondUser;
  let secondToken;

  before(async () => {
    env = await setupTestEnvironment();
    activeUser = await env.createUser({
      username: 'activo@union.com',
      role: 'user',
      status: 'active'
    });
    secondUser = await env.createUser({
      username: 'segundo@union.com',
      role: 'user',
      status: 'active'
    });
    activeToken = env.createToken(activeUser);
    secondToken = env.createToken(secondUser);
  });

  after(async () => {
    if (env) {
      await env.cleanUp();
    }
  });

  test('inactivo -> 403 en /verify con token válido y limpia cookie', async () => {
    // 1. Verificamos que con estado activo retorne 200
    const resActive = await env.apiFetch(`${env.baseUrl}/api/verify`, {
      headers: {
        Authorization: `Bearer ${activeToken}`,
        Cookie: `launion=${activeToken}`
      }
    });
    assert.equal(resActive.status, 200);

    // 2. Desactivamos directamente la cuenta en la base de datos
    await env.db.update({ _id: activeUser._id }, { $set: { status: 'inactive' } });

    // 3. Con el mismo token JWT (aún vigente por 24h), /verify debe responder 403 INACTIVE
    const resInactive = await env.apiFetch(`${env.baseUrl}/api/verify`, {
      headers: {
        Authorization: `Bearer ${activeToken}`,
        Cookie: `launion=${activeToken}`
      }
    });
    assert.equal(resInactive.status, 403);
    const body = await resInactive.json();
    assert.equal(body.code, 'INACTIVE');
    assert.equal(body.message, 'Cuenta desactivada');

    // Verificamos que la cookie 'launion' haya sido limpiada en los encabezados
    const setCookie = resInactive.headers.get('set-cookie');
    assert.ok(setCookie, 'Debe emitir encabezado Set-Cookie para expirar la sesión');
    assert.match(setCookie, /launion=;/);

    // Restauramos el estado para no afectar otras pruebas
    await env.db.update({ _id: activeUser._id }, { $set: { status: 'active' } });
  });

  test('usuario normal no puede cambiar su status ni rol por PUT /api/users/:id', async () => {
    const res = await env.apiFetch(`${env.baseUrl}/api/users/${activeUser._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${activeToken}`
      },
      body: JSON.stringify({
        username: 'activo_renombrado',
        status: 'inactive',
        role: 'admin'
      })
    });
    assert.equal(res.status, 200);
    const updated = await res.json();
    assert.equal(updated.username, 'activo_renombrado');
    assert.equal(updated.status, 'active');
    assert.equal(updated.role, 'user');

    // Confirmamos en la base de datos que status y role siguen intactos
    const inDb = await env.db.findOne({ _id: activeUser._id });
    assert.equal(inDb.username, 'activo_renombrado');
    assert.equal(inDb.status, 'active');
    assert.equal(inDb.role, 'user');
  });

  test('usuario normal no puede editar la cuenta de otro usuario (403 Forbidden)', async () => {
    const res = await env.apiFetch(`${env.baseUrl}/api/users/${secondUser._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${activeToken}`
      },
      body: JSON.stringify({
        username: 'hackeado'
      })
    });
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.match(body.message, /Forbidden/i);
  });

  test('usuario inactivo es rechazado en /users/change-password con 403', async () => {
    // Inactivamos temporalmente el usuario
    await env.db.update({ _id: secondUser._id }, { $set: { status: 'inactive' } });

    const res = await env.apiFetch(`${env.baseUrl}/api/users/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secondToken}`
      },
      body: JSON.stringify({
        currentPassword: 'password123',
        newPassword: 'newpassword123'
      })
    });
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.code, 'INACTIVE');

    // Restauramos el estado
    await env.db.update({ _id: secondUser._id }, { $set: { status: 'active' } });
  });
});
