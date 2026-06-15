const API_BASE_URL = "http://localhost:8080/api/auth";
const ACCESS_TOKEN_KEY = "demo-access-token";
const REFRESH_TOKEN_KEY = "demo-refresh-token";
const AUTH_USERNAME_KEY = "demo-auth-username";

function readJsonSafely(response) {
    return response.json().catch(() => ({}));
}

export function getStoredAuthToken() {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getStoredRefreshToken() {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getStoredUsername() {
    return localStorage.getItem(AUTH_USERNAME_KEY);
}

export function storeAuthSession(accessToken, refreshToken, username) {
    if (accessToken) {
        localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    }
    // Handle backward compatibility signature: storeAuthSession(token, username)
    if (typeof refreshToken === "string" && username === undefined) {
        username = refreshToken;
        refreshToken = undefined;
    }
    if (refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
    if (username) {
        localStorage.setItem(AUTH_USERNAME_KEY, username);
    }
}

export function clearAuthSession() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USERNAME_KEY);
}

export async function refreshAuthToken() {
    const refreshToken = getStoredRefreshToken();
    if (!refreshToken) {
        throw new Error("No refresh token stored.");
    }

    const response = await fetch(`${API_BASE_URL}/refresh`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
    });

    const payload = await readJsonSafely(response);

    if (!response.ok) {
        throw new Error(payload.message || "Refresh failed.");
    }

    if (payload.accessToken && payload.refreshToken) {
        storeAuthSession(payload.accessToken, payload.refreshToken);
    }
    return payload;
}

export async function validateAuthToken(token) {
    try {
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
    } catch (err) {
        // Try refreshing the token using the refresh token
        try {
            const refreshPayload = await refreshAuthToken();
            const newAccessToken = refreshPayload.accessToken;
            const response = await fetch(`${API_BASE_URL}/validate`, {
                headers: {
                    Authorization: `Bearer ${newAccessToken}`,
                },
            });
            const payload = await readJsonSafely(response);
            if (!response.ok) {
                throw new Error("Validation after refresh failed.");
            }
            return payload;
        } catch (refreshErr) {
            clearAuthSession();
            throw new Error("Session expired. Please log in again.");
        }
    }
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