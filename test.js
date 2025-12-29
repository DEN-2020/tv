(function () {
    'use strict';

    // 1. ПРОВЕРКА: Если плагин уже есть в системе, выходим немедленно
    if (window.hack_tv_loaded) return;

    var plugin = {
        component: 'my_iptv2',
        name: 'Hack TV',
        icon: '<svg height="24" viewBox="0 0 24 24" fill="currentColor"><rect width="24" height="24" rx="5" fill="red"/></svg>'
    };

    function startPlugin() {
        // Ставим метку, что мы загрузились
        window.hack_tv_loaded = true;

        // Регистрируем компонент страницы
        Lampa.Component.add(plugin.component, function() {
            this.create = function() { return $('<div class="category-full"><h1 style="padding:50px">Hack TV Page</h1></div>'); };
            this.render = function() { return this.create(); };
            this.start = function() { 
                Lampa.Controller.add('content', {
                    toggle: function() { Lampa.Controller.follow('content'); },
                    left: function() { Lampa.Controller.toggle('menu'); },
                    back: Lampa.Activity.backward
                });
                Lampa.Controller.toggle('content');
            };
            this.pause = this.stop = this.destroy = function(){};
        });

        // --- ЛЕВОЕ МЕНЮ (БЕЗОПАСНО) ---
        // Ждем, пока меню отрисуется, и вставляем только если нашего ID там нет
        var menu_item = $('<li class="menu__item selector" data-action="my_iptv2"><div class="menu__text">Hack TV</div></li>');
        menu_item.on('hover:enter', function() {
            Lampa.Activity.push({ title: 'Hack TV', component: 'my_iptv2' });
        });

        if ($('.menu__list').length && !$('.menu__item[data-action="my_iptv2"]').length) {
            $('.menu__list').append(menu_item);
        }

        // --- НАСТРОЙКИ СПРАВА (СИСТЕМНЫЙ МЕТОД) ---
        Lampa.Settings.listener.follow('open', function (e) {
            if (e.name === 'main') {
                setTimeout(function() {
                    if ($('.settings-folder[data-name="hack_tv"]').length) return;
                    
                    var item = $('<div class="settings-folder selector" data-name="hack_tv"><div class="settings-folder__title">Hack TV Settings</div></div>');
                    item.on('hover:enter', function() {
                        Lampa.Noty.show('Настройки открыты');
                    });
                    $('.settings__content').append(item);
                    // Важный фикс для ПК/ТВ: обновляем навигацию
                    Lampa.Controller.update();
                }, 200);
            }
        });
    }

    // Запуск
    if (window.appready) startPlugin();
    else Lampa.Listener.follow('app', function(e) { if(e.type === 'ready') startPlugin(); });

})();
