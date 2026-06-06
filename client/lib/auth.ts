export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "student" | "visitor";
  username?: string;
  isVerified: boolean;
}

export const getAuthToken = (): string | null => {
  return localStorage.getItem("authToken");
};

export const getAuthUser = (): AuthUser | null => {
  const userStr = localStorage.getItem("authUser");
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch (e) {
    return null;
  }
};

export const isLoggedIn = (): boolean => {
  return !!getAuthToken();
};

export const getUserRole = (): "admin" | "student" | "visitor" | null => {
  return getAuthUser()?.role || null;
};

export const getUserName = (): string | null => {
  return getAuthUser()?.name || null;
};

export const login = (token: string, user: AuthUser): void => {
  localStorage.setItem("authToken", token);
  localStorage.setItem("authUser", JSON.stringify(user));
  window.dispatchEvent(new Event("auth-change"));
};

export const logout = (): void => {
  localStorage.removeItem("authToken");
  localStorage.removeItem("authUser");
  window.dispatchEvent(new Event("auth-change"));
};

export const getAuthHeaders = (): Record<string, string> => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ==========================================
// BACKWARD COMPATIBILITY FOR ADMIN LOGIN
// ==========================================

export const getAdminToken = (): string | null => {
  const user = getAuthUser();
  if (user && user.role === "admin") {
    return getAuthToken();
  }
  return null;
};

export const getAdminUser = (): string | null => {
  const user = getAuthUser();
  if (user && user.role === "admin") {
    return user.username || user.name;
  }
  return null;
};

export const isAdminLoggedIn = (): boolean => {
  return isLoggedIn() && getUserRole() === "admin";
};

export const logoutAdmin = (): void => {
  logout();
};

export const loginAdmin = (token: string, username: string): void => {
  login(token, {
    id: "admin",
    name: username,
    username: username,
    email: "admin@projectvault.edu",
    role: "admin",
    isVerified: true,
  });
};
