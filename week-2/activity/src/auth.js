const API_BASE_URL = "http://localhost:8080/api/auth";
const AUTH_TOKEN_KEY = "demo-auth-token";
const AUTH_USERNAME_KEY = "demo-auth-username";

function readJsonSafely(response) {
    return response.json().catch(() => ({}));
}

export function getStoredAuthToken() {
    return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function getStoredUsername() {
    return localStorage.getItem(AUTH_USERNAME_KEY);
}

export function storeAuthSession(token, username) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);

    if (username) {
        localStorage.setItem(AUTH_USERNAME_KEY, username);
        return;
    }

    localStorage.removeItem(AUTH_USERNAME_KEY);
}

export function clearAuthSession() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USERNAME_KEY);
}

export async function validateAuthToken(token) {
    const response = await fetch(`${API_BASE_URL}/validate`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    const payload = await readJsonSafely(response);

    if (!response.ok) {
        throw new Error(payload.message || "Token invalid.");
    }

    return payload;
}

export async function logoutAuthToken(token) {
    const response = await fetch(`${API_BASE_URL}/logout`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    const payload = await readJsonSafely(response);

    if (!response.ok) {
        throw new Error(payload.message || "Logout failed.");
    }

    return payload;
}