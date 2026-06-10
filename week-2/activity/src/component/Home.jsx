import React, { useEffect, useState } from "react";
import "./Home.scss";
import { getStoredAuthToken } from "../auth";
import {
    fetchFavorites,
    addFavorite,
    removeFavorite,
    fetchSubscriptions,
    saveSubscription,
    deleteSubscription,
    fetchAlerts,
    triggerAlertCheck,
    clearAlerts
} from "../services/weatherApi";

const suggestedCities = ["London", "New York", "Tokyo", "Delhi", "Sydney", "Cape Town"];
const weatherApiKey = process.env.REACT_APP_OPENWEATHER_API_KEY;

function formatLocalTime(unixSeconds, timezoneOffsetSeconds) {
    if (unixSeconds === undefined || unixSeconds === null) {
        return "N/A";
    }

    const adjustedDate = new Date((unixSeconds + timezoneOffsetSeconds) * 1000);

    return adjustedDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "UTC",
    });
}

function buildWeatherCard(weatherData) {
    return {
        cityKey: `${weatherData.name}-${weatherData.sys?.country ?? ""}`.toLowerCase(),
        city: weatherData.name,
        country: weatherData.sys?.country ?? "--",
        temperature: Math.round(weatherData.main?.temp ?? 0),
        feelsLike: Math.round(weatherData.main?.feels_like ?? 0),
        humidity: weatherData.main?.humidity ?? 0,
        pressure: weatherData.main?.pressure ?? 0,
        windSpeed: weatherData.wind?.speed ?? 0,
        visibility: typeof weatherData.visibility === "number" ? `${(weatherData.visibility / 1000).toFixed(1)} km` : "N/A",
        condition: weatherData.weather?.[0]?.main ?? "Unknown",
        description: weatherData.weather?.[0]?.description ?? "No description available",
        icon: weatherData.weather?.[0]?.icon ?? "01d",
        sunrise: formatLocalTime(weatherData.sys?.sunrise, weatherData.timezone ?? 0),
        sunset: formatLocalTime(weatherData.sys?.sunset, weatherData.timezone ?? 0),
    };
}

