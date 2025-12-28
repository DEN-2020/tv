(function () {
  'use strict';

  // ================================
  // 🔒 ЗАЩИТА ОТ ПОВТОРНОЙ ЗАГРУЗКИ
  // ================================
  if (window.__ONLINE_PACK_LOADED__) return;
  window.__ONLINE_PACK_LOADED__ = true;

  const LOG = '[ONLINE PACK]';

  // ================================
  // 📦 ИСТОЧНИКИ
  // ================================
  const CORE = [
    {
      name: 'Online Mod',
      url: 'https://nb557.github.io/plugins/online_mod.js'
    },
    {
      name: 'Free Online',
      url: 'https://bylampa.github.io/free_onl.js'
    }
  ];

  const OPTIONAL = [
    {
      name: 'Cinema',
      url: 'https://bylampa.github.io/cinema.js'
    },
    {
      name: 'Filmix',
      url: 'https://bylampa.github.io/fx.js'
    }
  ];

  const UNSAFE = [
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

  // ================================
  // 🔍 ПРОВЕРКИ
  // ================================
  function isMixedContent(url) {
    return location.protocol === 'https:' && url.startsWith('http://');
  }

  function alreadyLoaded(url) {
    return !!document.querySelector(`script[src="${url}"]`);
  }

  // ================================
  // 📥 ЗАГРУЗКА СКРИПТА
  // ================================
  function loadScript(source) {
    return new Promise((resolve) => {
      if (alreadyLoaded(source.url)) {
        console.log(`${LOG} already loaded: ${source.name}`);
        return resolve();
      }

      if (isMixedContent(source.url)) {
        console.warn(`${LOG} skipped (mixed content): ${source.name}`);
        return resolve();
      }

      const s = document.createElement('script');
      s.src = source.url;
      s.async = false;

      s.onload = () => {
        console.log(`${LOG} loaded: ${source.name}`);
        resolve();
      };

      s.onerror = () => {
        console.warn(`${LOG} failed: ${source.name}`);
        resolve(); // ❗ не ломаем цепочку
      };

      document.head.appendChild(s);
    });
  }

  // ================================
  // 🚀 BOOT
  // ================================
  async function boot() {
    console.log(`${LOG} start`);

    for (const src of CORE) {
      await loadScript(src);
    }

    for (const src of OPTIONAL) {
      await loadScript(src);
    }

    for (const src of UNSAFE) {
      await loadScript(src);
    }

    console.log(`${LOG} done`);
  }

  // ================================
  // ⏳ ЖДЁМ ГОТОВНОСТИ LAMPA
  // ================================
  if (window.Lampa && Lampa.Listener) {
    Lampa.Listener.follow('app', function (e) {
      if (e.type === 'ready') {
        boot();
      }
    });
  } else {
    console.warn(`${LOG} Lampa not detected`);
  }

})();
