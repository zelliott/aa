import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { createApp } from '../server/app.js';

export interface TestServer {
  baseUrl: string;
  close: () => Promise<void>;
}

export async function startServer(): Promise<TestServer> {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pantry-test-'));
  const { app, db } = createApp({
    databaseFile: path.join(dir, 'pantry.db'),
    photoDir: path.join(dir, 'photos'),
    webDir: path.join(dir, 'web'),
  });
  const server: Server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const { port } = server.address() as AddressInfo;
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () =>
      new Promise((resolve) => {
        server.close(() => {
          db.close();
          fs.rmSync(dir, { recursive: true, force: true });
          resolve();
        });
      }),
  };
}

export class Client {
  private cookie = '';

  constructor(private readonly baseUrl: string) {}

  async request(method: string, url: string, body?: unknown) {
    const headers: Record<string, string> = {};
    if (this.cookie) headers.Cookie = this.cookie;
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const res = await fetch(this.baseUrl + url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      redirect: 'manual',
    });
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) this.cookie = setCookie.split(';')[0];
    const text = await res.text();
    let json: any = undefined;
    try {
      json = text ? JSON.parse(text) : undefined;
    } catch {
      json = undefined;
    }
    return { status: res.status, json, text, headers: res.headers };
  }

  get(url: string) {
    return this.request('GET', url);
  }

  post(url: string, body?: unknown) {
    return this.request('POST', url, body);
  }

  async register(name: string, email: string, password = 'correct horse battery') {
    const res = await this.post('/api/auth/register', { name, email, password });
    if (res.status !== 201) throw new Error(`register failed: ${res.text}`);
    const me = await this.get('/api/me');
    return { user: me.json.user, household: me.json.households[0] };
  }
}
