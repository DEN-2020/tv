;(function () {
    'use strict';

    // 1. ЖЕСТКАЯ ПРОВЕРКА НА ДУБЛИКАТЫ (чтобы не было 3-х пунктов)
    if (window.hack_tv_plugin_installed) return;
    window.hack_tv_plugin_installed = true;

    var plugin = {
        component: 'my_iptv2',
        name: 'Hack TV',
        icon: '<svg height="24" viewBox="0 0 260 244" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M259.5 47.5v114c-1.709 14.556-9.375 24.723-23 30.5a2934.377 2934.377 0 0 1-107 1.5c-35.704.15-71.37-.35-107-1.5-13.625-5.777-21.291-15.944-23-30.5v-115c1.943-15.785 10.61-25.951 26-30.5a10815.71 10815.71 0 0 1 208 0c15.857 4.68 24.523 15.18 26 31.5zm-230-13a4963.403 4963.403 0 0 0 199 0c5.628 1.128 9.128 4.462 10.5 10 .667 40 .667 80 0 120-1.285 5.618-4.785 8.785-10.5 9.5-66 .667-132 .667-198 0-5.715-.715-9.215-3.882-10.5-9.5-.667-40-.667-80 0-120 1.35-5.18 4.517-8.514 9.5-10z"/><path d="M70.5 71.5c17.07-.457 34.07.043 51 1.5 5.44 5.442 5.107 10.442-1 15-5.991.5-11.991.666-18 .5.167 14.337 0 28.671-.5 43-3.013 5.035-7.18 6.202-12.5 3.5a11.529 11.529 0 0 1-3.5-4.5 882.407 882.407 0 0 1-.5-42c-5.676.166-11.343 0-17-.5-4.569-2.541-6.069-6.375-4.5-11.5 1.805-2.326 3.972-3.992 6.5-5zM137.5 73.5c4.409-.882 7.909.452 10.5 4a321.009 321.009 0 0 0 16 30 322.123 322.123 0 0 0 16-30c2.602-3.712 6.102-4.879 10.5-3.5 5.148 3.334 6.314 7.834 3.5 13.5a1306.032 1306.032 0 0 0-22 43c-5.381 6.652-10.715 6.652-16 0a1424.647 1424.647 0 0 0-23-45c-1.691-5.369-.191-9.369 4.5-12zM57.5 207.5h144c7.788 2.242 10.288 7.242 7.5 15a11.532 11.532 0 0 1-4.5 3.5c-50 .667-100 .667-150 0-6.163-3.463-7.496-8.297-4-14.5 2.025-2.064 4.358-3.398 7-4z"/></svg>'
    };

    // --- ЛОГИКА СТРАНИЦЫ ---
    function pluginPage(object) {
        var html = $('<div></div>');
        var scroll = new Lampa.Scroll({mask: true, over: true});
        var body = $('<div class="category-full"></div>');

        this.create = function () {
            var info = $('<div class="selector" style="padding: 1.5em; background: rgba(255,255,255,0.05); margin: 10px; border-radius: 0.5em;">' +
                '<h2>' + plugin.name + '</h2>' +
                '<p>Если видишь этот текст, значит плагин работает.</p>' +
                '</div>');
            body.append(info);
            scroll.append(body);
            html.append(scroll.render());
            return this.render();
        };

        this.render = function () { return html; };
        
        this.start = function () {
            Lampa.Controller.add('content', {
                toggle: function () {
                    Lampa.Controller.collectionSet(html);
                    Lampa.Controller.follow('content');
                },
                left: function () { Lampa.Controller.toggle('menu'); },
                up: function () { Lampa.Controller.toggle('head'); },
                back: Lampa.Activity.backward
            });
            Lampa.Controller.toggle('content');
        };

        this.pause = this.stop = function () {};
        this.destroy = function () { scroll.destroy(); html.remove(); };
    }

    // --- НАСТРОЙКИ (СПРАВА) ---
    function addSettings() {
        if ($('.settings-folder[data-name="hack_tv_settings"]').length) return;

        var item = $('<div class="settings-folder selector" data-name="hack_tv_settings" data-children="true">' +
            '<div class="settings-folder__icon">' + plugin.icon + '</div>' +
            '<div class="settings-folder__title">Hack TV</div>' +
            '<div class="settings-folder__descr">Настройка прокси</div>' +
        '</div>');

        item.on('hover:enter', function () {
            Lampa.Select.show({
                title: 'Hack TV',
                items: [
                    { title: 'Проксирование', name: 'hack_tv_proxy_enabled', type: 'select', values: {'false': 'Выкл', 'true': 'Вкл'}, default: 'false' },
                    { title: 'Адрес прокси', name: 'hack_tv_proxy_address', type: 'input', default: 'http://192.168.1.50:7777' }
                ],
                onSelect: function (a) { Lampa.Storage.set(a.name, a.value); Lampa.Noty.show('Сохранено'); },
                onBack: function () { Lampa.Controller.toggle('settings_main'); }
            });
        });
        $('.settings__content').append(item);
    }

    // --- КНОПКИ (ИСПРАВЛЕНО, ЧТОБЫ НЕ ПЕРЕБИВАЛИ) ---
    function handleKeyDown(e) {
        var active = Lampa.Activity.active();
        // ПРОВЕРКА: Если мы не в нашем плагине - ВООБЩЕ ничего не делаем
        if (!active || active.component !== plugin.component) return;

        // Только если наш плагин активен, обрабатываем цифры
        if (e.code >= 48 && e.code <= 57) {
            Lampa.Noty.show('Канал: ' + (e.code - 48));
            e.preventDefault(); // Запрещаем Лампе реагировать на цифры
        }
    }

    // --- ЗАПУСК ---
    function startPlugin() {
        Lampa.Component.add(plugin.component, pluginPage);

        // Добавление в меню с проверкой существования
        var menu_item = $('<li class="menu__item selector" data-action="' + plugin.component + '">' +
            '<div class="menu__ico">' + plugin.icon + '</div>' +
            '<div class="menu__text">' + plugin.name + '</div>' +
        '</li>');

        menu_item.on('hover:enter', function () {
            Lampa.Activity.push({ title: plugin.name, component: plugin.component });
        });

        // Если в меню еще нет нашего пункта - добавляем
        if (!$('.menu .menu__list .menu__item[data-action="' + plugin.component + '"]').length) {
            $('.menu .menu__list').append(menu_item);
        }

        // Настройки
        Lampa.Settings.listener.follow('open', function (e) {
            if (e.name === 'main') setTimeout(addSettings, 100);
        });

        // Слушатель кнопок
        Lampa.Key.listener.follow('keydown', handleKeyDown);
    }

    if (window.appready) startPlugin();
    else Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') startPlugin(); });

})();
