const ADMIN_KEY = "doj-admin-auth";

export function getAdminPassword(): string {
  return import.meta.env.VITE_ADMIN_PASSWORD ?? "doj2026";
}

export function isAdminAuthenticated(): boolean {
  try {
    return sessionStorage.getItem(ADMIN_KEY) === "1";
  } catch {
    return false;
  }
}

export function setAdminAuthenticated(value: boolean): void {
  try {
    if (value) sessionStorage.setItem(ADMIN_KEY, "1");
    else sessionStorage.removeItem(ADMIN_KEY);
  } catch {}
}
