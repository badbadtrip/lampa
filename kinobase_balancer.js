(function () {
    'use strict';

    /**
     * Функция для получения адреса зеркала Kinobase.
     * Если пользователь не указал своё зеркало в настройках, используется значение по умолчанию.
     */
    function kinobaseMirror() {
        var url = Lampa.Storage.get('online_mod_kinobase_mirror', '') + '';
        if (!url) return 'https://kinobase.org';
        if (url.indexOf('://') === -1) url = 'https://' + url;
        if (url.charAt(url.length - 1) === '/') url = url.substring(0, url.length - 1);
        return url;
    }

    /**
     * Плагин для просмотра фильмов с Kinobase.
     * @param {Object} component – компонент Lampa, через который выводятся результаты и запускается плеер.
     * @param {Object} object – объект с информацией о фильме (название, идентификаторы и т.д.).
     */
    function KinobasePlugin(component, object) {
        var network = new Lampa.Reguest();
        var mirror = kinobaseMirror();
        var select_title = object.search || object.movie.title;

        /**
         * Начало поиска фильма по названию.
         * Формируется URL поиска на Kinobase и выполняется запрос.
         */
        this.search = function (_object, kinopoisk_id) {
            object = _object;
            select_title = object.search || object.movie.title;
            var searchUrl = mirror + '/search/?q=' + encodeURIComponent(select_title);

            component.loading(true);

            network.clear();
            network.timeout(10000);
            network.native(searchUrl, function (html) {
                // Парсим полученный HTML для извлечения ссылок на найденные фильмы.
                var parser = new DOMParser();
                var doc = parser.parseFromString(html, 'text/html');
                // Предположим, что каждый фильм представлен в карточке с классом "movie-card"
                var items = doc.querySelectorAll('.movie-card a');
                if (items && items.length) {
                    // Выбираем первый найденный элемент
                    var linkElem = items[0];
                    var link = linkElem.getAttribute('href');
                    if (link.indexOf('http') !== 0) {
                        link = mirror + link;
                    }
                    // Переходим к получению страницы фильма и извлечению ссылок на видео
                    getMoviePage(link);
                } else {
                    component.emptyForQuery(select_title);
                }
            }, function () {
                component.emptyForQuery(select_title);
            });
        };

        /**
         * Получение страницы фильма по URL и извлечение ссылки на потоковое видео.
         * Здесь в простейшем варианте ищется тег <source src="...">.
         * В реальной интеграции можно добавить более сложный парсинг (например, разбор JSON или m3u8-плейлиста).
         * @param {String} movieUrl – URL страницы с фильмом.
         */
        function getMoviePage(movieUrl) {
            network.clear();
            network.timeout(10000);
            network.native(movieUrl, function (html) {
                // Пробуем найти ссылку на поток через тег <source>
                var match = html.match(/<source\s+src="([^"]+)"/i);
                if (match && match[1]) {
                    var streamUrl = match[1];
                    // Формируем объект для воспроизведения
                    var item = {
                        url: streamUrl,
                        quality: 'default',
                        title: object.movie.title
                    };
                    component.play(item);
                } else {
                    component.emptyForQuery(object.movie.title);
                }
            }, function () {
                component.emptyForQuery(object.movie.title);
            });
        }

        this.destroy = function () {
            network.clear();
        };
    }

    /**
     * Регистрируем плагин в Lampa.
     * Если функция регистрации существует (например, Lampa.addPlugin), плагин добавляется напрямую,
     * иначе экспортируем его в глобальное пространство.
     */
    if (typeof Lampa !== 'undefined' && Lampa.addPlugin) {
        Lampa.addPlugin('kinobase', KinobasePlugin);
    } else {
        window.KinobasePlugin = KinobasePlugin;
    }
})();