async function fetchWeatherForCity(city, signal) {
    if (!weatherApiKey) {
        throw new Error("Add REACT_APP_OPENWEATHER_API_KEY to your environment to load live weather data.");
    }

    const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${weatherApiKey}`,
        { signal }
    );
    const payload = await response.json();

    if (!response.ok) {
        throw new Error(payload?.message ? `OpenWeather says: ${payload.message}` : `Unable to load weather for ${city}.`);
    }

    return buildWeatherCard(payload);
}

function dedupeCards(cards) {
    const seen = new Set();

    return cards.filter((card) => {
        if (seen.has(card.cityKey)) {
            return false;
        }

        seen.add(card.cityKey);
        return true;
    });
}

function Home() {
    const [searchCity, setSearchCity] = useState("London");
    const [weatherCards, setWeatherCards] = useState([]);
    const [featuredWeather, setFeaturedWeather] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [lastUpdated, setLastUpdated] = useState("");

    // Workspace States
    const [favorites, setFavorites] = useState([]);
    const [subscriptions, setSubscriptions] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [activeTab, setActiveTab] = useState("favorites");
    const [favWeatherData, setFavWeatherData] = useState([]);
    const [favLoading, setFavLoading] = useState(false);

    // Subscription Form
    const [subCity, setSubCity] = useState("");
    const [subTempType, setSubTempType] = useState("NONE");
    const [subTempVal, setSubTempVal] = useState(30);
    const [subCondition, setSubCondition] = useState("None");
    const [subIsActive, setSubIsActive] = useState(true);
    const [subError, setSubError] = useState("");
    const [subSuccess, setSubSuccess] = useState("");
    const [checkingAlerts, setCheckingAlerts] = useState(false);

    const token = getStoredAuthToken();

    useEffect(() => {
        let ignore = false;

        async function loadSuggestedCities() {
            setLoading(true);
            setError("");

            try {
                const results = await Promise.allSettled(suggestedCities.map((city) => fetchWeatherForCity(city)));

                if (ignore) {
                    return;
                }

                const successfulCards = results
                    .filter((result) => result.status === "fulfilled")
                    .map((result) => result.value);

                if (successfulCards.length === 0) {
                    const firstFailure = results.find((result) => result.status === "rejected");
                    throw new Error(firstFailure?.reason?.message ?? "No weather data could be loaded.");
                }

                const uniqueCards = dedupeCards(successfulCards);
                setWeatherCards(uniqueCards);
                setFeaturedWeather(uniqueCards[0]);
                setLastUpdated(new Date().toLocaleString());

                const failedCount = results.filter((result) => result.status === "rejected").length;
                if (failedCount > 0) {
                    setError(`${failedCount} suggested city${failedCount > 1 ? "ies" : ""} could not be loaded.`);
                }
            } catch (loadError) {
                if (!ignore) {
                    setWeatherCards([]);
                    setFeaturedWeather(null);
                    setError(loadError.message);
                }
            } finally {
                if (!ignore) {
                    setLoading(false);
                }
            }
        }

        loadSuggestedCities();

        return () => {
            ignore = true;
        };
    }, []);

    // Load Workspace Data
    const loadFavoritesWeatherData = async (favList) => {
        if (!favList || favList.length === 0) {
            setFavWeatherData([]);
            return;
        }
        setFavLoading(true);
        try {
            const results = await Promise.allSettled(
                favList.map((f) => fetchWeatherForCity(f.city))
            );
            const successful = results
                .filter((r) => r.status === "fulfilled")
                .map((r) => r.value);
            setFavWeatherData(successful);
        } catch (err) {
            console.error("Error loading favorite weather", err);
        } finally {
            setFavLoading(false);
        }
    };

    const loadWorkspace = async () => {
        if (!token) return;
        try {
            const favs = await fetchFavorites(token);
            setFavorites(favs);
            loadFavoritesWeatherData(favs);

            const subs = await fetchSubscriptions(token);
            setSubscriptions(subs);

            const alrts = await fetchAlerts(token);
            setAlerts(alrts);
        } catch (err) {
            console.error("Failed to load workspace", err);
        }
    };

    useEffect(() => {
        if (token) {
            loadWorkspace();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);


    const isFavorite = (city) => {
        if (!city) return false;
        return favorites.some((f) => f.city.toLowerCase() === city.toLowerCase());
    };

    const handleToggleFavorite = async (city) => {
        if (!token || !city) return;
        try {
            if (isFavorite(city)) {
                await removeFavorite(token, city);
            } else {
                await addFavorite(token, city);
            }
            loadWorkspace();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleSubSubmit = async (e) => {
        e.preventDefault();
        if (!token) return;
        if (!subCity.trim()) {
            setSubError("City name is required");
            return;
        }
        setSubError("");
        setSubSuccess("");
        try {
            await saveSubscription(token, {
                city: subCity.trim(),
                tempThresholdType: subTempType,
                tempThresholdVal: parseFloat(subTempVal),
                conditionThreshold: subCondition,
                isActive: subIsActive
            });
            setSubSuccess(`Successfully configured alert rule for ${subCity.trim()}`);
            loadWorkspace();
            setSubCity("");
            setSubTempType("NONE");
            setSubTempVal(30);
            setSubCondition("None");
            setSubIsActive(true);
        } catch (err) {
            setSubError(err.message);
        }
    };

    const handleDeleteSub = async (city) => {
        if (!token) return;
        try {
            await deleteSubscription(token, city);
            loadWorkspace();
        } catch (err) {
            console.error("Failed to delete sub", err);
        }
    };

    const handleTriggerAlertCheck = async () => {
        if (!token) return;
        setCheckingAlerts(true);
        try {
            await triggerAlertCheck(token);
            await loadWorkspace();
            window.dispatchEvent(new CustomEvent("alerts-updated"));
        } catch (err) {
            console.error("Failed to trigger alert check", err);
        } finally {
            setCheckingAlerts(false);
        }
    };

    const handleClearAlerts = async () => {
        if (!token) return;
        try {
            await clearAlerts(token);
            await loadWorkspace();
            window.dispatchEvent(new CustomEvent("alerts-updated"));
        } catch (err) {
            console.error("Failed to clear alerts", err);
        }
    };

    async function handleSearchSubmit(event) {
        event.preventDefault();

        const city = searchCity.trim();
        if (!city) {
            setError("Type a city name to search for weather.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const searchedWeather = await fetchWeatherForCity(city);
            setWeatherCards((currentCards) => dedupeCards([searchedWeather, ...currentCards]));
            setFeaturedWeather(searchedWeather);
            setLastUpdated(new Date().toLocaleString());
        } catch (searchError) {
            setError(searchError.message);
        } finally {
            setLoading(false);
        }
    }

    function handleSuggestionClick(city) {
        setSearchCity(city);
        setLoading(true);
        setError("");

        fetchWeatherForCity(city)
            .then((suggestedWeather) => {
                setWeatherCards((currentCards) => dedupeCards([suggestedWeather, ...currentCards]));
                setFeaturedWeather(suggestedWeather);
                setLastUpdated(new Date().toLocaleString());
            })
            .catch((suggestionError) => {
                setError(suggestionError.message);
            })
            .finally(() => {
                setLoading(false);
            });
    }

    return (
        <main className="home-page">
            <section className="home-shell">
                <section className="weather-panel">
                    <div className="panel-header">
                        <div>
                            <p className="section-label">OpenWeather search</p>
                            <h1>Search weather by city</h1>
                        </div>
                        {lastUpdated ? <p className="updated-at">Updated {lastUpdated}</p> : null}
                    </div>

                    <form className="search-form" onSubmit={handleSearchSubmit}>
                        <label className="sr-only" htmlFor="city-search">
                            Search for a city
                        </label>
                        <input
                            id="city-search"
                            type="text"
                            value={searchCity}
                            onChange={(event) => setSearchCity(event.target.value)}
                            placeholder="Type a city like Paris or Mumbai"
                            autoComplete="off"
                        />
                        <button type="submit" disabled={loading}>
                            {loading ? "Loading..." : "Get weather"}
                        </button>
                    </form>

                    <div className="suggestion-row" aria-label="Suggested cities">
                        {suggestedCities.map((city) => (
                            <button key={city} type="button" className="suggestion-chip" onClick={() => handleSuggestionClick(city)} disabled={loading}>
                                {city}
                            </button>
                        ))}
                    </div>

                    {error ? <div className="status-box status-box--error">{error}</div> : null}
                    {loading ? <div className="status-box status-box--loading">Calling OpenWeather for the selected city...</div> : null}

                    {!loading && !error && !featuredWeather ? (
                        <div className="status-box status-box--empty">
                            Start with one of the suggested cities or type your own city above.
                        </div>
                    ) : null}

                    {featuredWeather ? (
                        <article className="featured-weather">
                            <div className="featured-header">
                                <div className="featured-title-row">
                                    <div>
                                        <p className="featured-label">Featured city</p>
                                        <h3>
                                            {featuredWeather.city}, {featuredWeather.country}
                                        </h3>
                                    </div>
                                    <div className="featured-actions">
                                        <button
                                            type="button"
                                            className={`fav-button ${isFavorite(featuredWeather.city) ? "is-fav" : ""}`}
                                            onClick={() => handleToggleFavorite(featuredWeather.city)}
                                            title={isFavorite(featuredWeather.city) ? "Remove from favorites" : "Add to favorites"}
                                        >
                                            {isFavorite(featuredWeather.city) ? (
                                                <svg xmlns="http://www.w3.org/2000/svg" height="26px" viewBox="0 -960 960 960" width="26px" fill="#ef4444">
                                                    <path d="M480-120q-12 0-24.5-4.5T433-139q-102-92-167.5-154T151-447q-38-59-54.5-115T80-672q0-92 61.5-154T296-888q56 0 102.5 22t81.5 60q35-38 81.5-60T664-888q93 0 154.5 62T880-672q0 56-16.5 112T809-447q-40 59-105.5 121T536-172q-10 10-22.5 14.5T480-120Z"/>
                                                </svg>
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" height="26px" viewBox="0 -960 960 960" width="26px" fill="#cbd5e1">
                                                    <path d="m480-120-58-52q-101-91-167-153T150-447.5Q111-506 95.5-562T80-672q0-92 61.5-154T296-888q57 0 104 22.5t80 61.5q33-39 80-61.5T664-888q93 0 154.5 62T880-672q0 56-15.5 112T810-447.5Q771-506 705-325T538-172l-58 52Zm0-108q96-86 158-147.5t98-107q36-45.5 49-81t13-75.5q0-58-38.5-97t-96.5-39q-44 0-83 22.5T520-582h-80q-21-39-60-61.5T296-666q-58 0-96.5 39T161-530q0 40 13 75.5t49 81q36 45.5 98 107T480-228Zm0-282Z"/>
                                                </svg>
                                            )}
                                        </button>
                                        <button
                                            type="button"
                                            className="action-sub-btn"
                                            onClick={() => {
                                                setSubCity(featuredWeather.city);
                                                setActiveTab("subscriptions");
                                                document.getElementById("workspace-section")?.scrollIntoView({ behavior: "smooth" });
                                            }}
                                            title="Configure Alerts"
                                        >
                                            Alert Settings
                                        </button>
                                    </div>
                                </div>
                                <p>{featuredWeather.description}</p>
                            </div>
                            <div className="featured-temp">
                                <img
                                    src={`https://openweathermap.org/img/wn/${featuredWeather.icon}@4x.png`}
                                    alt={featuredWeather.description}
                                />
                                <strong>{featuredWeather.temperature}°C</strong>
                                <span>Feels like {featuredWeather.feelsLike}°C</span>
                            </div>
                        </article>
                    ) : null}

                    <div className="weather-grid">
                        {weatherCards.map((weatherCard) => (
                            <article className="weather-card" key={weatherCard.cityKey}>
                                <div className="weather-card__header">
                                    <div>
                                        <div className="card-title-row">
                                            <p>{weatherCard.condition}</p>
                                            <button
                                                type="button"
                                                className={`fav-button-small ${isFavorite(weatherCard.city) ? "is-fav" : ""}`}
                                                onClick={() => handleToggleFavorite(weatherCard.city)}
                                            >
                                                {isFavorite(weatherCard.city) ? (
                                                    <svg xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 -960 960 960" width="18px" fill="#ef4444">
                                                        <path d="M480-120q-12 0-24.5-4.5T433-139q-102-92-167.5-154T151-447q-38-59-54.5-115T80-672q0-92 61.5-154T296-888q56 0 102.5 22t81.5 60q35-38 81.5-60T664-888q93 0 154.5 62T880-672q0 56-16.5 112T809-447q-40 59-105.5 121T536-172q-10 10-22.5 14.5T480-120Z"/>
                                                    </svg>
                                                ) : (
                                                    <svg xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 -960 960 960" width="18px" fill="#94a3b8">
                                                        <path d="m480-120-58-52q-101-91-167-153T150-447.5Q111-506 95.5-562T80-672q0-92 61.5-154T296-888q57 0 104 22.5t80 61.5q33-39 80-61.5T664-888q93 0 154.5 62T880-672q0 56-15.5 112T810-447.5Q771-506 705-325T538-172l-58 52Zm0-108q96-86 158-147.5t98-107q36-45.5 49-81t13-75.5q0-58-38.5-97t-96.5-39q-44 0-83 22.5T520-582h-80q-21-39-60-61.5T296-666q-58 0-96.5 39T161-530q0 40 13 75.5t49 81q36 45.5 98 107T480-228Zm0-282Z"/>
                                                    </svg>
                                                )}
                                            </button>
                                        </div>
                                        <h3>
                                            {weatherCard.city}, {weatherCard.country}
                                        </h3>
                                    </div>
                                    <img src={`https://openweathermap.org/img/wn/${weatherCard.icon}.png`} alt={weatherCard.description} />
                                </div>

                                <p className="weather-description">{weatherCard.description}</p>

                                <div className="weather-metric-grid">
                                    <div>
                                        <span>Temp</span>
                                        <strong>{weatherCard.temperature}°C</strong>
                                    </div>
                                    <div>
                                        <span>Feels like</span>
                                        <strong>{weatherCard.feelsLike}°C</strong>
                                    </div>
                                    <div>
                                        <span>Humidity</span>
                                        <strong>{weatherCard.humidity}%</strong>
                                    </div>
                                    <div>
                                        <span>Pressure</span>
                                        <strong>{weatherCard.pressure} hPa</strong>
                                    </div>
                                    <div>
                                        <span>Wind</span>
                                        <strong>{weatherCard.windSpeed} m/s</strong>
                                    </div>
                                    <div>
                                        <span>Visibility</span>
                                        <strong>{weatherCard.visibility}</strong>
                                    </div>
                                    <div>
                                        <span>Sunrise</span>
                                        <strong>{weatherCard.sunrise}</strong>
                                    </div>
                                    <div>
                                        <span>Sunset</span>
                                        <strong>{weatherCard.sunset}</strong>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="workspace-panel" id="workspace-section">
                    <div className="workspace-tabs">
                        <button
                            type="button"
                            className={`tab-btn ${activeTab === "favorites" ? "active" : ""}`}
                            onClick={() => setActiveTab("favorites")}
                        >
                            My Favorites ({favorites.length})
                        </button>
                        <button
                            type="button"
                            className={`tab-btn ${activeTab === "subscriptions" ? "active" : ""}`}
                            onClick={() => setActiveTab("subscriptions")}
                        >
                            Alert Rules ({subscriptions.length})
                        </button>
                        <button
                            type="button"
                            className={`tab-btn ${activeTab === "alerts" ? "active" : ""}`}
                            onClick={() => setActiveTab("alerts")}
                        >
                            Triggered Alerts ({alerts.length})
                        </button>
                    </div>

                    <div className="workspace-content">
                        {activeTab === "favorites" && (
                            <div className="favorites-tab">
                                <h2>Favorite Cities Weather</h2>
                                {favLoading && <p className="loading-text">Updating favorite cities conditions...</p>}
                                {!favLoading && favWeatherData.length === 0 && (
                                    <div className="empty-state">
                                        <p>You haven't favorited any cities yet. Search a city above and click the heart icon to add it.</p>
                                    </div>
                                )}
                                <div className="weather-grid">
                                    {favWeatherData.map((weatherCard) => (
                                        <article className="weather-card fav-card" key={weatherCard.cityKey}>
                                            <div className="weather-card__header">
                                                <div>
                                                    <h3>{weatherCard.city}, {weatherCard.country}</h3>
                                                    <p className="condition-label">{weatherCard.condition} — {weatherCard.temperature}°C</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    className="remove-fav-btn"
                                                    onClick={() => handleToggleFavorite(weatherCard.city)}
                                                    title="Remove from favorites"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                            <div className="fav-metrics">
                                                <span>Wind: {weatherCard.windSpeed} m/s</span>
                                                <span>Humidity: {weatherCard.humidity}%</span>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === "subscriptions" && (
                            <div className="subscriptions-tab">
                                <div className="sub-grid">
                                    <div className="sub-form-card">
                                        <h3>Create Weather Alert Rule</h3>
                                        <form onSubmit={handleSubSubmit} className="sub-form">
                                            <div className="form-group">
                                                <label>Target City</label>
                                                <input
                                                    type="text"
                                                    value={subCity}
                                                    onChange={(e) => setSubCity(e.target.value)}
                                                    placeholder="e.g. London"
                                                    required
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Temperature Threshold Type</label>
                                                <select
                                                    value={subTempType}
                                                    onChange={(e) => setSubTempType(e.target.value)}
                                                >
                                                    <option value="NONE">None</option>
                                                    <option value="ABOVE">Above Threshold</option>
                                                    <option value="BELOW">Below Threshold</option>
                                                </select>
                                            </div>
                                            {subTempType !== "NONE" && (
                                                <div className="form-group">
                                                    <label>Temperature Limit (°C)</label>
                                                    <input
                                                        type="number"
                                                        value={subTempVal}
                                                        onChange={(e) => setSubTempVal(e.target.value)}
                                                    />
                                                </div>
                                            )}
                                            <div className="form-group">
                                                <label>Weather Condition Alert</label>
                                                <select
                                                    value={subCondition}
                                                    onChange={(e) => setSubCondition(e.target.value)}
                                                >
                                                    <option value="None">None</option>
                                                    <option value="Rain">Rain</option>
                                                    <option value="Snow">Snow</option>
                                                    <option value="Clouds">Clouds</option>
                                                    <option value="Clear">Clear</option>
                                                    <option value="Thunderstorm">Thunderstorm</option>
                                                    <option value="Drizzle">Drizzle</option>
                                                </select>
                                            </div>
                                            <div className="form-group checkbox-group">
                                                <label>
                                                    <input
                                                        type="checkbox"
                                                        checked={subIsActive}
                                                        onChange={(e) => setSubIsActive(e.target.checked)}
                                                    />
                                                    Active Rule
                                                </label>
                                            </div>
                                            {subError && <div className="sub-msg sub-msg--error">{subError}</div>}
                                            {subSuccess && <div className="sub-msg sub-msg--success">{subSuccess}</div>}
                                            <button type="submit" className="save-sub-btn">
                                                Save Subscription Rule
                                            </button>
                                        </form>
                                    </div>

                                    <div className="sub-list-card">
                                        <h3>Active Subscriptions</h3>
                                        {subscriptions.length === 0 ? (
                                            <p className="no-subs">No alert rules configured yet.</p>
                                        ) : (
                                            <div className="subs-list">
                                                {subscriptions.map((sub) => (
                                                    <div key={sub.id} className="sub-item">
                                                        <div className="sub-item-details">
                                                            <h4>{sub.city}</h4>
                                                            <div className="sub-rules-summary">
                                                                {sub.tempThresholdType !== "NONE" && (
                                                                    <span>Temp {sub.tempThresholdType.toLowerCase()} {sub.tempThresholdVal}°C</span>
                                                                )}
                                                                {sub.conditionThreshold !== "None" && (
                                                                    <span>Condition: {sub.conditionThreshold}</span>
                                                                )}
                                                                {sub.tempThresholdType === "NONE" && sub.conditionThreshold === "None" && (
                                                                    <span className="no-rules-text">No active limits (monitoring only)</span>
                                                                )}
                                                            </div>
                                                            <span className={`sub-status ${sub.isActive ? "active" : "inactive"}`}>
                                                                {sub.isActive ? "Monitoring" : "Paused"}
                                                            </span>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            className="delete-sub-btn"
                                                            onClick={() => handleDeleteSub(sub.city)}
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "alerts" && (
                            <div className="alerts-tab">
                                <div className="alerts-actions-row">
                                    <h2>Triggered Weather Warnings</h2>
                                    <div className="btn-group">
                                        <button
                                            type="button"
                                            className="trigger-check-btn"
                                            onClick={handleTriggerAlertCheck}
                                            disabled={checkingAlerts}
                                        >
                                            {checkingAlerts ? "Evaluating..." : "Check Rules Now"}
                                        </button>
                                        {alerts.length > 0 && (
                                            <button
                                                type="button"
                                                className="clear-alerts-btn"
                                                onClick={handleClearAlerts}
                                            >
                                                Clear History
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {alerts.length === 0 ? (
                                    <div className="empty-state">
                                        <p>No alerts have been triggered yet. Weather checks run automatically every 30 minutes, or you can click "Check Rules Now" above to run rules immediately on active cities.</p>
                                    </div>
                                ) : (
                                    <div className="alerts-log">
                                        {alerts.map((alert) => (
                                            <div key={alert.id} className={`alert-log-card ${!alert.isRead ? "unread" : ""}`}>
                                                <div className="alert-log-header">
                                                    <strong>{alert.city}</strong>
                                                    <span>{new Date(alert.createdAt).toLocaleString()}</span>
                                                </div>
                                                <p>{alert.message}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </section>
            </section>
        </main>
    );
}

export default Home;