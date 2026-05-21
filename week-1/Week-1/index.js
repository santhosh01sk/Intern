var weatherApiKey = "f6bef624b15d1fa1052b3689e3636987";
var weatherApiUrl = "https://api.openweathermap.org/data/2.5/weather?q=Chennai&appid=" + weatherApiKey + "&units=metric";

var weatherStatus = document.getElementById("weather-status");
var weatherContent = document.getElementById("weather-content");

function renderWeatherCard(label, value) {
    return '<article class="weather-card"><strong>' + label + '</strong><span class="weather-value">' + value + '</span></article>';
}

function showWeatherError(message) {
    if (weatherStatus) {
        weatherStatus.textContent = message;
    }

    if (weatherContent) {
        weatherContent.innerHTML = '<p class="weather-error">' + message + '</p>';
    }
}

function loadChennaiWeather() {
    if (!weatherStatus || !weatherContent) {
        return Promise.resolve();
    }

    return fetch(weatherApiUrl)
        .then(function (response) {
            if (!response.ok) {
                throw new Error("Weather request failed: " + response.status);
            }

            return response.json();
        })
        .then(function (data) {
            var cityName = data.name || "Chennai";
            var temperature = Math.round(data.main.temp) + "°C";
            var feelsLike = Math.round(data.main.feels_like) + "°C";
            var humidity = data.main.humidity + "%";
            var windSpeed = data.wind.speed + " m/s";
            var description = data.weather && data.weather[0] ? data.weather[0].description : "Unavailable";

            weatherStatus.textContent = cityName + " updated just now";
            weatherContent.innerHTML = [
                renderWeatherCard("Temperature", temperature),
                renderWeatherCard("Feels Like", feelsLike),
                renderWeatherCard("Humidity", humidity),
                renderWeatherCard("Wind", windSpeed),
                renderWeatherCard("Conditions", description)
            ].join("");
        })
        .catch(function (error) {
            console.error("Error fetching weather data:", error);
            showWeatherError("Unable to load Chennai weather right now.");
        });
}

var form = document.getElementById("contact-form");

if (form) {
    form.addEventListener("submit", function (event) {
        event.preventDefault();

        var name = document.getElementById("name");
        var email = document.getElementById("email");
        var emailPattern = /^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

        if (!name || !email) {
            return;
        }

        if (name.value.trim() === "") {
            alert("Name cannot be empty");
            return;
        }

        if (!emailPattern.test(email.value.trim())) {
            alert("Invalid email address");
            return;
        }

        alert("Form submitted successfully");
        window.location.href = "index.html";
    });
}

loadChennaiWeather();