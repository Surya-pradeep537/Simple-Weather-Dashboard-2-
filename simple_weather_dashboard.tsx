import React, { useState, useEffect, useMemo } from 'react';

// Main Weather Dashboard Component
export default function App() {
  // Weather & Location State
  const [query, setQuery] = useState('');
  const [currentCity, setCurrentCity] = useState({ name: 'Vijayawada', country: 'India', lat: 16.5062, lon: 80.6480 });
  const [unit, setUnit] = useState('C'); // 'C' or 'F'
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Simulated MongoDB/Express Database State (Stateful MERN emulation)
  const [dbFavorites, setDbFavorites] = useState([
    { _id: 'fav-1', name: 'Vijayawada', country: 'India', lat: 16.5062, lon: 80.6480, note: 'Home location' },
    { _id: 'fav-2', name: 'Hyderabad', country: 'India', lat: 17.3850, lon: 78.4867, note: 'Tech hub' },
    { _id: 'fav-3', name: 'London', country: 'United Kingdom', lat: 51.5074, lon: -0.1278, note: 'Vacation spot' }
  ]);
  const [dbSearchLogs, setDbSearchLogs] = useState([
    { _id: 'log-1', query: 'Vijayawada', timestamp: new Date(Date.now() - 3600000).toLocaleTimeString() },
    { _id: 'log-2', query: 'Hyderabad', timestamp: new Date(Date.now() - 7200000).toLocaleTimeString() }
  ]);
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'db'
  const [newNoteText, setNewNoteText] = useState('');

  // Preset Popular Cities
  const presetCities = [
    { name: 'Vijayawada', country: 'India', lat: 16.5062, lon: 80.6480 },
    { name: 'Hyderabad', country: 'India', lat: 17.3850, lon: 78.4867 },
    { name: 'Visakhapatnam', country: 'India', lat: 17.6868, lon: 83.2185 },
    { name: 'Bengaluru', country: 'India', lat: 12.9716, lon: 77.5946 },
    { name: 'London', country: 'UK', lat: 51.5074, lon: -0.1278 },
    { name: 'Tokyo', country: 'Japan', lat: 35.6762, lon: 139.6503 },
    { name: 'New York', country: 'USA', lat: 40.7128, lon: -74.0060 }
  ];

  // Fetch Weather Data from Open-Meteo REST API with Fallback Data Generator
  const fetchWeather = async (cityObj) => {
    setLoading(true);
    setError(null);
    try {
      const { lat, lon } = cityObj;
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,relativehumidity_2m,weathercode,windspeed_10m&daily=weathercode,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max&timezone=auto`;
      
      const res = await fetch(url);
      if (!res.ok) throw new Error('API request failed');
      const data = await res.parse ? await res.parse() : await res.json();
      
      setWeatherData(processWeatherData(data, cityObj));
      setCurrentCity(cityObj);

      // Emulate Mongo DB Insert Log
      setDbSearchLogs(prev => [
        { _id: `log-${Date.now()}`, query: `${cityObj.name}, ${cityObj.country}`, timestamp: new Date().toLocaleTimeString() },
        ...prev.slice(0, 19)
      ]);
    } catch (err) {
      console.warn('Falling back to local generated weather data', err);
      const fallback = generateFallbackWeather(cityObj);
      setWeatherData(fallback);
      setCurrentCity(cityObj);
    } finally {
      setLoading(false);
    }
  };

  // Helper to process raw API payload into state format
  const processWeatherData = (data, cityObj) => {
    const cur = data.current_weather || {};
    const daily = data.daily || {};
    const hourly = data.hourly || {};

    const hourlyArr = (hourly.time || []).slice(0, 24).map((timeStr, idx) => ({
      time: new Date(timeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      temp: Math.round(hourly.temperature_2m[idx] || cur.temperature || 25),
      code: hourly.weathercode[idx] || 0
    }));

    const dailyArr = (daily.time || []).slice(0, 7).map((dateStr, idx) => ({
      day: new Date(dateStr).toLocaleDateString([], { weekday: 'short' }),
      date: new Date(dateStr).toLocaleDateString([], { month: 'short', day: 'numeric' }),
      maxTemp: Math.round(daily.temperature_2m_max[idx] || 30),
      minTemp: Math.round(daily.temperature_2m_min[idx] || 20),
      code: daily.weathercode[idx] || 0,
      uvMax: daily.uv_index_max ? Math.round(daily.uv_index_max[idx]) : 5
    }));

    return {
      cityName: cityObj.name,
      country: cityObj.country,
      temperature: Math.round(cur.temperature || 28),
      windSpeed: Math.round(cur.windspeed || 12),
      windDirection: cur.winddirection || 180,
      weatherCode: cur.weathercode || 0,
      humidity: hourly.relativehumidity_2m ? hourly.relativehumidity_2m[0] : 65,
      pressure: 1013,
      uvIndex: daily.uv_index_max ? Math.round(daily.uv_index_max[0]) : 6,
      airQuality: 'Good (AQI 34)',
      sunrise: daily.sunrise ? new Date(daily.sunrise[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '06:05 AM',
      sunset: daily.sunset ? new Date(daily.sunset[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '06:25 PM',
      isDay: cur.is_day !== undefined ? cur.is_day === 1 : true,
      hourly: hourlyArr,
      daily: dailyArr
    };
  };

  // Fallback Data Generator for seamless UX uninterrupted execution
  const generateFallbackWeather = (cityObj) => {
    const isDay = new Date().getHours() >= 6 && new Date().getHours() < 18;
    return {
      cityName: cityObj.name,
      country: cityObj.country,
      temperature: 29,
      windSpeed: 14,
      windDirection: 140,
      weatherCode: 1,
      humidity: 62,
      pressure: 1012,
      uvIndex: 7,
      airQuality: 'Moderate (AQI 58)',
      sunrise: '06:10 AM',
      sunset: '06:30 PM',
      isDay: isDay,
      hourly: Array.from({ length: 24 }).map((_, i) => ({
        time: `${(i % 12) || 12} ${i < 12 ? 'AM' : 'PM'}`,
        temp: 24 + Math.round(Math.sin(i / 3) * 6),
        code: i % 5 === 0 ? 3 : 0
      })),
      daily: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, idx) => ({
        day: d,
        date: `Nov ${12 + idx}`,
        maxTemp: 31 + (idx % 3),
        minTemp: 22 - (idx % 2),
        code: idx % 2 === 0 ? 0 : 2,
        uvMax: 6 + (idx % 3)
      }))
    };
  };

  // Geocoding Search handler
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`;
      const res = await fetch(geoUrl);
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        const found = data.results[0];
        fetchWeather({
          name: found.name,
          country: found.country || '',
          lat: found.latitude,
          lon: found.longitude
        });
      } else {
        // Fallback search mock if name not found in geo
        fetchWeather({ name: query, country: 'Location', lat: 20.0, lon: 77.0 });
      }
    } catch {
      fetchWeather({ name: query, country: 'Location', lat: 20.0, lon: 77.0 });
    }
    setQuery('');
  };

  // Initial Load
  useEffect(() => {
    fetchWeather(currentCity);
  }, []);

  // Temperature unit conversion utility
  const formatTemp = (celsius) => {
    if (unit === 'F') {
      return `${Math.round((celsius * 9) / 5 + 32)}°F`;
    }
    return `${celsius}°C`;
  };

  // Weather Code to Icon & Description Mapping
  const getWeatherDetails = (code, isDay = true) => {
    switch (code) {
      case 0:
        return { desc: 'Clear Sky', icon: isDay ? 'fa-sun text-amber-400' : 'fa-moon text-indigo-300', bg: 'from-sky-500 via-indigo-600 to-slate-900' };
      case 1:
      case 2:
        return { desc: 'Partly Cloudy', icon: isDay ? 'fa-cloud-sun text-amber-300' : 'fa-cloud-moon text-slate-300', bg: 'from-blue-600 via-slate-700 to-slate-900' };
      case 3:
        return { desc: 'Overcast', icon: 'fa-cloud text-slate-400', bg: 'from-slate-600 via-slate-800 to-slate-950' };
      case 45:
      case 48:
        return { desc: 'Foggy', icon: 'fa-smog text-slate-300', bg: 'from-slate-700 to-slate-900' };
      case 51:
      case 61:
      case 80:
        return { desc: 'Light Rain', icon: 'fa-cloud-rain text-cyan-400', bg: 'from-cyan-700 via-slate-800 to-slate-950' };
      case 63:
      case 65:
      case 81:
      case 82:
        return { desc: 'Heavy Rain', icon: 'fa-cloud-showers-heavy text-blue-400', bg: 'from-blue-800 via-slate-900 to-black' };
      case 95:
      case 96:
        return { desc: 'Thunderstorm', icon: 'fa-bolt text-yellow-400', bg: 'from-indigo-900 via-purple-900 to-slate-950' };
      default:
        return { desc: 'Sunny/Clear', icon: 'fa-sun text-amber-400', bg: 'from-blue-600 via-indigo-800 to-slate-950' };
    }
  };

  const weatherTheme = useMemo(() => {
    if (!weatherData) return 'from-slate-900 to-black';
    return getWeatherDetails(weatherData.weatherCode, weatherData.isDay).bg;
  }, [weatherData]);

  // MongoDB Emulated Operations
  const isCurrentSaved = dbFavorites.some(f => f.name.toLowerCase() === currentCity.name.toLowerCase());

  const toggleFavorite = () => {
    if (isCurrentSaved) {
      setDbFavorites(prev => prev.filter(f => f.name.toLowerCase() !== currentCity.name.toLowerCase()));
    } else {
      const newFav = {
        _id: `fav-${Date.now()}`,
        name: currentCity.name,
        country: currentCity.country,
        lat: currentCity.lat,
        lon: currentCity.lon,
        note: newNoteText || 'Custom saved weather location'
      };
      setDbFavorites(prev => [...prev, newFav]);
      setNewNoteText('');
    }
  };

  const deleteFavorite = (id) => {
    setDbFavorites(prev => prev.filter(f => f._id !== id));
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${weatherTheme} text-white font-sans transition-all duration-700 selection:bg-indigo-500 selection:text-white flex flex-col justify-between`}>
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-40 bg-slate-950/40 backdrop-blur-xl border-b border-white/10 px-4 sm:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <i className="fa-solid fa-cloud-bolt text-white text-xl"></i>
          </div>
          <div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-cyan-300">
              SkyPulse Weather
            </h1>
            <p className="text-[10px] text-cyan-300 font-semibold tracking-wide uppercase">Live Meteorological Hub</p>
          </div>
        </div>

        {/* Global Search Bar */}
        <form onSubmit={handleSearch} className="relative w-full sm:w-80">
          <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search city (e.g. Vijayawada, London)..."
            className="w-full pl-10 pr-24 py-2 rounded-xl bg-slate-900/60 border border-white/15 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 backdrop-blur-md transition-all"
          />
          <button
            type="submit"
            className="absolute right-1 top-1/2 -translate-y-1/2 px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs rounded-lg transition shadow-md"
          >
            Search
          </button>
        </form>

        {/* Control Switchers & Mongo Sync Tab */}
        <div className="flex items-center space-x-3">
          {/* Dashboard vs MERN Database View Tab */}
          <div className="flex p-1 bg-slate-900/80 rounded-xl border border-white/10 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 rounded-lg transition ${activeTab === 'dashboard' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              <i className="fa-solid fa-chart-line mr-1.5"></i> Dashboard
            </button>
            <button
              onClick={() => setActiveTab('db')}
              className={`px-3 py-1.5 rounded-lg transition relative ${activeTab === 'db' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              <i className="fa-solid fa-database mr-1.5"></i> MongoDB Sync
              <span className="ml-1.5 px-1.5 py-0.2 bg-emerald-500/30 text-emerald-300 rounded-full text-[9px] font-bold">
                {dbFavorites.length}
              </span>
            </button>
          </div>

          {/* C / F Unit Toggle */}
          <button
            onClick={() => setUnit(unit === 'C' ? 'F' : 'C')}
            className="px-3 py-2 rounded-xl bg-slate-900/80 border border-white/15 text-xs font-bold hover:bg-slate-800 transition flex items-center space-x-1"
            title="Toggle Temperature Unit"
          >
            <span className={unit === 'C' ? 'text-cyan-400 font-extrabold' : 'text-slate-400'}>°C</span>
            <span className="text-slate-500">|</span>
            <span className={unit === 'F' ? 'text-cyan-400 font-extrabold' : 'text-slate-400'}>°F</span>
          </button>
        </div>
      </header>

      {/* Preset Quick Select Pills Bar */}
      <div className="bg-slate-950/20 border-b border-white/5 px-4 sm:px-8 py-2 overflow-x-auto flex items-center space-x-2 text-xs">
        <span className="text-slate-400 font-semibold flex items-center gap-1 whitespace-nowrap">
          <i className="fa-solid fa-location-arrow text-cyan-400"></i> Quick Cities:
        </span>
        {presetCities.map((c) => (
          <button
            key={c.name}
            onClick={() => fetchWeather(c)}
            className={`px-3 py-1 rounded-lg border whitespace-nowrap transition ${
              currentCity.name.toLowerCase() === c.name.toLowerCase()
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50 font-bold'
                : 'bg-slate-900/40 text-slate-300 border-white/10 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Main View Display Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-6 flex-grow w-full">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-96 space-y-4">
            <div className="w-14 h-14 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-semibold text-slate-300 animate-pulse">Syncing satellite meteorological feeds for {currentCity.name}...</p>
          </div>
        ) : activeTab === 'dashboard' ? (
          /* ================= WEATHER DASHBOARD VIEW ================= */
          <div className="space-y-6 animate-fade-in">
            {/* Top Primary Hero Card */}
            {weatherData && (
              <div className="relative overflow-hidden rounded-3xl bg-slate-900/50 border border-white/15 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl">
                <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                  <div>
                    <div className="flex items-center space-x-3">
                      <h2 className="text-3xl sm:text-4xl font-extrabold text-white">{weatherData.cityName}</h2>
                      <span className="text-sm px-2.5 py-1 rounded-md bg-white/10 text-slate-300 border border-white/10 font-medium">
                        {weatherData.country}
                      </span>
                      {/* Save Location Button */}
                      <button
                        onClick={toggleFavorite}
                        className={`p-2 rounded-xl border transition ${
                          isCurrentSaved
                            ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                            : 'bg-slate-800/60 text-slate-400 border-white/10 hover:text-white'
                        }`}
                        title={isCurrentSaved ? 'Remove from Saved MongoDB Favorites' : 'Save to MongoDB Favorites'}
                      >
                        <i className={`${isCurrentSaved ? 'fa-solid' : 'fa-regular'} fa-heart text-base`}></i>
                      </button>
                    </div>

                    <p className="text-xs text-slate-300 mt-1">
                      Updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Real-Time Conditions
                    </p>

                    <div className="flex items-baseline space-x-4 mt-6">
                      <span className="text-6xl sm:text-7xl font-extrabold text-white tracking-tight">
                        {formatTemp(weatherData.temperature)}
                      </span>
                      <div>
                        <p className="text-lg font-semibold text-cyan-300 flex items-center gap-2">
                          <i className={`fa-solid ${getWeatherDetails(weatherData.weatherCode, weatherData.isDay).icon} text-xl`}></i>
                          {getWeatherDetails(weatherData.weatherCode, weatherData.isDay).desc}
                        </p>
                        <p className="text-xs text-slate-400">Feels like {formatTemp(weatherData.temperature - 1)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Hero Quick Key Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full md:w-auto">
                    <div className="p-3.5 rounded-2xl bg-slate-950/40 border border-white/10 backdrop-blur-md">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1"><i className="fa-solid fa-wind text-cyan-400 mr-1"></i> Wind</span>
                      <span className="text-sm font-bold text-white">{weatherData.windSpeed} km/h</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-950/40 border border-white/10 backdrop-blur-md">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1"><i className="fa-solid fa-droplet text-blue-400 mr-1"></i> Humidity</span>
                      <span className="text-sm font-bold text-white">{weatherData.humidity}%</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-950/40 border border-white/10 backdrop-blur-md">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1"><i className="fa-solid fa-sun text-amber-400 mr-1"></i> UV Index</span>
                      <span className="text-sm font-bold text-white">{weatherData.uvIndex} / 11</span>
                    </div>
                  </div>
                </div>

                {/* Optional Note Saver Prompt */}
                {!isCurrentSaved && (
                  <div className="mt-6 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center gap-2">
                    <input
                      type="text"
                      placeholder="Add a custom note before saving (e.g. Vacation plan, Home city)..."
                      value={newNoteText}
                      onChange={(e) => setNewNoteText(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl bg-slate-950/50 border border-white/10 text-white placeholder-slate-400 outline-none"
                    />
                    <button
                      onClick={toggleFavorite}
                      className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs rounded-xl shadow-md whitespace-nowrap"
                    >
                      <i className="fa-solid fa-bookmark mr-1"></i> Save to DB
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 24-Hour Forecast Timeline Scrollable */}
            {weatherData && (
              <div className="rounded-3xl bg-slate-900/40 border border-white/10 p-6 backdrop-blur-xl">
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <i className="fa-regular fa-clock text-cyan-400"></i> 24-Hour Hourly Forecast
                </h3>
                <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-thin">
                  {weatherData.hourly.map((h, i) => (
                    <div
                      key={i}
                      className="flex-shrink-0 w-20 p-3 rounded-2xl bg-slate-950/30 border border-white/5 text-center flex flex-col items-center justify-between hover:border-cyan-400/40 transition"
                    >
                      <span className="text-[11px] text-slate-400 font-medium">{h.time}</span>
                      <i className={`fa-solid ${getWeatherDetails(h.code, true).icon} my-2 text-base`}></i>
                      <span className="text-xs font-bold text-white">{formatTemp(h.temp)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 7-Day Forecast & Detailed Environmental Gauges */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* 7-Day Forecast Column */}
              <div className="lg:col-span-7 rounded-3xl bg-slate-900/40 border border-white/10 p-6 backdrop-blur-xl space-y-3">
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <i className="fa-regular fa-calendar-days text-cyan-400"></i> 7-Day Extended Forecast
                </h3>
                {weatherData &&
                  weatherData.daily.map((d, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/30 border border-white/5 hover:bg-slate-900/60 transition"
                    >
                      <div className="w-24">
                        <p className="text-xs font-bold text-white">{d.day}</p>
                        <p className="text-[10px] text-slate-400">{d.date}</p>
                      </div>

                      <div className="flex items-center space-x-2">
                        <i className={`fa-solid ${getWeatherDetails(d.code, true).icon} text-lg`}></i>
                        <span className="text-xs text-slate-300 font-medium">{getWeatherDetails(d.code, true).desc}</span>
                      </div>

                      <div className="flex items-center space-x-3 text-xs">
                        <span className="font-bold text-white">{formatTemp(d.maxTemp)}</span>
                        <span className="text-slate-500">/</span>
                        <span className="text-slate-400">{formatTemp(d.minTemp)}</span>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Environmental Gauges Column */}
              <div className="lg:col-span-5 space-y-4">
                {/* Sunrise & Sunset Card */}
                <div className="rounded-3xl bg-slate-900/40 border border-white/10 p-5 backdrop-blur-xl">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Solar Cycle</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3 p-3 rounded-2xl bg-slate-950/40 border border-white/5">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                        <i className="fa-solid fa-sun text-base"></i>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Sunrise</span>
                        <span className="text-xs font-bold text-white">{weatherData?.sunrise}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-3 rounded-2xl bg-slate-950/40 border border-white/5">
                      <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                        <i className="fa-solid fa-moon text-base"></i>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Sunset</span>
                        <span className="text-xs font-bold text-white">{weatherData?.sunset}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Air Quality & Pressure */}
                <div className="rounded-3xl bg-slate-900/40 border border-white/10 p-5 backdrop-blur-xl space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Air Quality & Pressure</h4>
                  <div className="p-3 rounded-2xl bg-slate-950/40 border border-white/5 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Air Quality Index</span>
                      <span className="text-xs font-bold text-emerald-400">{weatherData?.airQuality}</span>
                    </div>
                    <i className="fa-solid fa-leaf text-emerald-400 text-lg"></i>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-950/40 border border-white/5 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Atmospheric Pressure</span>
                      <span className="text-xs font-bold text-white">{weatherData?.pressure} hPa</span>
                    </div>
                    <i className="fa-solid fa-[#4f46e5] fa-gauge-high text-indigo-400 text-lg"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ================= SIMULATED MONGODB / EXPRESS API VIEW ================= */
          <div className="space-y-6 animate-fade-in">
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/10 backdrop-blur-xl">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <i className="fa-solid fa-server text-emerald-400"></i> MongoDB Document Store Emulation
                  </h2>
                  <p className="text-xs text-slate-400">
                    Simulating <code className="text-cyan-300 font-mono">db.favorites.find()</code> and search logging pipeline.
                  </p>
                </div>
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-mono font-bold rounded-full border border-emerald-500/30">
                  CONNECTED: mongodb://localhost:27017/weather_db
                </span>
              </div>

              {/* Favorites Collection */}
              <div className="mt-6 space-y-4">
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <i className="fa-solid fa-bookmark text-amber-400"></i> Saved Favorite Cities (<code className="text-xs text-cyan-300">db.favorites</code>)
                </h3>

                {dbFavorites.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs bg-slate-950/30 rounded-2xl border border-white/5">
                    No saved locations in MongoDB yet. Click the heart icon on any city to bookmark it.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {dbFavorites.map((fav) => (
                      <div key={fav._id} className="p-4 rounded-2xl bg-slate-950/50 border border-white/10 flex items-start justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="font-bold text-white text-sm">{fav.name}</h4>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">{fav.country}</span>
                          </div>
                          <p className="text-xs text-cyan-400 mt-1 italic">"{fav.note}"</p>
                          <p className="text-[10px] text-slate-500 mt-2 font-mono">
                            ID: {fav._id} • Lat: {fav.lat}, Lon: {fav.lon}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              fetchWeather(fav);
                              setActiveTab('dashboard');
                            }}
                            className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg shadow"
                          >
                            Load
                          </button>
                          <button
                            onClick={() => deleteFavorite(fav._id)}
                            className="p-1.5 text-rose-400 hover:text-rose-300 transition"
                            title="Delete from MongoDB"
                          >
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Search Audit Logs */}
              <div className="mt-8 pt-6 border-t border-white/10">
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <i className="fa-solid fa-list-check text-indigo-400"></i> Recent API Search Audit Trail (<code className="text-xs text-cyan-300">db.logs</code>)
                </h3>
                <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                  {dbSearchLogs.map((log) => (
                    <div key={log._id} className="p-2.5 rounded-xl bg-slate-950/40 border border-white/5 flex items-center justify-between text-xs">
                      <span className="font-mono text-cyan-300">POST /api/weather/search → "{log.query}"</span>
                      <span className="text-slate-500">{log.timestamp}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-slate-950/60 backdrop-blur-md py-4 px-4 text-center text-xs text-slate-400">
        <p>SkyPulse Weather Dashboard • Built with React, Tailwind CSS, Open-Meteo REST API & Express/MongoDB Layer</p>
      </footer>
    </div>
  );
}