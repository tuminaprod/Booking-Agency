"use client";

import type { User } from "@/lib/models";
import { DEMO_ADMIN, DEMO_ADMIN_CREDENTIALS, DEMO_CREDENTIALS, DEMO_USER } from "@/lib/data/users";
import { createStore } from "@/lib/stores/create-store";

/**
 * Authentication adapter.
 *
 * `localAuthAdapter` is a browser-only demo implementation: accounts live in
 * localStorage and passwords are SHA-256 hashed before storage. It exists so
 * every auth flow (sign up, sign in, verification, reset, profile setup) is
 * fully interactive without a backend. Replace it with a real provider by
 * implementing `AuthAdapter` — no UI changes are needed.
 */
export interface AuthAdapter {
  signIn(email: string, password: string): Promise<AuthResult>;
  signUp(input: { firstName: string; lastName: string; email: string; password: string }): Promise<AuthResult & { verificationCode?: string }>;
  signOut(): Promise<void>;
  requestPasswordReset(email: string): Promise<{ ok: true; demoResetToken?: string }>;
  resetPassword(token: string, password: string): Promise<AuthResult>;
  verifyEmail(code: string): Promise<AuthResult>;
  resendVerification(): Promise<{ ok: true; verificationCode?: string }>;
  updateProfile(patch: Partial<User>): Promise<AuthResult>;
}

export type AuthResult = { ok: true; user: User } | { ok: false; error: string; field?: string };

interface StoredAccount {
  user: User;
  passwordHash: string;
}

interface AuthState {
  userId: string | null;
  accounts: Record<string, StoredAccount>;
  pendingVerification?: { email: string; code: string };
  resetTokens: Record<string, string>; // token -> email
}

export const authStore = createStore<AuthState>("auth", { userId: null, accounts: {}, resetTokens: {} }, { version: 2 });

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`oriel:${text}`));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

const delay = (ms = 450) => new Promise((r) => setTimeout(r, ms));

async function seededAccounts(): Promise<Record<string, StoredAccount>> {
  return {
    [DEMO_CREDENTIALS.email]: { user: DEMO_USER, passwordHash: await sha256(DEMO_CREDENTIALS.password) },
    [DEMO_ADMIN_CREDENTIALS.email]: { user: DEMO_ADMIN, passwordHash: await sha256(DEMO_ADMIN_CREDENTIALS.password) },
  };
}

async function allAccounts() {
  return { ...(await seededAccounts()), ...authStore.get().accounts };
}

function currentAccount(accounts: Record<string, StoredAccount>): StoredAccount | undefined {
  const id = authStore.get().userId;
  return Object.values(accounts).find((a) => a.user.id === id);
}

const code6 = () => String(crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000).padStart(6, "0");

export const localAuthAdapter: AuthAdapter = {
  async signIn(email, password) {
    await delay();
    const accounts = await allAccounts();
    const account = accounts[email.trim().toLowerCase()];
    // Same message for unknown email and wrong password — avoids account enumeration.
    if (!account || account.passwordHash !== (await sha256(password))) {
      return { ok: false, error: "That email and password combination doesn't match our records." };
    }
    authStore.set((s) => ({ ...s, userId: account.user.id }));
    return { ok: true, user: account.user };
  },

  async signUp({ firstName, lastName, email, password }) {
    await delay();
    const key = email.trim().toLowerCase();
    const accounts = await allAccounts();
    if (accounts[key]) return { ok: false, error: "An account with this email already exists. Try signing in instead.", field: "email" };
    const user: User = {
      id: `usr_${crypto.randomUUID().slice(0, 8)}`,
      email: key,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      role: "customer",
      emailVerified: false,
      createdAt: new Date().toISOString(),
      preferences: {
        currency: "USD",
        language: "en",
        travelStyle: [],
        notifications: { bookingUpdates: true, priceAlerts: true, tripReminders: true, newsletter: false, sms: false },
      },
      travelers: [{ id: "trv-self", firstName: firstName.trim(), lastName: lastName.trim(), relation: "self" }],
      paymentMethods: [],
    };
    const code = code6();
    const passwordHash = await sha256(password);
    authStore.set((s) => ({
      ...s,
      userId: user.id,
      accounts: { ...s.accounts, [key]: { user, passwordHash } },
      pendingVerification: { email: key, code },
    }));
    return { ok: true, user, verificationCode: code };
  },

  async signOut() {
    await delay(150);
    authStore.set((s) => ({ ...s, userId: null }));
  },

  async requestPasswordReset(email) {
    await delay();
    const key = email.trim().toLowerCase();
    const accounts = await allAccounts();
    // Always succeed publicly; only create a token if the account exists.
    if (!accounts[key]) return { ok: true };
    const token = crypto.randomUUID();
    authStore.set((s) => ({ ...s, resetTokens: { ...s.resetTokens, [token]: key } }));
    return { ok: true, demoResetToken: token };
  },

  async resetPassword(token, password) {
    await delay();
    const email = authStore.get().resetTokens[token];
    if (!email) return { ok: false, error: "This reset link is invalid or has expired. Request a new one." };
    const accounts = await allAccounts();
    const account = accounts[email];
    if (!account) return { ok: false, error: "We couldn't find this account." };
    const passwordHash = await sha256(password);
    authStore.set((s) => {
      const tokens = { ...s.resetTokens };
      delete tokens[token];
      return { ...s, userId: account.user.id, accounts: { ...s.accounts, [email]: { user: account.user, passwordHash } }, resetTokens: tokens };
    });
    return { ok: true, user: account.user };
  },

  async verifyEmail(code) {
    await delay();
    const pending = authStore.get().pendingVerification;
    if (!pending || pending.code !== code.trim()) return { ok: false, error: "That code isn't right. Check the latest email and try again.", field: "code" };
    const accounts = await allAccounts();
    const account = accounts[pending.email];
    if (!account) return { ok: false, error: "Account not found." };
    const user = { ...account.user, emailVerified: true };
    authStore.set((s) => ({ ...s, accounts: { ...s.accounts, [pending.email]: { ...account, user } }, pendingVerification: undefined }));
    return { ok: true, user };
  },

  async resendVerification() {
    await delay(300);
    const pending = authStore.get().pendingVerification;
    if (!pending) return { ok: true };
    const code = code6();
    authStore.set((s) => ({ ...s, pendingVerification: { ...pending, code } }));
    return { ok: true, verificationCode: code };
  },

  async updateProfile(patch) {
    await delay(350);
    const accounts = await allAccounts();
    const account = currentAccount(accounts);
    if (!account) return { ok: false, error: "Please sign in again." };
    const user: User = { ...account.user, ...patch, id: account.user.id, email: account.user.email, role: account.user.role };
    authStore.set((s) => ({ ...s, accounts: { ...s.accounts, [user.email]: { ...account, user } } }));
    return { ok: true, user };
  },
};

export const auth: AuthAdapter = localAuthAdapter;

/** Current signed-in user (null on the server and before hydration). */
export function useSession(): User | null {
  const userId = authStore.use((s) => s.userId);
  const accounts = authStore.use((s) => s.accounts);
  if (!userId) return null;
  const stored = Object.values(accounts).find((a) => a.user.id === userId)?.user;
  if (stored) return stored;
  if (userId === DEMO_USER.id) return DEMO_USER;
  if (userId === DEMO_ADMIN.id) return DEMO_ADMIN;
  return null;
}

export function usePendingVerification() {
  return authStore.use((s) => s.pendingVerification);
}
