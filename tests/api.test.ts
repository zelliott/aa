import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Client, startServer, type TestServer } from './helpers.js';

let server: TestServer;

beforeAll(async () => {
  server = await startServer();
});

afterAll(async () => {
  await server.close();
});

describe('accounts', () => {
  it('registers, signs out and signs back in', async () => {
    const client = new Client(server.baseUrl);
    const { user, household } = await client.register('Ana', 'ana@example.com');
    expect(user.email).toBe('ana@example.com');
    expect(household.name).toBe("Ana's pantry");

    expect((await client.post('/api/auth/logout')).status).toBe(204);
    expect((await client.get('/api/me')).status).toBe(401);

    const login = await client.post('/api/auth/login', {
      email: 'ana@example.com',
      password: 'correct horse battery',
    });
    expect(login.status).toBe(200);
    expect((await client.get('/api/me')).json.user.name).toBe('Ana');
  });

  it('rejects a wrong password', async () => {
    const client = new Client(server.baseUrl);
    const res = await client.post('/api/auth/login', { email: 'ana@example.com', password: 'nope' });
    expect(res.status).toBe(401);
  });

  it('rejects duplicate emails', async () => {
    const client = new Client(server.baseUrl);
    const res = await client.post('/api/auth/register', {
      name: 'Other Ana',
      email: 'ANA@example.com',
      password: 'another password',
    });
    expect(res.status).toBe(409);
  });
});

describe('items', () => {
  it('adds, sorts, edits and removes items', async () => {
    const client = new Client(server.baseUrl);
    const { household } = await client.register('Ben', 'ben@example.com');
    const base = `/api/households/${household.id}/items`;

    await client.post(base, { name: 'Rice', quantity: 2, unit: 'kg', category: 'dry goods' });
    await client.post(base, { name: 'Milk', quantity: 1, unit: 'l', category: 'dairy', expires_on: '2030-01-02' });
    const created = await client.post(base, { name: 'Apples', quantity: 6, category: 'produce', expires_on: '2030-01-01' });
    expect(created.status).toBe(201);

    const byName = await client.get(`${base}?sort=name`);
    expect(byName.json.items.map((i: any) => i.name)).toEqual(['Apples', 'Milk', 'Rice']);

    const byExpiry = await client.get(`${base}?sort=expiry&order=asc`);
    expect(byExpiry.json.items.map((i: any) => i.name)).toEqual(['Apples', 'Milk', 'Rice']);

    const byQuantity = await client.get(`${base}?sort=quantity&order=desc`);
    expect(byQuantity.json.items[0].name).toBe('Apples');

    const search = await client.get(`${base}?q=mil`);
    expect(search.json.items.map((i: any) => i.name)).toEqual(['Milk']);

    const id = created.json.item.id;
    const edited = await client.request('PATCH', `/api/items/${id}`, { quantity: 4 });
    expect(edited.json.item.quantity).toBe(4);
    expect(edited.json.item.name).toBe('Apples');

    expect((await client.request('DELETE', `/api/items/${id}`)).status).toBe(204);
    expect((await client.get(`${base}`)).json.items).toHaveLength(2);
  });

  it('validates item input', async () => {
    const client = new Client(server.baseUrl);
    const { household } = await client.register('Cleo', 'cleo@example.com');
    const res = await client.post(`/api/households/${household.id}/items`, {
      name: 'Beans',
      category: 'legumes',
    });
    expect(res.status).toBe(400);
  });

  it('keeps households separate', async () => {
    const owner = new Client(server.baseUrl);
    const other = new Client(server.baseUrl);
    const { household } = await owner.register('Dev', 'dev@example.com');
    await other.register('Eli', 'eli@example.com');

    expect((await other.get(`/api/households/${household.id}/items`)).status).toBe(404);

    await owner.post(`/api/households/${household.id}/members`, { email: 'eli@example.com' });
    expect((await other.get(`/api/households/${household.id}/items`)).status).toBe(200);
  });
});
