const weatherForm = document.getElementById('weather-form');
const cityInput = document.getElementById('city-input');
const weatherResult = document.getElementById('weather-result');
const forecastDiv = document.getElementById('forecast');
const backgroundImage = document.getElementById('background-image');

// Cinematic HD background images mapped to Open-Meteo weather codes
const weatherBackgrounds = {
  0:  'url("https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=80")', // Clear sky
  1:  'url("https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=1920&q=80")', // Mainly clear
  2:  'url("https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=1920&q=80")', // Partly cloudy
  3:  'url("https://images.unsplash.com/photo-1464013778555-8e723c2f01f8?auto=format&fit=crop&w=1920&q=80")', // Overcast
  45: 'url("https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=1920&q=80")', // Fog
  48: 'url("https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=1920&q=80")', // Depositing rime fog
  51: 'url("https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1920&q=80")', // Drizzle
  53: 'url("https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1920&q=80")',
  55: 'url("https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1920&q=80")',
  61: 'url("https://images.unsplash.com/photo-1465101178521-c1a9136a3b99?auto=format&fit=crop&w=1920&q=80")', // Rain
  63: 'url("https://images.unsplash.com/photo-1465101178521-c1a9136a3b99?auto=format&fit=crop&w=1920&q=80")',
  65: 'url("https://images.unsplash.com/photo-1465101178521-c1a9136a3b99?auto=format&fit=crop&w=1920&q=80")',
  71: 'url("https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1920&q=80")', // Snow
  73: 'url("https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1920&q=80")',
  75: 'url("https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1920&q=80")',
  80: 'url("https://images.unsplash.com/photo-1465101178521-c1a9136a3b99?auto=format&fit=crop&w=1920&q=80")', // Rain showers
  81: 'url("https://images.unsplash.com/photo-1465101178521-c1a9136a3b99?auto=format&fit=crop&w=1920&q=80")',
  82: 'url("https://images.unsplash.com/photo-1465101178521-c1a9136a3b99?auto=format&fit=crop&w=1920&q=80")',
  95: 'url("https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=1920&q=80")', // Thunderstorm
  96: 'url("https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=1920&q=80")',
  99: 'url("https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=1920&q=80")'
};

// Default background image URL (used when input is empty or fallback)
const defaultBackground = 'url("https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=80")';

// Set background image based on weather code or default
function setWeatherBackground(code) {
  const bg = weatherBackgrounds[code] || defaultBackground;
  if (backgroundImage) {
    backgroundImage.style.backgroundImage = bg;
  }
}

// Temperature-based emoji fallback icon
function getTempIcon(temp) {
  if (temp >= 30) return '🔥';
  if (temp >= 20) return '☀️';
  if (temp >= 10) return '🌤️';
  if (temp >= 0)  return '🌥️';
  return '❄️';
}

// Format date string for forecast display
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
}

weatherForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const city = cityInput.value.trim();

  if (!city) {
    setWeatherBackground(null);
    weatherResult.innerHTML = `
      <div class="weather-card error-card">
        <span class="weather-icon" style="font-size:2.5rem;">⚠️</span>
        <div>
          <div style="color:#fff;"><strong>Please enter a city name.</strong></div>
          <div>The input field cannot be empty.</div>
        </div>
      </div>
    `;
    forecastDiv.innerHTML = '';
    return;
  }

  weatherResult.innerHTML = 'Loading...';
  forecastDiv.innerHTML = '';

  try {
    // Geocode city
    const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`);
    if (!geoRes.ok) throw new Error('Failed to fetch geocoding data');
    const geoData = await geoRes.json();
    if (!geoData.results || geoData.results.length === 0) {
      throw new Error('City not found. Please check your spelling and try again.');
    }

    const { latitude, longitude, name, country } = geoData.results[0];

    // Fetch weather forecast
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,weathercode&timezone=auto`;
    const weatherRes = await fetch(weatherUrl);
    if (!weatherRes.ok) throw new Error('Failed to fetch weather data');
    const weatherData = await weatherRes.json();

    const hourlyTemps = weatherData.hourly.temperature_2m;
    const hourlyWeatherCodes = weatherData.hourly.weathercode;
    const times = weatherData.hourly.time;

    // Find closest hour index to now
    const now = new Date();
    let closestIndex = 0;
    let minDiff = Infinity;
    times.forEach((timeStr, i) => {
      const timeDate = new Date(timeStr);
      const diff = Math.abs(timeDate - now);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = i;
      }
    });

    const currentTemp = hourlyTemps[closestIndex];
    const currentCode = hourlyWeatherCodes ? hourlyWeatherCodes[closestIndex] : null;

    setWeatherBackground(currentCode);

    const weatherCodeMap = {
      0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️', 45: '🌫️', 48: '🌫️',
      51: '🌦️', 53: '🌦️', 55: '🌧️', 61: '🌧️', 63: '🌧️', 65: '🌧️',
      71: '❄️', 73: '❄️', 75: '❄️', 80: '🌧️', 81: '🌧️', 82: '🌧️',
      95: '⛈️', 96: '⛈️', 99: '⛈️'
    };
    const currentIcon = currentCode !== null ? (weatherCodeMap[currentCode] || '🌈') : getTempIcon(currentTemp);

    weatherResult.innerHTML = `
      <div class="weather-card">
        <span class="weather-icon">${currentIcon}</span>
        <div>
          <div><strong>${name}, ${country}</strong></div>
          <div>🌡️ ${currentTemp.toFixed(1)}°C</div>
          <div>Condition code: ${currentCode !== null ? currentCode : 'N/A'}</div>
        </div>
      </div>
    `;

    const dailyTemps = {};
    times.forEach((timeStr, i) => {
      const dateStr = timeStr.split('T')[0];
      if (!dailyTemps[dateStr]) dailyTemps[dateStr] = [];
      dailyTemps[dateStr].push(hourlyTemps[i]);
    });

    const dailyAvgTemps = Object.entries(dailyTemps).map(([date, temps]) => {
      const avg = temps.reduce((a,b) => a + b, 0) / temps.length;
      return { date, avgTemp: avg };
    });

    forecastDiv.innerHTML = '<h3>5-Day Temperature Forecast</h3>';
    dailyAvgTemps.slice(0, 5).forEach(day => {
      const icon = getTempIcon(day.avgTemp);
      forecastDiv.innerHTML += `
        <div class="weather-card">
          <span class="weather-icon">${icon}</span>
          <div>
            <div><strong>${formatDate(day.date)}</strong></div>
            <div>Avg Temp: ${day.avgTemp.toFixed(1)}°C</div>
          </div>
        </div>
      `;
    });

  } catch (err) {
    weatherResult.innerHTML = `
      <div class="weather-card error-card">
        <span class="weather-icon" style="font-size:2.5rem;">❗</span>
        <div>
          <div style="color:#c00;"><strong>${err.message}</strong></div>
          <div>Please enter a valid city name.</div>
        </div>
      </div>
    `;
    forecastDiv.innerHTML = '';
    setWeatherBackground(null);
  }
});

