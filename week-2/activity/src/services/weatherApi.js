const API_BASE_URL = "http://localhost:8080/api";

function getHeaders(token) {
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };
}

async function handleResponse(response) {
    let payload = {};
    try {
        payload = await response.json();
    } catch (e) {
        // empty response or not JSON
    }

    if (!response.ok) {
        if (response.status === 401) {
            window.dispatchEvent(new CustomEvent("auth-unauthorized"));
        }
        throw new Error(payload.message || "Request failed.");
    }
    return payload;
}

export async function fetchFavorites(token) {
    const response = await fetch(`${API_BASE_URL}/favorites`, {
        headers: getHeaders(token)
    });
    return handleResponse(response);
}

export async function addFavorite(token, city) {
    const response = await fetch(`${API_BASE_URL}/favorites`, {
        method: "POST",
        headers: getHeaders(token),
        body: JSON.stringify({ city })
    });
    return handleResponse(response);
}

export async function removeFavorite(token, city) {
    const response = await fetch(`${API_BASE_URL}/favorites?city=${encodeURIComponent(city)}`, {
        method: "DELETE",
        headers: getHeaders(token)
    });
    return handleResponse(response);
}

export async function fetchSubscriptions(token) {
    const response = await fetch(`${API_BASE_URL}/subscriptions`, {
        headers: getHeaders(token)
    });
    return handleResponse(response);
}

export async function saveSubscription(token, sub) {
    const response = await fetch(`${API_BASE_URL}/subscriptions`, {
        method: "POST",
        headers: getHeaders(token),
        body: JSON.stringify(sub)
    });
    return handleResponse(response);
}

export async function deleteSubscription(token, city) {
    const response = await fetch(`${API_BASE_URL}/subscriptions?city=${encodeURIComponent(city)}`, {
        method: "DELETE",
        headers: getHeaders(token)
    });
    return handleResponse(response);
}

export async function fetchAlerts(token) {
    const response = await fetch(`${API_BASE_URL}/alerts`, {
        headers: getHeaders(token)
    });
    return handleResponse(response);
}

export async function markAlertsAsRead(token) {
    const response = await fetch(`${API_BASE_URL}/alerts/read`, {
        method: "POST",
        headers: getHeaders(token)
    });
    return handleResponse(response);
}

export async function triggerAlertCheck(token) {
    const response = await fetch(`${API_BASE_URL}/alerts/check`, {
        method: "POST",
        headers: getHeaders(token)
    });
    return handleResponse(response);
}

export async function clearAlerts(token) {
    const response = await fetch(`${API_BASE_URL}/alerts`, {
        method: "DELETE",
        headers: getHeaders(token)
    });
    return handleResponse(response);
}
