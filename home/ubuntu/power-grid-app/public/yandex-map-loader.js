// public/yandex-map-loader.js

function loadYandexMaps(apiKey) {
  return new Promise((resolve, reject) => {
    if (typeof window.ymaps !== 'undefined') {
      return resolve(window.ymaps);
    }

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${apiKey}&lang=ru_RU`;
    script.onload = () => {
      ymaps.ready(() => resolve(ymaps));
    };
    script.onerror = (error) => reject(error);
    document.head.appendChild(script);
  });
}

// Сделаем функцию доступной глобально, чтобы ее можно было вызвать из React
window.loadYandexMaps = loadYandexMaps;

