// API Key for OpenWeatherMap - GET YOUR OWN KEY from openweathermap.org
const API_KEY = '9befe080749716fbe28bca335b1d6ba0'; // Replace with your actual API key

// DOM Elements
const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const locationBtn = document.getElementById('location-btn');
const currentCity = document.getElementById('current-city');
const currentTemp = document.getElementById('current-temp');
const weatherDescription = document.getElementById('weather-description');
const windSpeed = document.getElementById('wind-speed');
const humidity = document.getElementById('humidity');
const feelsLike = document.getElementById('feels-like');
const weatherIcon = document.getElementById('weather-icon');
const forecastContainer = document.getElementById('forecast');
const suggestionsContainer = document.querySelector('.suggestions-container');

// Event Listeners
searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) {
        getWeatherData(city);
        suggestionsContainer.style.display = 'none';
    }
});

locationBtn.addEventListener('click', getLocationWeather);

cityInput.addEventListener('input', debounce(handleCityInput, 300));
cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const city = cityInput.value.trim();
        if (city) {
            getWeatherData(city);
            suggestionsContainer.style.display = 'none';
        }
    }
});

// Initialize with a default city
window.addEventListener('load', () => {
    getWeatherData('London');
});

// Debounce function for input events
function debounce(func, delay) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}

// Handle city input for suggestions
async function handleCityInput() {
    const input = cityInput.value.trim();
    if (input.length < 2) {
        suggestionsContainer.style.display = 'none';
        return;
    }

    try {
        const response = await fetch(
            `https://api.openweathermap.org/geo/1.0/direct?q=${input}&limit=5&appid=${API_KEY}`
        );
        const data = await response.json();
        showSuggestions(data);
    } catch (error) {
        console.error('Error fetching city suggestions:', error);
        suggestionsContainer.style.display = 'none';
    }
}

// Show city suggestions
function showSuggestions(cities) {
    if (!cities || cities.length === 0) {
        suggestionsContainer.style.display = 'none';
        return;
    }

    suggestionsContainer.innerHTML = '';
    cities.forEach(city => {
        const suggestion = document.createElement('div');
        suggestion.className = 'suggestion';
        suggestion.textContent = `${city.name}, ${city.country}`;
        suggestion.addEventListener('click', () => {
            cityInput.value = `${city.name}, ${city.country}`;
            suggestionsContainer.style.display = 'none';
            getWeatherData(`${city.name}, ${city.country}`);
        });
        suggestionsContainer.appendChild(suggestion);
    });
    suggestionsContainer.style.display = 'block';
}

// Hide suggestions when clicking outside
document.addEventListener('click', (e) => {
    if (!cityInput.contains(e.target) && !suggestionsContainer.contains(e.target)) {
        suggestionsContainer.style.display = 'none';
    }
});

// Main weather data function
async function getWeatherData(city) {
    try {
        // Show loading state
        currentCity.textContent = "Loading...";
        currentTemp.textContent = "--°C";
        
        // Fetch current weather
        const currentWeatherResponse = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}`
        );

        if (!currentWeatherResponse.ok) {
            throw new Error('City not found');
        }

        const currentWeatherData = await currentWeatherResponse.json();

        // Fetch 7-day forecast
        const forecastResponse = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${API_KEY}`
        );

        const forecastData = await forecastResponse.json();

        // Update UI with weather data
        updateCurrentWeather(currentWeatherData);
        updateForecast(forecastData);

    } catch (error) {
        alert(error.message);
        console.error('Error fetching weather data:', error);
        currentCity.textContent = "Error loading data";
    }
}

// Update current weather display
function updateCurrentWeather(data) {
    currentCity.textContent = `${data.name}, ${data.sys.country}`;
    currentTemp.textContent = `${Math.round(data.main.temp)}°C`;
    weatherDescription.textContent = data.weather[0].description;
    windSpeed.textContent = `${Math.round(data.wind.speed * 3.6)} km/h`;
    humidity.textContent = `${data.main.humidity}%`;
    feelsLike.textContent = `${Math.round(data.main.feels_like)}°C`;

    const iconCode = data.weather[0].icon;
    weatherIcon.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
    weatherIcon.alt = data.weather[0].description;

    // Update background based on weather
    setWeatherBackground(data.weather[0].main);
}

