(function () {
  'use strict';

  const SOURCES = [
    {
      name: 'Online Mod',
      url: 'https://nb557.github.io/plugins/online_mod.js'
    },
    {
      name: 'Filmix',
      url: 'https://bylampa.github.io/fx.js'
    }
  ];

  function load(src) {
    return new Promise((ok, bad) => {
      if (document.querySelector(`script[src="${src}"]`)) return ok();
      const s = document.createElement('script');
      s.src = src;
      s.async = false;
      s.onload = ok;
      s.onerror = bad;
      document.head.appendChild(s);
    });
  }

  async function boot() {
    for (const s of SOURCES) {
      try {
        await load(s.url);
      } catch (e) {
        console.log('[ONLINE PACK] skip', s.name);
      }
    }
  }

  Lampa.Listener.follow('app', function (e) {
    if (e.type === 'ready') boot();
  });
})();
