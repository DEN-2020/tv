/*
// https://ss-iptv.com/ru/operators/catchup
// niklabs.com/catchup-settings/
// http://plwxk8hl.russtv.net/iptv/00000000000000/9201/index.m3u8?utc=1666796400&lutc=1666826200
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
            stopRemoveChElement = true;
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
                chSwitch();
            } else {
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

    var utils = {
        uid: function() {return UID},
        timestamp: unixtime,
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
        var m = [], val = '', r = {start:unixtime(), offset:0};
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

        var useProxy = Lampa.Storage.get('hack_tv_proxy_enabled', 'false'); 
        var proxyAddr = Lampa.Storage.get('hack_tv_proxy_address', 'http://192.168.1.50:7777');

        if (useProxy === 'true' || useProxy === true) {
            return proxyAddr + '/proxy?url=' + encodeURIComponent(url);
        }
        return url;
    }

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
        }
        var newUrl = '';
        switch (type) {
            case 'append':
                if (source) {
                    newUrl = (source.search(/^https?:\/\//i) === 0 ? '' : url) + source;
                    break;
                }
            case 'shift':
                newUrl = (source || url);
                newUrl += (newUrl.indexOf('?') >= 0 ? '&' : '?') + 'utc=${start}&lutc=${timestamp}';
                return newUrl;
            case 'flussonic':
                return url
                    .replace(/\/(video|mono)\.(m3u8|ts)/, '/$1-\${start}-\${duration}.$2')
                    .replace(/\/(index|playlist)\.(m3u8|ts)/, '/archive-\${start}-\${duration}.$2')
                    .replace(/\/mpegts/, '/timeshift_abs-\${start}.ts');
            case 'xc':
                newUrl = url
                    .replace(/^(https?:\/\/[^/]+)(\/live)?(\/[^/]+\/[^/]+\/)([^/.]+)\.m3u8?$/,'$1/timeshift$3\${(d)M}/\${(b)yyyy-MM-dd:HH-mm}/$4.m3u8')
                    .replace(/^(https?:\/\/[^/]+)(\/live)?(\/[^/]+\/[^/]+\/)([^/.]+)(\.ts|)$/,'$1/timeshift$3\${(d)M}/\${(b)yyyy-MM-dd:HH-mm}/$4.ts');
                break;
            case 'default':
                newUrl = source || url;
                break;
            case 'disabled':
                return false;
            default:
                return false;
        }
        if (newUrl.indexOf('${') < 0) return catchupUrl(newUrl,'shift');
        return newUrl;
    }

    function keydown(e) {
        var code = e.code;
        if (Lampa.Player.opened() && !$('body.selectbox--open').length) {
            var playlist = Lampa.PlayerPlaylist.get();
            if (!isPluginPlaylist(playlist)) return;
            var isStopEvent = false;
            var curCh = cache('curCh') || (Lampa.PlayerPlaylist.position() + 1);
            if (code === 428 || code === 34 || ((code === 37 || code === 4) && !$('.player.tv .panel--visible .focus').length)) {
                curCh = curCh === 1 ? playlist.length : curCh - 1;
                cache('curCh', curCh, 1000);
                isStopEvent = channelSwitch(curCh, true);
            } else if (code === 427 || code === 33 || ((code === 39 || code === 5) && !$('.player.tv .panel--visible .focus').length)) {
                curCh = curCh === playlist.length ? 1 : curCh + 1;
                cache('curCh', curCh, 1000);
                isStopEvent = channelSwitch(curCh, true);
            } else if (code >= 48 && code <= 57) { isStopEvent = channelSwitch(code - 48); }
              else if (code >= 96 && code <= 105) { isStopEvent = channelSwitch(code - 96); }
            if (isStopEvent) {
                e.event.preventDefault();
                e.event.stopPropagation();
            }
        }
    }

    function getEpgSessCache(epgId, t) {
        var key = ['epg', epgId].join('\t');
        var epg = sessionStorage.getItem(key);
        if (epg) {
            epg = JSON.parse(epg);
            if (t) {
                if (epg.length && (t < epg[0][0] || t > (epg[epg.length - 1][0] + epg[epg.length - 1][1]))) return false;
                while (epg.length && t >= (epg[0][0] + epg[0][1])) epg.shift();
            }
        }
        return epg;
    }

    function setEpgSessCache(epgId, epg) {
        var key = ['epg', epgId].join('\t');
        sessionStorage.setItem(key, JSON.stringify(epg));
    }

    function langGet(name) {
        var L = {favorites: 'Избранное'};
        return L[name] || name;
    }

    function favID(title) { return Lampa.Utils.hash(title); }

    function getStorage(name, def) { return Lampa.Storage.get(name, def); }
    function setStorage(name, val) { Lampa.Storage.set(name, val); }
    function getSettings(name) { return Lampa.Storage.field(name); }

    // --- СТИЛИ ---
    Lampa.Template.add(plugin.component + '_style', '<style>#PLUGIN_epg{margin-right:1em}.PLUGIN-program__desc{font-size:0.9em;margin:0.5em;text-align:justify;max-height:15em;overflow:hidden;}.PLUGIN.category-full{padding-bottom:10em}.PLUGIN div.card__view{position:relative;background-color:#353535;background-color:#353535a6;border-radius:1em;cursor:pointer;padding-bottom:60%}.PLUGIN.square_icons div.card__view{padding-bottom:100%}.PLUGIN img.card__img,.PLUGIN div.card__img{background-color:unset;border-radius:unset;max-height:100%;max-width:100%;height:auto;width:auto;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:2em}.PLUGIN.contain_icons img.card__img{height:95%;width:95%;object-fit:contain}.PLUGIN .card__title{text-overflow:ellipsis;white-space:nowrap;overflow:hidden}.PLUGIN .card__age{display: none}.PLUGIN-details__program-title{font-size:1.2em;opacity:.5}.PLUGIN-program{display:flex;font-size:1.2em;font-weight:300}.PLUGIN-program__progressbar{width:10em;height:0.3em;border:0.05em solid #fff;margin:0.5em 0.5em 0 0}.PLUGIN-program__progress{height:0.25em;background-color:#fff;max-width: 100%}</style>'.replace(/PLUGIN/g, plugin.component));
    $('body').append(Lampa.Template.get(plugin.component + '_style', {}, true));

    function pluginPage(object) {
        var _this = this;
        if (object.id !== curListId) {
            catalog = {};
            listCfg = {};
            curListId = object.id;
        }
        EPG = {};
        var favorite = JSON.parse(getStorage('favorite' + object.id, '[]'));
        var network = new Lampa.Reguest();
        var scroll = new Lampa.Scroll({mask: true, over: true, step: 250});
        var html = $('<div></div>');
        var body = $('<div class="' + plugin.component + ' category-full"></div>');
        body.toggleClass('square_icons', getSettings('square_icons'));
        body.toggleClass('contain_icons', getSettings('contain_icons'));

        if (epgInterval) clearInterval(epgInterval);
        epgInterval = setInterval(function () {
            for (var epgId in EPG) { epgRender(epgId); }
        }, 5000);

        function epgRender(epgId) {
            var e = EPG[epgId], t = unixtime(), i = 0, epgNow, epgAfter = [];
            if (!e || !e.epg || !e.epg.length) return;
            while (e.epg.length && t >= (e.epg[0][0] + e.epg[0][1])) e.epg.shift();
            if (e.epg.length) {
                epgNow = e.epg[0];
                for (i = 1; i < e.epg.length && i < 10; i++) epgAfter.push(e.epg[i]);
                e.elements.forEach(function (el) {
                    var progress = Math.min(100, Math.max(0, (t - epgNow[0]) * 100 / epgNow[1]));
                    el.find('.card__age').show().find('.card__epg-progress').css('width', progress + '%');
                    el.find('.card__epg-title').text(epgNow[2]);
                });
            }
        }

        this.build = function (items) {
            if (!items.length) {
                _this.activity.loader(false);
                html.append(new Lampa.Empty().render());
                return;
            }
            items.forEach(function (item) {
                var card = Lampa.Template.get('card', {title: item.Title, release_year: ''});
                card.addClass(plugin.component);
                if (item['tvg-logo']) card.find('.card__img').attr('src', item['tvg-logo']);
                
                card.on('hover:enter', function () {
                    var video = {
                        title: item.Title,
                        url: prepareUrl(item.Url),
                        quality: 'TV',
                        tv: true,
                        plugin: plugin.component
                    };
                    Lampa.Player.run(video);
                    Lampa.Player.runas && Lampa.Player.runas(Lampa.Storage.field('player_iptv'));
                });
                body.append(card);
            });
            html.append(body);
            _this.activity.loader(false);
            _this.activity.toggle();
        };

        this.create = function () {
            this.activity.loader(true);
            var listUrl = prepareUrl(object.url);
            
            network.native(listUrl, function(data) {
                _this.parse(data);
            }, function() {
                var currentUid = UID || '';
                var sig = generateSigForString(listUrl);
                network.silent(Lampa.Utils.protocol() + 'epg.rootu.top/cors.php?url=' + encodeURIComponent(listUrl) + '&uid=' + currentUid + '&sig=' + sig, function(data) {
                    _this.parse(data);
                }, function() {
                    html.append(new Lampa.Empty().render());
                    _this.activity.loader(false);
                    _this.activity.toggle();
                });
            });
        };

        this.parse = function(data) {
            var lines = data.split(/\r?\n/);
            var items = [];
            var currentGroup = "";
            for (var i = 0; i < lines.length; i++) {
                if (lines[i].indexOf('#EXTINF') === 0) {
                    var title = lines[i].split(',').pop();
                    var url = lines[i+1];
                    if (url && url.indexOf('http') === 0) {
                        items.push({Title: title, Url: url});
                    }
                }
            }
            _this.build(items);
        };

        this.render = function () { return scroll.render(html); };
        this.start = function () { Lampa.Controller.add('content', {toggle: function () { Lampa.Controller.collectionSet(scroll.render()); }}); Lampa.Controller.toggle('content'); };
        this.pause = function () {};
        this.stop = function () {};
        this.destroy = function () { if (epgInterval) clearInterval(epgInterval); };
    }

    function pluginStart() {
        if (window.hack_tv_ready) return;
        window.hack_tv_ready = true;
        UID = getStorage('uid', '');
        if (!UID) {
            UID = Lampa.Utils.uid(10).toUpperCase().replace(/(.{4})/g, '$1-');
            setStorage('uid', UID);
        }
        Lampa.Component.add(plugin.component, pluginPage);
        var menu_item = $('<li class="menu__item selector" data-action="' + plugin.component + '">' +
            '<div class="menu__ico">' + plugin.icon + '</div>' +
            '<div class="menu__text">' + plugin.name + '</div>' +
        '</li>');

        menu_item.on('hover:enter', function () {
            Lampa.Activity.push({
                url: 'https://raw.githubusercontent.com/blackbirdstudiorus/LoganetXIPTV/main/LoganetXA.m3u',
                title: plugin.name,
                component: plugin.component,
                id: 0,
                page: 1
            });
        });
        $('.menu .menu__list').append(menu_item);
        Lampa.Listener.follow('keydown', keydown);
    }

    if (window.appready) pluginStart();
    else Lampa.Listener.follow('app', function (e) { if (e.type == 'ready') pluginStart(); });
})();
