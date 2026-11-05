export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

export interface Household {
  id: number;
  name: string;
  owner_id: number;
}

export interface Member {
  id: number;
  name: string;
  email: string;
}

export interface Item {
  id: number;
  household_id: number;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  expires_on: string | null;
  notes: string;
  photo: string | null;
  created_at: string;
}

export type ItemInput = Pick<Item, 'name' | 'quantity' | 'unit' | 'category' | 'expires_on' | 'notes'>;

export interface Recipe {
  id: number;
  title: string;
  source_url: string;
  ingredients: string[];
  created_at: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function request<T>(method: string, url: string, body?: unknown): Promise<T> {
  const init: RequestInit = { method, credentials: 'same-origin', headers: {} };
  if (body instanceof FormData) {
    init.body = body;
  } else if (body !== undefined) {
    init.body = JSON.stringify(body);
    (init.headers as Record<string, string>)['Content-Type'] = 'application/json';
  }
  const res = await fetch(url, init);
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error ?? res.statusText, res.status);
  return data as T;
}

export const api = {
  me: () => request<{ user: User; households: Household[] }>('GET', '/api/me'),
  register: (input: { email: string; name: string; password: string }) =>
    request<{ user: User }>('POST', '/api/auth/register', input),
  logout: () => request<void>('POST', '/api/auth/logout'),
  requestReset: (email: string) => request<void>('POST', '/api/auth/password-reset', { email }),
  confirmReset: (token: string, password: string) =>
    request<void>('POST', '/api/auth/password-reset/confirm', { token, password }),
  updateProfile: (input: { name?: string; email?: string }) =>
    request<{ user: User }>('PATCH', '/api/me', input),

  household: (id: number) =>
    request<{ household: Household; members: Member[] }>('GET', `/api/households/${id}`),
  createHousehold: (name: string) =>
    request<{ household: Household }>('POST', '/api/households', { name }),
  invite: (id: number, email: string) =>
    request<{ members: Member[] }>('POST', `/api/households/${id}/members`, { email }),

  items: (householdId: number, params: { q?: string; sort?: string; order?: string; category?: string }) => {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) if (value) search.set(key, value);
    return request<{ items: Item[] }>('GET', `/api/households/${householdId}/items?${search}`);
  },
  item: (id: number) => request<{ item: Item }>('GET', `/api/items/${id}`),
  createItem: (householdId: number, input: ItemInput) =>
    request<{ item: Item }>('POST', `/api/households/${householdId}/items`, input),
  updateItem: (id: number, input: Partial<ItemInput>) =>
    request<{ item: Item }>('PATCH', `/api/items/${id}`, input),
  deleteItem: (id: number) => request<void>('DELETE', `/api/items/${id}`),
  uploadPhoto: (id: number, file: File) => {
    const form = new FormData();
    form.append('photo', file);
    return request<{ photo: string; url: string }>('POST', `/api/items/${id}/photo`, form);
  },

  recipes: (householdId: number) =>
    request<{ recipes: Recipe[] }>('GET', `/api/households/${householdId}/recipes`),
  importRecipe: (householdId: number, url: string) =>
    request<{ recipe: Recipe }>('POST', `/api/households/${householdId}/recipes/import`, { url }),
};
