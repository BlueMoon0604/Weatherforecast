const form = document.getElementById('weather-form');
const cityInput = document.getElementById('city-input');
const weatherResult = document.getElementById('weather-result');
const forecastDiv = document.getElementById('forecast');

// Helper to get coordinates from city name
async function getCoordinates(city) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch coordinates');
  const data = await res.json();
  if (!data.results || data.results.length === 0) throw new Error('City not found');
  return {
    latitude: data.results[0].latitude,
    longitude: data.results[0].longitude,
    name: data.results[0].name,
    country: data.results[0].country,
  };
}

// Helper to get weather data
async function getWeather(latitude, longitude) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch weather');
  return await res.json();
}

// Format ISO time to readable format
function formatTime(isoString) {
  const date = new Date(isoString);
  return date.toLocaleString(undefined, { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' });
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const city = cityInput.value.trim();
  if (!city) return;
  weatherResult.innerHTML = 'Loading...';
  forecastDiv.innerHTML = '';
  try {
    // Step 1: Get coordinates
    const { latitude, longitude, name, country } = await getCoordinates(city);

    // Step 2: Get weather
    const weatherData = await getWeather(latitude, longitude);

    // Find the current hour's temperature
    const now = new Date();
    const timeIndex = weatherData.hourly.time.findIndex(t => {
      // Compare up to the hour
      return new Date(t).getHours() === now.getHours() &&
             new Date(t).getDate() === now.getDate();
    });
    const currentTemp = weatherData.hourly.temperature_2m[timeIndex];

    weatherResult.innerHTML = `
      <div class="weather-info">
        <h2>${name}, ${country}</h2>
        <p>🌡️ Current Temperature: ${currentTemp} °C</p>
      </div>
    `;

    // Show next 5 hourly forecasts
    let forecastHTML = '<h3>Next 5 Hours</h3><div class="forecast-container">';
    for (let i = timeIndex + 1; i <= timeIndex + 5 && i < weatherData.hourly.time.length; i++) {
      forecastHTML += `
        <div class="forecast-day">
          <strong>${formatTime(weatherData.hourly.time[i])}</strong>
          <p>🌡️ ${weatherData.hourly.temperature_2m[i]} °C</p>
        </div>
      `;
    }
    forecastHTML += '</div>';
    forecastDiv.innerHTML = forecastHTML;

  } catch (err) {
    weatherResult.innerHTML = `<p style="color:red;">${err.message}</p>`;
  }
});

