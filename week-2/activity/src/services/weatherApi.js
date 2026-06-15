import { getStoredAuthToken, refreshAuthToken, clearAuthSession } from "../auth";

const API_BASE_URL = "http://localhost:8080/api";

async function fetchWithAuth(url, options = {}) {
    let token = getStoredAuthToken();
    const headers = {
        "Content-Type": "application/json",
        ...options.headers,
    };
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }
    
    const fetchOptions = {
        ...options,
        headers,
    };

    let response = await fetch(url, fetchOptions);

    if (response.status === 401) {
        try {
            const refreshPayload = await refreshAuthToken();
            const newToken = refreshPayload.accessToken;
            headers["Authorization"] = `Bearer ${newToken}`;
            response = await fetch(url, fetchOptions);
        } catch (err) {
            clearAuthSession();
            window.dispatchEvent(new CustomEvent("auth-unauthorized"));
        }
    }

    return response;
}

async function handleResponse(response) {
    let payload = {};
    try {
        payload = await response.json();
    } catch (e) {
        // empty response or not JSON
    }

    if (!response.ok) {
        throw new Error(payload.message || "Request failed.");
    }
    return payload;
}

export async function fetchFavorites(token) {
    const response = await fetchWithAuth(`${API_BASE_URL}/favorites`);
    return handleResponse(response);
}

export async function addFavorite(token, city) {
    const response = await fetchWithAuth(`${API_BASE_URL}/favorites`, {
        method: "POST",
        body: JSON.stringify({ city })
    });
    return handleResponse(response);
}

export async function removeFavorite(token, city) {
    const response = await fetchWithAuth(`${API_BASE_URL}/favorites?city=${encodeURIComponent(city)}`, {
        method: "DELETE"
    });
    return handleResponse(response);
}

export async function fetchSubscriptions(token) {
    const response = await fetchWithAuth(`${API_BASE_URL}/subscriptions`);
    return handleResponse(response);
}

export async function saveSubscription(token, sub) {
    const response = await fetchWithAuth(`${API_BASE_URL}/subscriptions`, {
        method: "POST",
        body: JSON.stringify(sub)
    });
    return handleResponse(response);
}

export async function deleteSubscription(token, city) {
    const response = await fetchWithAuth(`${API_BASE_URL}/subscriptions?city=${encodeURIComponent(city)}`, {
        method: "DELETE"
    });
    return handleResponse(response);
}

export async function fetchAlerts(token) {
    const response = await fetchWithAuth(`${API_BASE_URL}/alerts`);
    return handleResponse(response);
}

export async function markAlertsAsRead(token) {
    const response = await fetchWithAuth(`${API_BASE_URL}/alerts/read`, {
        method: "POST"
    });
    return handleResponse(response);
}

export async function triggerAlertCheck(token) {
    const response = await fetchWithAuth(`${API_BASE_URL}/alerts/check`, {
        method: "POST"
    });
    return handleResponse(response);
}

export async function clearAlerts(token) {
    const response = await fetchWithAuth(`${API_BASE_URL}/alerts`, {
        method: "DELETE"
    });
    return handleResponse(response);
}
