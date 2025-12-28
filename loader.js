(function () {
  'use strict'; 

  const SOURCES = [
    // 🔹 БАЗОВЫЙ ONLINE MOD
    {
      name: 'Online Mod',
      url: 'https://nb557.github.io/plugins/online_mod.js'
    },

    // 🔹 BYLAMPA
    {
      name: 'Free Online',
      url: 'https://bylampa.github.io/free_onl.js'
    },
    {
      name: 'Cinema',
      url: 'https://bylampa.github.io/cinema.js'
    },
    {
      name: 'Filmix',
      url: 'https://bylampa.github.io/fx.js'
    },

    // 🔹 СТОРОННИЕ / НЕСТАБИЛЬНЫЕ
    {
      name: 'Showwwy',
      url: 'http://showwwy.com/m.js'
    },
    {
      name: 'SmotretK',
      url: 'http://smotretk.com/online.js'
    },
    {
      name: 'Smotret24.com',
      url: 'http://smotret24.com/online.js'
    },
    {
      name: 'Smotret24.ru',
      url: 'http://smotret24.ru/online.js'
    }
  ];

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        return resolve();
      }

      const s = document.createElement('script');
      s.src = src;
      s.async = false;
      s.onload = () => {
        console.log('[ONLINE PACK] loaded:', src);
        resolve();
      };
      s.onerror = () => {
        console.warn('[ONLINE PACK] failed:', src);
        reject();
      };

      document.head.appendChild(s);
    });
  }

  async function boot() {
    console.log('[ONLINE PACK] start');

    for (const s of SOURCES) {
      try {
        await loadScript(s.url);
      } catch (e) {
        // просто пропускаем упавший источник
      }
    }

    console.log('[ONLINE PACK] done');
  }

  // ждём, пока Lampa полностью стартует
  Lampa.Listener.follow('app', function (e) {
    if (e.type === 'ready') {
      boot();
    }
  });
})();