// Set weather-appropriate background
function setWeatherBackground(weatherType) {
    const bg = document.querySelector('.background');
    let imageUrl;

    switch (weatherType.toLowerCase()) {
        case 'rain':
        case 'drizzle':
        case 'thunderstorm':
            imageUrl = 'rainy.jpg';
            break;
        case 'snow':
            imageUrl = 'snow.jpg';
            break;
        case 'clouds':
            imageUrl = 'cloudy.jpg';
            break;
        case 'clear':
            imageUrl = 'sunny.jpg';
            break;
        default:
            imageUrl = 'default.jpg';
    }

    // Apply the background with a smooth fade-in effect
    bg.style.transition = 'opacity 0.5s ease-in-out';
    bg.style.opacity = 0;

    setTimeout(() => {
        bg.style.backgroundImage = `url(${imageUrl})`;
        bg.style.backgroundSize = 'cover';
        bg.style.backgroundPosition = 'center';
        bg.style.backgroundRepeat = 'no-repeat';
        bg.style.opacity = 1;
    }, 300);
}


// Update forecast display
function updateForecast(data) {
    forecastContainer.innerHTML = '';

    const dailyForecasts = {};

    data.list.forEach(forecast => {
        const date = new Date(forecast.dt * 1000);
        const day = date.toLocaleDateString('en-US', { weekday: 'short' });
        const dateKey = date.toLocaleDateString();

        if (!dailyForecasts[dateKey]) {
            dailyForecasts[dateKey] = {
                day,
                date: dateKey,
                temps: [],
                weather: [],
                wind: [],
                humidity: []
            };
        }

        dailyForecasts[dateKey].temps.push(forecast.main.temp);
        dailyForecasts[dateKey].weather.push(forecast.weather[0]);
        dailyForecasts[dateKey].wind.push(forecast.wind.speed);
        dailyForecasts[dateKey].humidity.push(forecast.main.humidity);
    });

    const next7Days = Object.values(dailyForecasts).slice(0, 7);

    next7Days.forEach(dayData => {
        const maxTemp = Math.round(Math.max(...dayData.temps));
        const minTemp = Math.round(Math.min(...dayData.temps));

        const weatherCounts = {};
        dayData.weather.forEach(weather => {
            const key = weather.main;
            weatherCounts[key] = (weatherCounts[key] || 0) + 1;
        });

        const mostCommonWeather = Object.entries(weatherCounts).reduce((a, b) =>
            a[1] > b[1] ? a : b
        )[0];

        const weatherObj = dayData.weather.find(w => w.main === mostCommonWeather);
        const avgWind = Math.round(dayData.wind.reduce((a, b) => a + b, 0) / dayData.wind.length * 3.6);
        const avgHumidity = Math.round(dayData.humidity.reduce((a, b) => a + b, 0) / dayData.humidity.length);

        const forecastCard = document.createElement('div');
        forecastCard.className = 'forecast-card';
        forecastCard.innerHTML = `
            <div class="forecast-day">${dayData.day}</div>
            <div class="forecast-icon">
                <img src="https://openweathermap.org/img/wn/${weatherObj.icon}.png" alt="${weatherObj.description}">
            </div>
            <div class="forecast-temp">
                <span class="forecast-temp-max">${maxTemp}°</span>
                <span class="forecast-temp-min">${minTemp}°</span>
            </div>
            <div class="forecast-details">
                <div><i class="fas fa-wind"></i> ${avgWind} km/h</div>
                <div><i class="fas fa-tint"></i> ${avgHumidity}%</div>
            </div>
        `;

        forecastContainer.appendChild(forecastCard);
    });
}

// Get weather by current location
function getLocationWeather() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;

                try {
                    const response = await fetch(
                        `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${API_KEY}`
                    );

                    const locationData = await response.json();

                    if (locationData.length > 0) {
                        const city = locationData[0].name;
                        cityInput.value = city;
                        getWeatherData(city);
                    }
                } catch (error) {
                    console.error('Error getting location weather:', error);
                    alert('Unable to get weather for your location');
                }
            },
            (error) => {
                console.error('Geolocation error:', error);
                alert('Unable to access your location. Please enable location services.');
            }
        );
    } else {
        alert('Geolocation is not supported by your browser');
    }
}