const apiKey = '29079fdfe875ca74aa664087d3789c60'; // 替换为您的 OpenWeatherMap API 密钥

async function getWeather() {
    const cityInput = document.getElementById('cityInput');
    const weatherInfo = document.getElementById('weatherInfo');
    const city = cityInput.value;

    if (!city) {
        weatherInfo.innerHTML = '请输入城市名';
        return;
    }

    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=zh_cn`);
        const data = await response.json();

        if (response.ok) {
            const weather = data.weather[0].description;
            const temp = data.main.temp;
            const humidity = data.main.humidity;
            
            weatherInfo.innerHTML = `
                <h2>${city}的天气</h2>
                <p>天气: ${weather}</p>
                <p>温度: ${temp}°C</p>
                <p>湿度: ${humidity}%</p>
            `;
        } else {
            weatherInfo.innerHTML = `无法获取天气信息: ${data.message}`;
        }
    } catch (error) {
        weatherInfo.innerHTML = '发生错误，请稍后再试';
        console.error('Error:', error);
    }
}