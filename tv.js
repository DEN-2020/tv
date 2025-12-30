/*
UPDATED 30.12.2025
*/
;(function () {
'use strict';
var plugin = {
    component: 'my_iptv2',
    icon: "<svg height=\"244\" viewBox=\"0 0 260 244\" xmlns=\"http://www.w3.org/2000/svg\" style=\"fill-rule:evenodd;\" fill=\"currentColor\"><path d=\"M259.5 47.5v114c-1.709 14.556-9.375 24.723-23 30.5a2934.377 2934.377 0 0 1-107 1.5c-35.704.15-71.37-.35-107-1.5-13.625-5.777-21.291-15.944-23-30.5v-115c1.943-15.785 10.61-25.951 26-30.5a10815.71 10815.71 0 0 1 208 0c15.857 4.68 24.523 15.18 26 31.5zm-230-13a4963.403 4963.403 0 0 0 199 0c5.628 1.128 9.128 4.462 10.5 10 .667 40 .667 80 0 120-1.285 5.618-4.785 8.785-10.5 9.5-66 .667-132 .667-198 0-5.715-.715-9.215-3.882-10.5-9.5-.667-40-.667-80 0-120 1.35-5.18 4.517-8.514 9.5-10z\"/><path d=\"M70.5 71.5c17.07-.457 34.07.043 51 1.5 5.44 5.442 5.107 10.442-1 15-5.991.5-11.991.666-18 .5.167 14.337 0 28.671-.5 43-3.013 5.035-7.18 6.202-12.5 3.5a11.529 11.529 0 0 1-3.5-4.5 882.407 882.407 0 0 1-.5-42c-5.676.166-11.343 0-17-.5-4.569-2.541-6.069-6.375-4.5-11.5 1.805-2.326 3.972-3.992 6.5-5zM137.5 73.5c4.409-.882 7.909.452 10.5 4a321.009 321.009 0 0 0 16 30 322.123 322.123 0 0 0 16-30c2.602-3.712 6.102-4.879 10.5-3.5 5.148 3.334 6.314 7.834 3.5 13.5a1306.032 1306.032 0 0 0-22 43c-5.381 6.652-10.715 6.652-16 0a1424.647 1424.647 0 0 0-23-45c-1.691-5.369-.191-9.369 4.5-12zM57.5 207.5h144c7.788 2.242 10.288 7.242 7.5 15a11.532 11.532 0 0 1-4.5 3.5c-50 .667-100 .667-150 0-6.163-3.463-7.496-8.297-4-14.5 2.025-2.064 4.358-3.398 7-4z\"/></svg>",
    name: 'Hack TV'
};

var lists = [];
var curListId = -1;
var defaultGroup = 'Other';
var catalog = {};
var listCfg = {};
var EPG = {};
var epgInterval;
var UID = '';

var chNumber = '';
var chTimeout = null;
var stopRemoveChElement = false;
var chPanel = $((
    "<div class=\"player-info info--visible js-ch-PLUGIN\" style=\"top: 9em;right: auto;z-index: 1000;\">\n" +
    "	<div class=\"player-info__body\">\n" +
    "		<div class=\"player-info__line\">\n" +
    "			<div class=\"player-info__name\">&nbsp;</div>\n" +
    "		</div>\n" +
    "	</div>\n" +
    "</div>").replace(/PLUGIN/g, plugin.component)
).hide().fadeOut(0);
var chHelper = $((
    "<div class=\"player-info info--visible js-ch-PLUGIN\" style=\"top: 14em;right: auto;z-index: 1000;\">\n" +
    "	<div class=\"player-info__body\">\n" +
    "		<div class=\"tv-helper\"></div>\n" +
    "	</div>\n" +
    "</div>").replace(/PLUGIN/g, plugin.component)
).hide().fadeOut(0);
var epgTemplate = $(('<div id="PLUGIN_epg">\n' +
    '<h2 class="js-epgChannel"></h2>\n' +
    '<div class="PLUGIN-details__program-body js-epgNow">\n' +
    '   <div class="PLUGIN-details__program-title">Сейчас</div>\n' +
    '   <div class="PLUGIN-details__program-list">' +
    '<div class="PLUGIN-program selector">\n' +
    '   <div class="PLUGIN-program__time js-epgTime">XX:XX</div>\n' +
    '   <div class="PLUGIN-program__body">\n' +
    '	   <div class="PLUGIN-program__title js-epgTitle"> </div>\n' +
    '	   <div class="PLUGIN-program__progressbar"><div class="PLUGIN-program__progress js-epgProgress" style="width: 50%"></div></div>\n' +
    '   </div>\n' +
    '</div>' +
    '   </div>\n' +
    '   <div class="PLUGIN-program__desc js-epgDesc"></div>'+
    '</div>' +
    '<div class="PLUGIN-details__program-body js-epgAfter">\n' +
    '   <div class="PLUGIN-details__program-title">Потом</div>\n' +
    '   <div class="PLUGIN-details__program-list js-epgList">' +
    '   </div>\n' +
    '</div>' +
    '</div>').replace(/PLUGIN/g, plugin.component)
);
var epgItemTeplate = $((
    '<div class="PLUGIN-program selector">\n' +
    '   <div class="PLUGIN-program__time js-epgTime">XX:XX</div>\n' +
    '   <div class="PLUGIN-program__body">\n' +
    '	   <div class="PLUGIN-program__title js-epgTitle"> </div>\n' +
    '   </div>\n' +
    '</div>').replace(/PLUGIN/g, plugin.component)
);




var chHelpEl = chHelper.find('.tv-helper');
var chNumEl = chPanel.find('.player-info__name');
var encoder = $('<div/>');

function isPluginPlaylist(playlist) {
    return !(!playlist.length || !playlist[0].tv
	|| !playlist[0].plugin || playlist[0].plugin !== plugin.component);
}
Lampa.PlayerPlaylist.listener.follow('select', function(e) {
    if (e.item.plugin && e.item.plugin === plugin.component && Lampa.Player.runas)
	    Lampa.Player.runas(Lampa.Storage.field('player_iptv'));
});
function channelSwitch(dig, isChNum) {
    if (!Lampa.Player.opened()) return false;
    var playlist = Lampa.PlayerPlaylist.get();
    if (!isPluginPlaylist(playlist)) return false;
    if (!$('body>.js-ch-' + plugin.component).length) $('body').append(chPanel).append(chHelper);
    var cnt = playlist.length;
    var prevChNumber = chNumber;
    chNumber += dig;
    var number = parseInt(chNumber);
    if (number && number <= cnt) {
	if (!!chTimeout) clearTimeout(chTimeout);
	stopRemoveChElement = true; // fix removing element in callback on animate.finish()
	chNumEl.text(playlist[number - 1].title);
	if (isChNum || parseInt(chNumber + '0') > cnt) {
	    chHelper.finish().hide().fadeOut(0);
	} else {
	    var help = [];
	    var chHelpMax = 9;
	    var start = parseInt(chNumber + '0');
	    for (var i = start; i <= cnt && i <= (start + Math.min(chHelpMax, 9)); i++) {
		help.push(encoder.text(playlist[i - 1].title).html());
	    }
	    chHelpEl.html(help.join('<br>'));
	    chHelper.finish().show().fadeIn(0);
	}
	if (number < 10 || isChNum) {
	    chPanel.finish().show().fadeIn(0);
	}
	stopRemoveChElement = false;
	var chSwitch = function () {
	    var pos = number - 1;
	    if (Lampa.PlayerPlaylist.position() !== pos) {
		Lampa.PlayerPlaylist.listener.send('select', {
		    playlist: playlist,
		    position: pos,
		    item: playlist[pos]
		});
		Lampa.Player.runas && Lampa.Player.runas(Lampa.Storage.field('player_iptv'));
	    }
	    chPanel.delay(1000).fadeOut(500,function(){stopRemoveChElement || chPanel.remove()});
	    chHelper.delay(1000).fadeOut(500,function(){stopRemoveChElement || chHelper.remove()});
	    chNumber = "";
	}
	if (isChNum === true) {
	    chTimeout = setTimeout(chSwitch, 1000);
	    chNumber = "";
	} else if (parseInt(chNumber + '0') > cnt) {
	    // Ещё одна цифра невозможна - переключаем
	    chSwitch();
	} else {
	    // Ждём следующую цифру или переключаем
	    chTimeout = setTimeout(chSwitch, 3000);
	}
    } else {
	chNumber = prevChNumber;
    }
    return true;
}

var cacheVal = {};

function cache(name, value, timeout) {
    var time = (new Date()) * 1;
    if (!!timeout && timeout > 0) {
	cacheVal[name] = [(time + timeout), value];
	return;
    }
    if (!!cacheVal[name] && cacheVal[name][0] > time) {
	return cacheVal[name][1];
    }
    delete (cacheVal[name]);
    return value;
}

var timeOffset = 0;
var timeOffsetSet = false;

function unixtime() {
    return Math.floor((new Date().getTime() + timeOffset)/1000);
}

function toLocaleTimeString(time) {
    var date = new Date(),
	ofst = parseInt(Lampa.Storage.get('time_offset', 'n0').replace('n',''));
    time = time || date.getTime();

    date = new Date(time + (ofst * 1000 * 60 * 60));
    return ('0' + date.getHours()).substr(-2) + ':' + ('0' + date.getMinutes()).substr(-2);
}

function toLocaleDateString(time) {
    var date = new Date(),
	ofst = parseInt(Lampa.Storage.get('time_offset', 'n0').replace('n',''));
    time = time || date.getTime();

    date = new Date(time + (ofst * 1000 * 60 * 60));
    return date.toLocaleDateString();
}

var utils = {
    uid: function() {return UID},
    timestamp: unixtime,
    token: function() {return generateSigForString(Lampa.Storage.field('account_email').toLowerCase())},
    hash: Lampa.Utils.hash,
    hash36: function(s) {return (this.hash(s) * 1).toString(36)}
};

function generateSigForString(string) {
    var sigTime = unixtime();
    return sigTime.toString(36) + ':' + utils.hash36((string || '') + sigTime + utils.uid());
}

function strReplace(str, key2val) {
    for (var key in key2val) {
	str = str.replace(
	    new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
	    key2val[key]
	);
    }
    return str;
}

function tf(t, format, u, tz) {
    format = format || '';
    tz = parseInt(tz || '0');
    var thisOffset = 0;
    thisOffset += tz * 60;
    if (!u) thisOffset += parseInt(Lampa.Storage.get('time_offset', 'n0').replace('n','')) * 60 - new Date().getTimezoneOffset();
    var d = new Date((t + thisOffset) * 6e4);
    var r = {yyyy:d.getUTCFullYear(),MM:('0'+(d.getUTCMonth()+1)).substr(-2),dd:('0'+d.getUTCDate()).substr(-2),HH:('0'+d.getUTCHours()).substr(-2),mm:('0'+d.getUTCMinutes()).substr(-2),ss:('0'+d.getUTCSeconds()).substr(-2),UTF:t*6e4};
    return strReplace(format, r);
}

function prepareUrl(url, epg) {
    var m = [], val = '', r = {start: unixtime(), offset: 0};
    if (epg && epg.length) {
        r = {
            start: epg[0] * 60,
            utc: epg[0] * 60,
            end: (epg[0] + epg[1]) * 60,
            utcend: (epg[0] + epg[1]) * 60,
            offset: unixtime() - epg[0] * 60,
            duration: epg[1] * 60,
            now: unixtime,
            lutc: unixtime,
            d: function(m){return strReplace(m[6]||'',{M:epg[1],S:epg[1]*60,h:Math.floor(epg[1]/60),m:('0'+(epg[1] % 60)).substr(-2),s:'00'})},
            b: function(m){return tf(epg[0], m[6], m[4], m[5])},
            e: function(m){return tf(epg[0] + epg[1], m[6], m[4], m[5])},
            n: function(m){return tf(unixtime() / 60, m[6], m[4], m[5])}
        };
    }
    
    while (!!(m = url.match(/\${(\((([a-zA-Z\d]+?)(u)?)([+-]\d+)?\))?([^${}]+)}/))) {
        if (!!m[2] && typeof r[m[2]] === "function") val = r[m[2]](m);
        else if (!!m[3] && typeof r[m[3]] === "function") val = r[m[3]](m);
        else if (m[6] in r) val = typeof r[m[6]] === "function" ? r[m[6]]() : r[m[6]];
        else if (!!m[2] && typeof utils[m[2]] === "function") val = utils[m[2]](m[6]);
        else if (m[6] in utils) val = typeof utils[m[6]] === "function" ? utils[m[6]]() : utils[m[6]];
        else val = m[1];
        url = url.replace(m[0], encodeURIComponent(val));
    }

    // ЛОГИКА ПРОКСИ
    var useProxy = Lampa.Storage.get('hack_tv_proxy_enabled', false);
    if(useProxy === 'true') useProxy = true;
    if(useProxy === 'false') useProxy = false;

    var proxyAddr = Lampa.Storage.get('hack_tv_proxy_address', 'http://192.168.1.50:7777');

    if (useProxy && proxyAddr && url.indexOf(proxyAddr) === -1 && url.indexOf('http') === 0) {
        console.log('Hack TV: Проксирование -> ' + url);
        var cleanAddr = proxyAddr.replace(/\/$/, "");
        return cleanAddr + '/proxy?url=' + encodeURIComponent(url);
    }
    
    console.log('Hack TV: Прямое соединение');
    return url;
}




// РЕГИСТРАЦИЯ КОМПОНЕНТА И НАСТРОЕК
// 1. Сначала регистрируем компонент
Lampa.Component.add(plugin.component, pluginPage);

// 2. Создаем функцию для параметров
function addSettingsFields() {
    if (typeof Lampa.SettingsApi !== 'undefined' && Lampa.SettingsApi.addParam) {
        try {
            Lampa.SettingsApi.addParam({
                component: plugin.component, // Передаем компонент внутри объекта!
                param: {
                    name: 'hack_tv_proxy_enabled',
                    type: 'trigger',
                    default: false
                },
                field: {
                    name: 'Использовать прокси',
                    description: 'Пропускать запросы через локальный сервер'
                }
            });

            Lampa.SettingsApi.addParam({
                component: plugin.component,
                param: {
                    name: 'hack_tv_proxy_address',
                    type: 'input',
                    default: 'http://192.168.2.122:7777'
                },
                field: {
                    name: 'Адрес сервера прокси',
                    description: 'Введите IP вашего компьютера'
                }
            });
        } catch(e) {
            console.log('Hack TV: Ошибка при добавлении параметров', e);
        }
    }
}
// 3. Запускаем добавление по событию готовности плагинов или с небольшой задержкой
if (window.appready) {
    addSettingsFields();
} else {
    Lampa.Listener.follow('app', function (e) {
        if (e.type == 'ready') {
            addSettingsFields();
        }
    });
}

// Слушатель для отрисовки кнопки настроек в меню Lampa
Lampa.Settings.listener.follow('open', function (e) {
    if (e.name === 'plugins') {
        // Проверяем, если меню плагина еще нет, добавляем кнопку
        setTimeout(function(){
            var item = $('<div class="settings-param selector" data-type="open" data-name="' + plugin.component + '"><div class="settings-param__name">' + plugin.name + '</div><div class="settings-param__value">Настройки прокси</div></div>');
            item.on('hover:enter', function () {
                Lampa.SettingsApi.show(plugin.component); // Исправлено: передаем 'my_iptv2'
            });
            $('.settings-list').append(item);
            Lampa.Controller.active().toggle(); // Обновляем фокус
        }, 50);
    }
});

addSettingsFields();


function catchupUrl(url, type, source) {
            type = (type || '').toLowerCase();
            source = source || '';
            if (!type) {
            if (!!source) {
                if (source.search(/^https?:\/\//i) === 0) type = 'default';
                else if (source.search(/^[?&/][^/]/) === 0) type = 'append';
                else type = 'default';
            }
            else if (url.indexOf('${') < 0) type = 'shift';
            else type = 'default';
            console.log(plugin.name, 'Autodetect catchup-type "' + type + '"');
            }
            var newUrl = '';
            switch (type) {
            case 'append':
                if (source) {
                newUrl = (source.search(/^https?:\/\//i) === 0 ? '' : url) + source;
                break; // так и задумано
                }
            case 'timeshift': // @deprecated
            case 'shift': // + append
                newUrl = (source || url);
                newUrl += (newUrl.indexOf('?') >= 0 ? '&' : '?') + 'utc=${start}&lutc=${timestamp}';
                return newUrl;
            case 'flussonic':
            case 'flussonic-hls':
            case 'flussonic-ts':
            case 'fs':
                // Example stream and catchup URLs
                // stream:  http://ch01.spr24.net/151/mpegts?token=my_token
                // catchup: http://ch01.spr24.net/151/timeshift_abs-{utc}.ts?token=my_token
                // stream:  http://list.tv:8888/325/index.m3u8?token=secret
                // catchup: http://list.tv:8888/325/timeshift_rel-{offset:1}.m3u8?token=secret
                // stream:  http://list.tv:8888/325/mono.m3u8?token=secret
                // catchup: http://list.tv:8888/325/mono-timeshift_rel-{offset:1}.m3u8?token=secret
                // stream:  http://list.tv:8888/325/live?token=my_token
                // catchup: http://list.tv:8888/325/{utc}.ts?token=my_token
                return url
                .replace(/\/(video|mono)\.(m3u8|ts)/, '/$1-\${start}-\${duration}.$2')
                .replace(/\/(index|playlist)\.(m3u8|ts)/, '/archive-\${start}-\${duration}.$2')
                .replace(/\/mpegts/, '/timeshift_abs-\${start}.ts')
                ;
            case 'xc':
                // Example stream and catchup URLs
                // stream:  http://list.tv:8080/my@account.xc/my_password/1477
                // catchup: http://list.tv:8080/timeshift/my@account.xc/my_password/{duration}/{Y}-{m}-{d}:{H}-{M}/1477.ts
                // stream:  http://list.tv:8080/live/my@account.xc/my_password/1477.m3u8
                // catchup: http://list.tv:8080/timeshift/my@account.xc/my_password/{duration}/{Y}-{m}-{d}:{H}-{M}/1477.m3u8
                newUrl = url
                .replace(
                    /^(https?:\/\/[^/]+)(\/live)?(\/[^/]+\/[^/]+\/)([^/.]+)\.m3u8?$/,
                    '$1/timeshift$3\${(d)M}/\${(b)yyyy-MM-dd:HH-mm}/$4.m3u8'
                )
                .replace(
                    /^(https?:\/\/[^/]+)(\/live)?(\/[^/]+\/[^/]+\/)([^/.]+)(\.ts|)$/,
                    '$1/timeshift$3\${(d)M}/\${(b)yyyy-MM-dd:HH-mm}/$4.ts'
                )
                ;
                break;
            case 'default':
                newUrl = source || url;
                break;
            case 'disabled':
                return false;
            default:
                console.log(plugin.name, 'Err: no support catchup-type="' + type + '"');
                return false;
            }
            if (newUrl.indexOf('${') < 0) return catchupUrl(newUrl,'shift');
            return newUrl;
        }

        /* ***********************************
        * Управление плеером клавишами пульта
        * ***********************************
        * Поддержка переключения каналов (возможно не все устройства):
        * - цифровыми клавишами (по номеру канала)
        * - клавишами влево-вправо
        * - клавиши Pg+ и Pg-
        */
        function keydown(e) {
                    var code = e.code;
            if (Lampa.Player.opened() && !$('body.selectbox--open').length) {
            var playlist = Lampa.PlayerPlaylist.get();
            if (!isPluginPlaylist(playlist)) return;
            var isStopEvent = false;
            var curCh = cache('curCh') || (Lampa.PlayerPlaylist.position() + 1);
            if (code === 428 || code === 34 // Pg-
                //4 - Samsung orsay
                || ((code === 37 || code === 4) && !$('.player.tv .panel--visible .focus').length) // left
            ) {
                curCh = curCh === 1 ? playlist.length : curCh - 1; // зацикливаем
                cache('curCh', curCh, 1000);
                isStopEvent = channelSwitch(curCh, true);
            } else if (code === 427 || code === 33 // Pg+
                // 5 - Samsung orsay right
                || ((code === 39 || code === 5) && !$('.player.tv .panel--visible .focus').length) // right
            ) {
                curCh = curCh === playlist.length ? 1 : curCh + 1; // зацикливаем
                cache('curCh', curCh, 1000);
                isStopEvent = channelSwitch(curCh, true);
            } else if (code >= 48 && code <= 57) { // numpad
                isStopEvent = channelSwitch(code - 48);
            } else if (code >= 96 && code <= 105) { // numpad
                isStopEvent = channelSwitch(code - 96);
            }
            if (isStopEvent) {
                e.event.preventDefault();
                e.event.stopPropagation();
            }
            }
        }

        function bulkWrapper(func, bulk) {
        var bulkCnt = 1, timeout = 1, queueEndCallback, queueStepCallback, emptyFn = function(){};
        if (typeof bulk === 'object') {
        timeout = bulk.timeout || timeout;
        queueStepCallback = bulk.onBulk || emptyFn;
        queueEndCallback = bulk.onEnd || emptyFn;
        bulkCnt = bulk.bulk || bulkCnt;
        } else if (typeof bulk === 'number') {
        bulkCnt = bulk;
        if (typeof arguments[2] === "number") timeout = arguments[2];
        } else if (typeof bulk === 'function') {
        queueStepCallback = bulk;
        if (typeof arguments[2] === "number") bulkCnt = arguments[2];
        if (typeof arguments[3] === "number") timeout = arguments[3];
        }
        if (!bulkCnt || bulkCnt < 1) bulkCnt = 1;
        if (typeof queueEndCallback !== 'function') queueEndCallback = emptyFn;
        if (typeof queueStepCallback !== 'function') queueStepCallback = emptyFn;
        var context = this;
        var queue = [];
        var interval;
        var cnt = 0;
        var runner = function() {
        if (!!queue.length && !interval) {
                    interval = setInterval(
                    function() {
                        var i = 0;
                        while (queue.length && ++i <= bulkCnt) func.apply(context, queue.shift());
                        i = queue.length ? i : i-1;
                        cnt += i;
                        queueStepCallback.apply(context, [i, cnt, queue.length])
                        if (!queue.length) {
                        clearInterval(interval);
                        interval = null;
                        queueEndCallback.apply(context, [i, cnt, queue.length]);
                        }
                    },
                    timeout || 0
                    );
                }
                }
                return function() {
                queue.push(arguments);
                runner();
                }
            }

        function getEpgSessCache(epgId, t) {
            var key = ['epg', epgId].join('\t');
            var epg = sessionStorage.getItem(key);
            if (epg) {
            epg = JSON.parse(epg);
            if (t) {
                if (epg.length
                && (
                    t < epg[0][0]
                    || t > (epg[epg.length - 1][0] + epg[epg.length - 1][1])
                )
                ) return false;
                while (epg.length && t >= (epg[0][0] + epg[0][1])) epg.shift();
            }
            }
            return epg;
        }
        function setEpgSessCache(epgId, epg) {
            var key = ['epg', epgId].join('\t');
            sessionStorage.setItem(key, JSON.stringify(epg));
        }
        function networkSilentSessCache(url, success, fail, param) {
            var context = this;
            var key = ['cache', url, param ? utils.hash36(JSON.stringify(param)) : ''].join('\t');
            var data = sessionStorage.getItem(key);
            if (data) {
            data = JSON.parse(data);
            if (data[0]) typeof success === 'function' && success.apply(context, [data[1]]);
            else typeof fail === 'function' && fail.apply(context, [data[1]]);
            } else {
            var network = new Lampa.Reguest();
            network.silent(
                url,
                function (data) {
                sessionStorage.setItem(key, JSON.stringify([true, data]));
                typeof success === 'function' && success.apply(context, [data]);
                },
                function (data) {
                sessionStorage.setItem(key, JSON.stringify([false, data]));
                typeof fail === 'function' && fail.apply(context, [data]);
                },
                param
            );
            }
        }

        //Стиль
        Lampa.Template.add(plugin.component + '_style', '<style>#PLUGIN_epg{margin-right:1em}.PLUGIN-program__desc{font-size:0.9em;margin:0.5em;text-align:justify;max-height:15em;overflow:hidden;}.PLUGIN.category-full{padding-bottom:10em}.PLUGIN div.card__view{position:relative;background-color:#353535;background-color:#353535a6;border-radius:1em;cursor:pointer;padding-bottom:60%}.PLUGIN.square_icons div.card__view{padding-bottom:100%}.PLUGIN img.card__img,.PLUGIN div.card__img{background-color:unset;border-radius:unset;max-height:100%;max-width:100%;height:auto;width:auto;position:absolute;top:50%;left:50%;-moz-transform:translate(-50%,-50%);-webkit-transform:translate(-50%,-50%);transform:translate(-50%,-50%);font-size:2em}.PLUGIN.contain_icons img.card__img{height:95%;width:95%;object-fit:contain}.PLUGIN .card__title{text-overflow:ellipsis;white-space:nowrap;overflow:hidden}.PLUGIN .card__age{padding:0;border:1px #3e3e3e solid;margin-top:0.3em;border-radius:0.3em;position:relative;display: none}.PLUGIN .card__age .card__epg-progress{position:absolute;background-color:#3a3a3a;top:0;left:0;width:0%;max-width:100%;height:100%}.PLUGIN .card__age .card__epg-title{position:relative;padding:0.4em 0.2em;text-overflow:ellipsis;white-space:nowrap;overflow:hidden;}.PLUGIN.category-full .card__icons {top:0.3em;right:0.3em;justify-content:right;}#PLUGIN{float:right;padding: 1.2em 0;width: 30%;}.PLUGIN-details__group{font-size:1.3em;margin-bottom:.9em;opacity:.5}.PLUGIN-details__title{font-size:4em;font-weight:700}.PLUGIN-details__program{padding-top:4em}.PLUGIN-details__program-title{font-size:1.2em;padding-left:4.9em;margin-top:1em;margin-bottom:1em;opacity:.5}.PLUGIN-details__program-list>div+div{margin-top:1em}.PLUGIN-details__program>div+div{margin-top:2em}.PLUGIN-program{display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;font-size:1.2em;font-weight:300}.PLUGIN-program__time{-webkit-flex-shrink:0;-ms-flex-negative:0;flex-shrink:0;width:5em;position:relative}.PLUGIN-program.focus .PLUGIN-program__time::after{content:\'\';position:absolute;top:.5em;right:.9em;width:.4em;background-color:#fff;height:.4em;-webkit-border-radius:100%;-moz-border-radius:100%;border-radius:100%;margin-top:-0.1em;font-size:1.2em}.PLUGIN-program__progressbar{width:10em;height:0.3em;border:0.05em solid #fff;border-radius:0.05em;margin:0.5em 0.5em 0 0}.PLUGIN-program__progress{height:0.25em;border:0.05em solid #fff;background-color:#fff;max-width: 100%}.PLUGIN .card__icon.icon--timeshift{background-image:url(https://epg.rootu.top/img/icon/timeshift.svg);}</style>'.replace(/PLUGIN/g, plugin.component));
        $('body').append(Lampa.Template.get(plugin.component + '_style', {}, true));

        function epgRender(epgId) {
            // 1. Берем данные из кеша (уже очищенные от старых передач)
            var epg = (EPG[epgId] || [0, 0, []])[2]; 
            if (!epg || !epg.length) return;

            // 2. Ищем карточку канала на экране
            // В оригинале rootu используется [data-epg-id=...]
            var epgEl = body.find('[data-epg-id="' + epgId + '"] .card__age');
            if (!epgEl.length) return;

            var t = Math.floor(unixtime() / 60); // текущее время в минутах
            
            // Чистим старые передачи из массива, если они там остались
            while (epg.length && t >= (epg[0][0] + epg[0][1])) epg.shift();

            if (epg.length) {
                var now = epg[0];
                // Считаем % прогресса: (сейчас - начало) / длительность
                var progress = Math.round((t - now[0]) * 100 / (now[1] || 1));
                progress = Math.min(100, Math.max(0, progress));

                // Обновляем саму плитку канала в сетке
                epgEl.find('.card__epg-title').text(now[2]);
                epgEl.find('.js-epgProgress').css('width', progress + '%'); // проверь класс прогресс-бара
                epgEl.show(); // Показываем блок программы, если он был скрыт

                // 3. Если этот канал сейчас выбран (открыто инфо-окно)
                if (epgIdCurrent === epgId) {
                    var ec = $('#' + plugin.component + '_epg'); // контейнер шаблона epgTemplate
                    
                    // Заголовок текущей передачи
                    ec.find('.js-epgTitle').text(now[2]);
                    ec.find('.js-epgTime').text(toLocaleTimeString(now[0] * 60000));
                    ec.find('.js-epgProgress').css('width', progress + '%');
                    
                    // Описание (если есть в 4-м поле массива)
                    var desc = now[3] ? now[3] : '';
                    ec.find('.js-epgDesc').html(desc.replace(/\n/g, '<br>'));

                    // Список "Что дальше"
                    var list = ec.find('.js-epgList').empty();
                    for (var i = 1; i < Math.min(epg.length, 6); i++) {
                        var item = epgItemTeplate.clone();
                        item.find('.js-epgTime').text(toLocaleTimeString(epg[i][0] * 60000));
                        item.find('.js-epgTitle').text(epg[i][2]);
                        list.append(item);
                    }
                }
            }
        }


    function pluginPage(object) {
        Lampa.Listener.add(this);
        if (object.id !== curListId) {
            catalog = {};
            listCfg = {};
            curListId = object.id;
        }
        EPG = {};
        var epgIdCurrent = '';
        var favorite = getStorage('favorite' + object.id, '[]');
        var network = new Lampa.Reguest();
        var scroll = new Lampa.Scroll({
            mask: true,
            over: true,
            step: 250
        });

        var html = $('<div></div>');
        var body = $('<div class="' + plugin.component + ' category-full"></div>');
        
        body.toggleClass('square_icons', getSettings('square_icons'));
        body.toggleClass('contain_icons', getSettings('contain_icons'));

        var info;
        var last;

        if (epgInterval) clearInterval(epgInterval);
        epgInterval = setInterval(function() {
            for (var id in EPG) {
                epgRender(id);
            }
        }, 60000); // Обновляем раз в минуту

            this.create = function () {
            var _this = this;
            this.on = function(){};
            this.activity.loader(true);

            var emptyResult = function () {
                var empty = new Lampa.Empty();
                html.append(empty.render());
                _this.start = empty.start;
                _this.activity.loader(false);
                _this.activity.toggle();
            };

            if (Object.keys(catalog).length) {
                _this.build(!catalog[object.currentGroup] ? (lists[object.id].groups.length > 1 && catalog[lists[object.id].groups[1].key] ? catalog[lists[object.id].groups[1].key]['channels'] : []) : catalog[object.currentGroup]['channels']);
            } else if(!lists[object.id] || !object.url) {
                emptyResult();
                return;
            } else {
                var load = 2, chIDs = {}, data;
                var compileList = function (dataList) {
                    data = dataList;
                    if (!--load) parseList();
                };

                // Request EPG Channels mapping
                network.silent(Lampa.Utils.protocol() + 'epg.rootu.top/api/channels', function(d){
                    chIDs = d;
                    compileList(data);
                }, function(){
                    compileList(data);
                });

                /**
                 * Функция поиска ID программы передач по названию канала
                 */
                function epgIdByName(name) {
                    if (!name) return '';
                    
                    // Очищаем название для лучшего поиска (нижний регистр, без лишних символов)
                    var cleanName = name.toLowerCase()
                        .replace(/\s/g, '')
                        .replace(/[^\wа-яё]/gi, '')
                        .replace('hd', '')
                        .replace('fhd', '');

                    // Если в глобальном объекте EPG есть карта сопоставлений, ищем там
                    if (EPG.source && EPG.source.channels) {
                        for (var id in EPG.source.channels) {
                            var ch = EPG.source.channels[id];
                            var chName = (ch.name || '').toLowerCase().replace(/\s/g, '').replace(/[^\wа-яё]/gi, '');
                            if (chName === cleanName) return id;
                        }
                    }
                    
                    return '';
                }


var parseList = function () {
                    if (typeof data != 'string' || data.substr(0, 7).toUpperCase() !== "#EXTM3U") {
                        emptyResult();
                        return;
                    }
                    
                    // Инициализируем структуру данных под твои переменные
                    catalog = { '': { title: Lampa.Lang.translate('favorites'), channels: [] } };
                    lists[object.id].groups = [{ title: Lampa.Lang.translate('favorites'), key: '' }];
                    
                    var l = data.split(/\r?\n/);
                    var cnt = 0, i = 1, chNum = 0, m, mm, defGroup = defaultGroup;

                    while (i < l.length) {
                        chNum = cnt + 1;
                        var channel = { 
                            ChNum: chNum, 
                            Title: "Ch " + chNum, 
                            isYouTube: false, 
                            Url: '', 
                            Group: '', 
                            plugin: plugin.component, // Важно для keydown
                            tv: true 
                        };
                        
                        for (; cnt < chNum && i < l.length; i++) {
                            if (!!(m = l[i].match(/^#EXTGRP:\s*(.+?)\s*$/i)) && m[1].trim() !== '') {
                                defGroup = m[1].trim();
                            } else if (!!(m = l[i].match(/^#EXTINF:\s*-?\d+(\s+\S.*?\s*)?,(.+)$/i))) {
                                channel.Title = m[2].trim();
                                if (!!m[1] && !!(m = m[1].match(/([^\s=]+)=((["'])(.*?)\3|\S+)/g))) {
                                    for (var j = 0; j < m.length; j++) {
                                        if (!!(mm = m[j].match(/([^\s=]+)=((["'])(.*?)\3|\S+)/))) {
                                            var key = mm[1].toLowerCase();
                                            channel[key] = mm[4] || mm[2];
                                        }
                                    }
                                }
                            } else if (!!(m = l[i].match(/^(https?):\/\/(.+)$/i))) {
                                channel.Url = m[0].trim();
                                channel.isYouTube = !!(m[2].match(/^(www\.)?youtube\.com/));
                                channel.Group = channel['group-title'] || defGroup;
                                cnt++;
                            }
                        }

                        if (!!channel.Url && !channel.isYouTube) {
                            if (!catalog[channel.Group]) {
                                catalog[channel.Group] = { title: channel.Group, channels: [] };
                                // Добавляем в твои группы (key = name, как ты и просил)
                                lists[object.id].groups.push({ title: channel.Group, key: channel.Group });
                            }
                            
                            // Привязка EPG
                            var epg_id = channel['tvg-id'] || epgIdByName(channel.Title);
                            if (epg_id) {
                                channel['epgId'] = epg_id;
                                if (!channel['tvg-logo']) {
                                    channel['tvg-logo'] = 'https://epg.it999.ru/img2/' + epg_id + '.png';
                                }
                            }
                            
                            catalog[channel.Group].channels.push(channel);
                            
                            // Избранное через хэш Lampa
                            var fav_id = Lampa.Utils.hash(channel.Title);
                            if (favorite.indexOf(fav_id) !== -1) catalog[''].channels.push(channel);
                        }
                    }

                    // Рендерим нужную группу
                    var activeGroup = object.currentGroup || '';
                    if (!catalog[activeGroup]) activeGroup = lists[object.id].groups.length > 1 ? lists[object.id].groups[1].key : '';
                    
                    _this.build(catalog[activeGroup].channels);
                };

                var listUrl = prepareUrl(object.url);
                network.native(listUrl, compileList, function () {
                    // Пробуем через корс, если напрямую не вышло
                    network.silent(Lampa.Utils.protocol() + 'epg.rootu.top/cors.php?url=' + encodeURIComponent(listUrl), compileList, emptyResult, false, {dataType: 'text'});
                }, false, {dataType: 'text'});
            }
        };

        this.build = function (data) {
            var _this2 = this;
            Lampa.Background.change();
            body.empty();
            
            // Заголовок и инфо-блок (восстанавливаю структуру под EPG)
            info = Lampa.Template.get('info');
            info.find('.info__title').text(catalog[object.currentGroup || ''].title);
            
            html.empty().append(info).append(scroll.render());
            scroll.append(body);

            data.forEach(function (channel) {
                var card = Lampa.Template.get('card', { title: channel.Title, release_year: '' });
                card.addClass('card--collection ' + plugin.component);
                
                // Добавляем контейнеры для EPG внутрь карточки
                card.find('.card__age').empty().append('<div class="card__epg-progress js-epgProgress" style="width:0%"></div><div class="card__epg-title"></div>').show();
                
                if (channel['tvg-logo']) {
                    card.find('.card__img').attr('src', channel['tvg-logo']);
                }

                if (channel.epgId) {
                    card.attr('data-epg-id', channel.epgId);
                    // Если программы в памяти нет — грузим
                    if (!EPG[channel.epgId]) {
                        EPG[channel.epgId] = [0, 0, []]; // Резервируем место
                        network.silent('https://epg.rootu.top/api/epg/' + channel.epgId, function(res) {
                            if (res && res.epg) EPG[channel.epgId] = [0, 0, res.epg];
                        });
                    }
                }

                card.on('hover:focus', function () {
                    last = card[0];
                    if (channel.epgId) {
                        epgIdCurrent = channel.epgId;
                        // Сразу рисуем детали EPG под карточкой
                        info.find('.info__line').empty().append(epgTemplate.clone());
                        epgRender(channel.epgId);
                    }
                }).on('hover:enter', function () {
                    Lampa.Player.play({
                        title: channel.Title,
                        url: prepareUrl(channel.Url),
                        playlist: data
                    });
                });

                body.append(card);
            });

            _this2.activity.loader(false);
            _this2.activity.toggle();
        };

        this.start = function () {
            Lampa.Controller.add('content', {
                toggle: function () {
                    Lampa.Controller.collectionSet(scroll.render());
                    Lampa.Controller.collectionFocus(last || body.find('.selector').eq(0)[0], scroll.render());
                },
                left: function () { Lampa.Controller.toggle('menu'); },
                up: function () { Lampa.Controller.toggle('head'); },
                back: Lampa.Activity.backward
            });
            Lampa.Controller.toggle('content');
        };

        this.pause = function () {};
        this.stop = function () {};
        this.destroy = function () {
            if (epgInterval) clearInterval(epgInterval);
            network.clear();
            scroll.destroy();
            html.remove();
        };

        this.render = function () { return html; };
    }
if (!Lampa.Lang) {
    var lang_data = {};
    Lampa.Lang = {
	add: function add(data) {
	    lang_data = data;
	},
	translate: function translate(key) {
	    return lang_data[key] ? lang_data[key].ru : key;
	}
    };
}
var langData = {};
function langAdd(name, values) {
    langData[plugin.component + '_' + name] = values;
}
function langGet(name) {
    return Lampa.Lang.translate(plugin.component + '_' + name);
}

langAdd('default_playlist',
    {
	ru: 'https://raw.githubusercontent.com/blackbirdstudiorus/LoganetXIPTV/main/LoganetXAll.m3u',
	uk: 'https://raw.githubusercontent.com/blackbirdstudiorus/LoganetXIPTV/main/LoganetXAll.m3u',
	be: 'https://raw.githubusercontent.com/blackbirdstudiorus/LoganetXIPTV/main/LoganetXAll.m3u',
	en: 'https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist.m3u8',
	zh: 'https://raw.iqiq.io/Free-TV/IPTV/master/playlist.m3u8'
    }
);
langAdd('default_playlist_cat',
    {
	ru: 'Russia',
	uk: 'Ukraine',
	be: 'Belarus',
	en: 'VOD Movies (EN)',
	zh: 'China'
    }
);
langAdd('settings_playlist_num_group',
    {
	ru: 'Плейлист ',
	uk: 'Плейлист ',
	be: 'Плэйліст ',
	en: 'Playlist ',
	zh: '播放列表 '
    }
);
langAdd('settings_list_name',
    {
	ru: 'Название',
	uk: 'Назва',
	be: 'Назва',
	en: 'Name',
	zh: '名称'
    }
);
langAdd('settings_list_name_desc',
    {
	ru: 'Название плейлиста в левом меню',
	uk: 'Назва плейлиста у лівому меню',
	be: 'Назва плэйліста ў левым меню',
	en: 'Playlist name in the left menu',
	zh: '左侧菜单中的播放列表名称'
    }
);
langAdd('settings_list_url',
    {
	ru: 'URL-адрес',
	uk: 'URL-адреса',
	be: 'URL-адрас',
	en: 'URL',
	zh: '网址'
    }
);
langAdd('settings_list_url_desc0',
    {
	ru: 'По умолчанию используется плейлист из проекта. Вы можете заменить его на свой.',
	uk: 'За замовчуванням використовується плейлист із проекту <i>https://github.com/Free-TV/IPTV</i><br>Ви можете замінити його на свій.',
	be: 'Па змаўчанні выкарыстоўваецца плэйліст з праекта <i>https://github.com/Free-TV/IPTV</i><br> Вы можаце замяніць яго на свой.',
	en: 'The default playlist is from the project <i>https://github.com/Free-TV/IPTV</i><br>You can replace it with your own.',
	zh: '默认播放列表来自项目 <i>https://github.com/Free-TV/IPTV</i><br>您可以将其替换为您自己的。'
    }
);
langAdd('settings_list_url_desc1',
    {
	ru: 'Вы можете добавить еще один плейлист здесь. Ссылки на плейлисты обычно заканчиваются на <i>.m3u</i> или <i>.m3u8</i>',
	uk: 'Ви можете додати ще один плейлист суду. Посилання на плейлисти зазвичай закінчуються на <i>.m3u</i> або <i>.m3u8</i>',
	be: 'Вы можаце дадаць яшчэ адзін плэйліст суда. Спасылкі на плэйлісты звычайна заканчваюцца на <i>.m3u</i> або <i>.m3u8</i>',
	en: 'You can add another trial playlist. Playlist links usually end with <i>.m3u</i> or <i>.m3u8</i>',
	zh: '您可以添加另一个播放列表。 播放列表链接通常以 <i>.m3u</i> 或 <i>.m3u8</i> 结尾'
    }
);
langAdd('categories',
    {
	ru: 'Категории',
	uk: 'Категорія',
	be: 'Катэгорыя',
	en: 'Categories',
	zh: '分类'
    }
);
langAdd('uid',
    {
	ru: 'UID',
	uk: 'UID',
	be: 'UID',
	en: 'UID',
	zh: 'UID'
    }
);
langAdd('unique_id',
    {
	ru: 'Уникальный идентификатор (нужен для некоторых ссылок на плейлисты)',
	uk: 'унікальний ідентифікатор (необхідний для деяких посилань на списки відтворення)',
	be: 'унікальны ідэнтыфікатар (неабходны для некаторых спасылак на спіс прайгравання)',
	en: 'unique identifier (needed for some playlist links)',
	zh: '唯一 ID（某些播放列表链接需要）'
    }
);
langAdd('favorites',
    {
	ru: 'Избранное',
	uk: 'Вибране',
	be: 'Выбранае',
	en: 'Favorites',
	zh: '收藏夹'
    }
);
langAdd('favorites_add',
    {
	ru: 'Добавить в избранное',
	uk: 'Додати в обране',
	be: 'Дадаць у абранае',
	en: 'Add to favorites',
	zh: '添加到收藏夹'
    }
);
langAdd('favorites_del',
    {
	ru: 'Удалить из избранного',
	uk: 'Видалити з вибраного',
	be: 'Выдаліць з абранага',
	en: 'Remove from favorites',
	zh: '从收藏夹中删除'
    }
);
langAdd('favorites_clear',
    {
	ru: 'Очистить избранное',
	uk: 'Очистити вибране',
	be: 'Ачысціць выбранае',
	en: 'Clear favorites',
	zh: '清除收藏夹'
    }
);
langAdd('favorites_move_top',
    {
	ru: 'В начало списка',
	uk: 'На початок списку',
	be: 'Да пачатку спісу',
	en: 'To the top of the list',
	zh: '到列表顶部'
    }
);
langAdd('favorites_move_up',
    {
	ru: 'Сдвинуть вверх',
	uk: 'Зрушити вгору',
	be: 'Ссунуць уверх',
	en: 'Move up',
	zh: '上移'
    }
);
langAdd('favorites_move_down',
    {
	ru: 'Сдвинуть вниз',
	uk: 'Зрушити вниз',
	be: 'Ссунуць уніз',
	en: 'Move down',
	zh: '下移'
    }
);
langAdd('favorites_move_end',
    {
	ru: 'В конец списка',
	uk: 'В кінець списку',
	be: 'У канец спісу',
	en: 'To the end of the list',
	zh: '到列表末尾'
    }
);
langAdd('epg_on',
    {
	ru: 'Включить телепрограмму',
	uk: 'Увімкнути телепрограму',
	be: 'Уключыць тэлепраграму',
	en: 'TV Guide: On',
	zh: '電視指南：開'
    }
);
langAdd('epg_off',
    {
	ru: 'Отключить телепрограмму',
	uk: 'Вимкнути телепрограму',
	be: 'Адключыць тэлепраграму',
	en: 'TV Guide: Off',
	zh: '電視指南：關閉'
    }
);
langAdd('epg_title',
    {
	ru: 'Телепрограмма',
	uk: 'Телепрограма',
	be: 'Тэлепраграма',
	en: 'TV Guide',
	zh: '電視指南'
    }
);
langAdd('square_icons', {
    ru: 'Квадратные лого каналов',
    uk: 'Квадратні лого каналів',
    be: 'Квадратныя лога каналаў',
    en: 'Square channel logos',
    zh: '方形通道標誌'
});
langAdd('contain_icons', {
    ru: 'Коррекция размера логотипа телеканала',
    uk: 'Виправлення розміру логотипу телеканалу',
    be: 'Карэкцыя памеру лагатыпа тэлеканала',
    en: 'TV channel logo size correction',
    zh: '電視頻道標誌尺寸校正'
});
langAdd('contain_icons_desc', {
    ru: 'Может некорректно работать на старых устройствах',
    uk: 'Може некоректно працювати на старих пристроях',
    be: 'Можа некарэктна працаваць на старых прыладах',
    en: 'May not work correctly on older devices.',
    zh: '可能无法在较旧的设备上正常工作。'
});

Lampa.Lang.add(langData);

function favID(title) {
    return title.toLowerCase().replace(/[\s!-\/:-@\[-`{-~]+/g, '')
}
function getStorage(name, defaultValue) {
    return Lampa.Storage.get(plugin.component + '_' + name, defaultValue);
}
function setStorage(name, val, noListen) {
    return Lampa.Storage.set(plugin.component + '_' + name, val, noListen);
}
function getSettings(name) {
    return Lampa.Storage.field(plugin.component + '_' + name);
}
function addSettings(type, param, callback) { // Добавили callback
    var data = {
        component: plugin.component,
        param: {
            name: plugin.component + '_' + param.name,
            type: type,
            values: !param.values ? '' : param.values,
            default: (typeof param.default === 'undefined') ? '' : param.default
        },
        field: {
            name: !param.title ? (!param.name ? '' : param.name) : param.title
        },
        onChange: callback || param.onChange // Если передали функцию третьим аргументом, используем её
    };
    if (!!param.description) data.field.description = param.description;
    Lampa.SettingsApi.addParam(data);
}

function addSettings() {
    // Добавляем параметр в хранилище Лампы
    Lampa.Settings.add({
        name: 'iptv_list_url',
        type: 'input',
        default: '',
        name: 'Плейлист Hack TV',
        description: 'Введите ссылку на m3u файл'
    });
}

function configurePlaylist(i) {
    addSettings('title', {title: langGet('settings_playlist_num_group') + (i+1)});
    var defName = 'list ' + (i+1);
    var activity = {
	id: i,
	url: '',
	title: plugin.name,
	groups: [],
	currentGroup: getStorage('last_catalog' + i, langGet('default_playlist_cat')),
	component: plugin.component,
	page: 1
    };
    if (activity.currentGroup === '!!') activity.currentGroup = '';
    addSettings('input', {
	title: langGet('settings_list_name'),
	name: 'list_name_' + i,
	default: i ? '' : plugin.name,
	placeholder: i ? defName : '',
	description: langGet('settings_list_name_desc'),
	onChange: function (newVal) {
	    var title = !newVal ? (i ? defName : plugin.name) : newVal;
	    $('.js-' + plugin.component + '-menu' + i + '-title').text(title);
	    activity.title = title + (title === plugin.name ? '' : ' - ' + plugin.name);
	}
    });
    addSettings('input', {
	title: langGet('settings_list_url'),
	name: 'list_url_' + i,
	default: i ? '' : langGet('default_playlist'),
	placeholder: i ? 'http://example.com/list.m3u8' : '',
	description: i
	    ? (!getStorage('list_url_' + i) ? langGet('settings_list_url_desc1') : '')
	    : langGet('settings_list_url_desc0'),
	onChange: function (url) {
	    if (url === activity.url) return;
	    if (activity.id === curListId) {
		catalog = {};
		curListId = -1;
	    }
	    if (/^https?:\/\/./i.test(url)) {
		activity.url = url;
		$('.js-' + plugin.component + '-menu' + i).show();
	    } else {
		activity.url = '';
		$('.js-' + plugin.component + '-menu' + i).hide();
	    }
	}
    });

    var name = getSettings('list_name_' + i);
    var url = getSettings('list_url_' + i);
    var title = (name || defName);
    activity.title = title + (title === plugin.name ? '' : ' - ' + plugin.name);
    var menuEl = $('<li class="menu__item selector js-' + plugin.component + '-menu' + i + '">'
			+ '<div class="menu__ico">' + plugin.icon + '</div>'
			+ '<div class="menu__text js-' + plugin.component + '-menu' + i + '-title">'
			    + encoder.text(title).html()
			+ '</div>'
		    + '</li>')
	.hide()
	.on('hover:enter', function(){
	    if (Lampa.Activity.active().component === plugin.component) {
		Lampa.Activity.replace(Lampa.Arrays.clone(activity));
	    } else {
		Lampa.Activity.push(Lampa.Arrays.clone(activity));
	    }
	});
    if (/^https?:\/\/./i.test(url)) {
	activity.url = url;
	menuEl.show();
    }
    lists.push({activity: activity, menuEl: menuEl, groups: []});
    return !activity.url ? i + 1 : i;
}


// --- ИСПРАВЛЕННЫЙ БЛОК РЕГИСТРАЦИИ И ЗАПУСКА ---

// --- ПОЛНОСТЬЮ ИСПРАВЛЕННЫЙ БЛОК РЕГИСТРАЦИИ ---

function addSettingsFields() {
    if (typeof Lampa.SettingsApi !== 'undefined' && Lampa.SettingsApi.addParam) {
        try {
            // Исправленный формат: один объект в качестве аргумента
            Lampa.SettingsApi.addParam({
                component: plugin.component,
                param: {
                    name: 'hack_tv_proxy_enabled',
                    type: 'trigger', // в новом API 'trigger' заменяет 'boolean'
                    default: false
                },
                field: {
                    name: 'Использовать прокси',
                    description: 'Пропускать запросы через ваш локальный сервер'
                }
            });

            Lampa.SettingsApi.addParam({
                component: plugin.component,
                param: {
                    name: 'hack_tv_proxy_address',
                    type: 'input',
                    default: 'http://192.168.2.122:7777'
                },
                field: {
                    name: 'Адрес сервера прокси',
                    description: 'Введите IP вашего компьютера'
                }
            });
        } catch(e) {
            console.error('Hack TV: Ошибка в addParam', e);
        }
    }
}

// Слушатель для отрисовки пункта в Настройки -> Плагины
Lampa.Settings.listener.follow('open', function (e) {
    if (e.name === 'plugins') {
        setTimeout(function(){
            if ($('.settings-param[data-name="' + plugin.component + '"]').length) return;
            var item = $('<div class="settings-param selector" data-type="open" data-name="' + plugin.component + '"><div class="settings-param__name">' + plugin.name + '</div><div class="settings-param__value">Настройки прокси</div></div>');
            item.on('hover:enter', function () {
                Lampa.SettingsApi.show(plugin.component); // Передаем строку компонента
            });
            $('.settings-list').append(item);
            Lampa.Controller.active().toggle();
        }, 50);
    }
});

// Единый запуск после готовности
if (window.appready) {
    addSettingsFields();
} else {
    Lampa.Listener.follow('app', function (e) {
        if (e.type == 'ready') addSettingsFields();
    });
}

// Регистрация плейлистов
// Автоматически регистрируем все плейлисты из массива lists
if (typeof lists !== 'undefined' && lists.length) {
    for (var i = 0; i < lists.length; i++) {
        configurePlaylist(i);
    }
}

// UID
var UID = getStorage('uid', '');
if (!UID) {
    UID = Lampa.Utils.uid(10).toUpperCase().replace(/(.{4})/g, '$1-');
    setStorage('uid', UID);
}

// 1. Уникальный ID для настроек
    var plugin_id = 'hack_tv_final';

    Lampa.Template.add('settings_' + plugin_id, '<div class="settings-list"></div>');

    // 2. Регистрация компонента (чтобы не было пустых окон)
// 2. Регистрация компонента (Отрисовка списка каналов)
    Lampa.Component.add(plugin_id, function (object, value) {
        var _this = this;
        var items = [];
        var scroll = Lampa.Scroll.render();
        
        this.create = function () {
            // Подгружаем данные первого плейлиста из твоего массива lists
            var url = lists[0].url; 
            
            // Если включен прокси, подменяем URL
            if(Lampa.Storage.get('hack_tv_proxy_enabled', false)) {
                var ip = Lampa.Storage.get('hack_tv_ip', '127.0.0.1');
                url = 'http://' + ip + ':7777/proxy?url=' + encodeURIComponent(url);
            }

            // Делаем запрос к списку каналов
            var network = new Lampa.Reguest();
            network.silent(url, function (data) {
                // Здесь должна быть логика парсинга M3U, 
                // но для теста просто выведем, что данные получены
                _this.ready();
            }, function () {
                Lampa.Noty.show('Ошибка загрузки каналов');
            });

            return scroll.render();
        };

        this.render = function () {
            return scroll.render();
        };

        this.ready = function () {
            Lampa.Controller.enable('content');
        };
    });

    // 3. Функция добавления параметров (Прокси и IP) в системное хранилище
    function addSettingsFields() {
        if (typeof Lampa.SettingsApi !== 'undefined' && Lampa.SettingsApi.addParam) {
            // Переключатель ПРОКСИ
            Lampa.SettingsApi.addParam({
                component: plugin.component,
                param: { name: 'hack_tv_proxy_enabled', type: 'trigger', default: false },
                field: { name: 'Использовать прокси', description: 'Для работы на ПК/Браузере' }
            });
            // Поле для IP
            Lampa.SettingsApi.addParam({
                component: plugin.component,
                param: { name: 'hack_tv_ip', type: 'input', default: '192.168.2.122' },
                field: { name: 'IP сервера', description: 'Введите IP вашего локального сервера' }
            });
        }
    }

    // 4. ГЛАВНЫЙ СЛУШАТЕЛЬ ИНТЕРФЕЙСА
    Lampa.Settings.listener.follow('open', function (e) {
        // Добавляем Hack TV в главный список настроек (Шестеренка)
        if (e.name === 'main') {
            setTimeout(function() {
                var container = e.body.find('.scroll__body > div, .scroll__content').last();
                if (container.length && !container.find('[data-component="'+plugin_id+'"]').length) {
                    var btn = $('<div class="settings-folder selector" data-component="'+plugin_id+'">' +
                        '<div class="settings-folder__icon">' + plugin.icon + '</div>' +
                        '<div class="settings-folder__name">Hack TV (Настройки)</div>' +
                    '</div>');
                    btn.on('click', function () { Lampa.Settings.main(plugin_id); });
                    container.prepend(btn);
                    Lampa.Controller.enable('settings_list');
                }
            }, 150);
        }

        // Рисуем содержимое внутри раздела Hack TV
            if (e.name === plugin_id) {
                setTimeout(function() {
                    var content_box = e.body.find('.scroll__body > div, .scroll__content').last();
                    if (content_box.length) {
                        var ip = Lampa.Storage.get('hack_tv_ip', '192.168.2.122');
                        var proxy_enabled = Lampa.Storage.get('hack_tv_proxy_enabled', false);
                        var proxy_status_text = proxy_enabled ? 'ВКЛ' : 'ВЫКЛ';
                        
                        var html = $('<div class="settings-list"></div>');
                        
                        var item_ip = $('<div class="settings-param selector"><div class="settings-param__name">IP Адрес сервера</div><div class="settings-param__value">' + ip + '</div></div>');
                        var item_proxy = $('<div class="settings-param selector"><div class="settings-param__name">Прокси-режим</div><div class="settings-param__value">' + proxy_status_text + '</div></div>');
                        
                        // --- ДОБАВЛЯЕМ ПУНКТ СТАТУСА ---
                        var item_status = $('<div class="settings-param selector"><div class="settings-param__name">Статус сервера</div><div class="settings-param__value js-server-status">Проверка...</div></div>');

                        // Функция проверки соединения
                        var checkServer = function() {
                            var status_el = item_status.find('.js-server-status');
                            status_el.text('Подключение...').css('color', 'white');
                            
                            var network = new Lampa.Reguest();
                            // Пробуем достучаться до корня или эндпоинта /proxy
                            var test_url = 'http://' + ip + ':7777/'; 
                            
                            network.silent(test_url, function(json) {
                                status_el.text('ONLINE (OK)').css('color', '#2ecc71'); // Зеленый
                                console.log('Hack TV: Server is alive');
                            }, function(a, c) {
                                // Если статус 0 — сервер выключен, если 404/500 — сервер работает, но путь не тот
                                status_el.text('OFFLINE (Error)').css('color', '#e74c3c'); // Красный
                                console.log('Hack TV: Server connection failed');
                            });
                        };

                        // Вызываем проверку при открытии
                        checkServer();

                        item_ip.on('click', function() {
                            Lampa.Input.edit({value: ip, title: 'Введите IP'}, function(new_val) {
                                if(new_val) { 
                                    Lampa.Storage.set('hack_tv_ip', new_val); 
                                    Lampa.Settings.main(plugin_id); 
                                }
                            });
                        });

                        item_proxy.on('click', function() {
                            var current = Lampa.Storage.get('hack_tv_proxy_enabled', false);
                            Lampa.Storage.set('hack_tv_proxy_enabled', !current);
                            Lampa.Settings.main(plugin_id);
                        });
                        
                        // Клик по статусу принудительно обновляет проверку
                        item_status.on('click', checkServer);

                        html.append(item_ip).append(item_proxy).append(item_status);
                        content_box.empty().append(html);
                        Lampa.Controller.enable('settings_list');
                    }
                }, 150);
            }
        });

    // 5. Инициализация при старте
    function pluginStart() {
        if (window['plugin_' + plugin.component + '_ready']) return;
        window['plugin_' + plugin.component + '_ready'] = true;

        addSettingsFields();

        // Добавляем иконку в левое меню
        Lampa.Listener.follow('app', function (e) {
            if (e.type == 'ready') {
                var menu = $('.menu .menu__list');
                if (menu.length && !menu.find('[data-id="hack_tv_main"]').length) {
                    var el = $('<li class="menu__item selector" data-id="hack_tv_main"><div class="menu__ico">' + plugin.icon + '</div><div class="menu__text">Hack TV</div></li>');
                    
                    el.on('click', function () {
                        // ТУТ ЛОГИКА: На ТВ открываем каналы, на ПК можно зажать и открыть настройки
                        Lampa.Activity.push({
                            url: lists[0].url,
                            title: lists[0].title,
                            component: plugin.component,
                            id: 0
                        });
                    });
                    menu.append(el);
                }
            }
        });
    }

    // Запуск
    if (window.appready) pluginStart();
    else Lampa.Listener.follow('app', function (e) { if (e.type == 'ready') pluginStart(); });

})();
