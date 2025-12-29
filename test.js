(function () {
    'use strict';

    var plugin = {
        component: 'test_plugin',
        name: 'Test Skeleton',
        icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="24" rx="12" fill="white"/></svg>'
    };

    // --- ЛОГИКА СТРАНИЦЫ ---
    function pluginPage(object) {
        var html = $('<div></div>');
        var scroll = new Lampa.Scroll({mask: true, over: true});
        var body = $('<div class="category-full" style="padding: 20px;"></div>');

        this.create = function () {
            var _this = this;
            body.append('<div class="selector" style="padding: 20px; background: rgba(255,255,255,0.1); border-radius: 10px;">Нажми на пульте цифры или влево/вправо</div>');
            
            // Добавим тестовый список
            for(var i = 1; i <= 5; i++) {
                var item = $('<div class="selector" style="padding: 10px; margin-top: 10px; border: 1px solid #fff;">Тестовый канал ' + i + '</div>');
                body.append(item);
            }

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

        this.pause = function () {};
        this.stop = function () {};
        this.destroy = function () { scroll.destroy(); html.remove(); };
    }

    // --- ОБРАБОТЧИК КНОПОК (ПОЧЕМУ ИХ НЕТ) ---
    function handleKeyDown(e) {
        if (Lampa.Activity.active().component === plugin.component) {
            console.log('Нажата кнопка:', e.code);
            // Вывод уведомления прямо в Лампе при нажатии любой кнопки
            Lampa.Noty.show('Нажат код: ' + e.code);
            
            if (e.code >= 48 && e.code <= 57) {
                Lampa.Noty.show('Вы нажали цифру: ' + (e.code - 48));
            }
        }
    }

    // --- ЗАПУСК ---
    function startPlugin() {
        if (window.test_plugin_ready) return;
        window.test_plugin_ready = true;

        // 1. Регистрация компонента
        Lampa.Component.add(plugin.component, pluginPage);

        // 2. Добавление в меню
        var menu_item = $('<li class="menu__item selector" data-action="' + plugin.component + '">' +
            '<div class="menu__ico">' + plugin.icon + '</div>' +
            '<div class="menu__text">' + plugin.name + '</div>' +
        '</li>');

        menu_item.on('hover:enter', function () {
            Lampa.Activity.push({
                url: '',
                title: plugin.name,
                component: plugin.component,
                page: 1
            });
        });

        $('.menu .menu__list').append(menu_item);

        // 3. Главный слушатель кнопок
        Lampa.Key.listener.follow('keydown', handleKeyDown);
    }

    // Ждем готовности приложения
    if (window.appready) startPlugin();
    else Lampa.Listener.follow('app', function (e) { if (e.type == 'ready') startPlugin(); });

})();
