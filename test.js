(function () {
    'use strict';

    var plugin = {
        component: 'test_debug',
        name: 'Debug Tool'
    };

    // Окно для вывода логов прямо на ТВ
    var debugLog = $('<div id="debug-box" style="position: absolute; bottom: 10%; right: 5%; width: 300px; height: 200px; background: rgba(0,0,0,0.8); color: lime; font-size: 12px; overflow: hidden; z-index: 9999; border: 1px solid #fff; pointer-events: none; padding: 5px;">DEBUG LOG:<br></div>');

    function log(msg) {
        debugLog.append('<div>> ' + msg + '</div>');
        if (debugLog.children().length > 10) debugLog.children().eq(1).remove();
        console.log('Plugin Log:', msg);
    }

    function startPlugin() {
        if (window.test_debug_ready) return;
        window.test_debug_ready = true;

        $('body').append(debugLog);
        log('Plugin Started');

        // --- ИССЛЕДУЕМ МЕНЮ ---
        // Смотрим, какие списки вообще есть в приложении
        var availableMenus = [];
        $('.menu__list, .menu ul, .navigation').each(function() {
            var className = $(this).attr('class') || 'no class';
            availableMenus.push(className);
        });
        log('Found menus: ' + availableMenus.join(' | '));

        // Безопасное добавление в меню (проверка на дубликаты)
        if ($('.menu__item[data-action="' + plugin.component + '"]').length === 0) {
            var menu_item = $('<li class="menu__item selector" data-action="' + plugin.component + '">' +
                '<div class="menu__text">' + plugin.name + '</div>' +
            '</li>');

            menu_item.on('hover:enter', function () {
                Lampa.Noty.show('Debug component active');
            });

            // Пытаемся добавить в основной список
            $('.menu .menu__list').append(menu_item);
            log('Added to .menu__list');
        } else {
            log('Item already exists, skipping duplication');
        }

        // --- СЛУШАЕМ КНОПКИ ---
        Lampa.Key.listener.follow('keydown', function(e) {
            log('Key pressed: ' + e.code);
        });
    }

    // Регистрация компонента (пустая страница для теста)
    Lampa.Component.add(plugin.component, function() {
        this.create = function() { return $('<div></div>'); };
        this.render = function() { return $('<div></div>'); };
        this.start = function() { Lampa.Controller.toggle('menu'); };
        this.pause = this.stop = this.destroy = function() {};
    });

    if (window.appready) startPlugin();
    else Lampa.Listener.follow('app', function (e) { if (e.type == 'ready') startPlugin(); });
})();
