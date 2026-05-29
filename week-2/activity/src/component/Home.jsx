import React, { useEffect, useState } from "react";
import "./Home.scss";

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
                            <div>
                                <p className="featured-label">Featured city</p>
                                <h3>
                                    {featuredWeather.city}, {featuredWeather.country}
                                </h3>
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
                                        <p>{weatherCard.condition}</p>
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
            </section>
        </main>
    );
}

export default Home;