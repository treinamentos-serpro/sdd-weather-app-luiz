interface WeatherCondition {
  label: string;
  icon: string;
}

const weatherCodes: Readonly<Record<number, WeatherCondition>> = {
  0: { label: 'Céu limpo', icon: '☀️' },
  1: { label: 'Predominantemente limpo', icon: '🌤️' },
  2: { label: 'Parcialmente nublado', icon: '⛅' },
  3: { label: 'Encoberto', icon: '☁️' },
  45: { label: 'Nevoeiro', icon: '🌫️' },
  48: { label: 'Nevoeiro com deposição de geada', icon: '🌫️' },
  51: { label: 'Chuvisco leve', icon: '🌦️' },
  53: { label: 'Chuvisco moderado', icon: '🌦️' },
  55: { label: 'Chuvisco intenso', icon: '🌦️' },
  56: { label: 'Chuvisco congelante leve', icon: '🌧️' },
  57: { label: 'Chuvisco congelante intenso', icon: '🌧️' },
  61: { label: 'Chuva fraca', icon: '🌧️' },
  63: { label: 'Chuva moderada', icon: '🌧️' },
  65: { label: 'Chuva forte', icon: '🌧️' },
  66: { label: 'Chuva congelante fraca', icon: '🌧️' },
  67: { label: 'Chuva congelante forte', icon: '🌧️' },
  71: { label: 'Neve fraca', icon: '🌨️' },
  73: { label: 'Neve moderada', icon: '🌨️' },
  75: { label: 'Neve forte', icon: '🌨️' },
  77: { label: 'Grãos de neve', icon: '🌨️' },
  80: { label: 'Pancadas de chuva leves', icon: '🌦️' },
  81: { label: 'Pancadas de chuva moderadas', icon: '🌦️' },
  82: { label: 'Pancadas de chuva violentas', icon: '🌧️' },
  85: { label: 'Pancadas de neve leves', icon: '🌨️' },
  86: { label: 'Pancadas de neve fortes', icon: '🌨️' },
  95: { label: 'Trovoada fraca ou moderada', icon: '⛈️' },
  96: { label: 'Trovoada com granizo leve', icon: '⛈️' },
  99: { label: 'Trovoada com granizo forte', icon: '⛈️' },
};

export function getWeatherCondition(code: number | null | undefined): WeatherCondition | null {
  if (code == null || !Object.hasOwn(weatherCodes, code)) return null;
  return weatherCodes[code];
}
