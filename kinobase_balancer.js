const cheerio = require('cheerio');
const network = new Lampa.Request();

const KinobaseBalancer = {
  // Функция поиска
  search: function(params, oncomplite, onerror) {
    const query = params.query;
    const url = `https://kinobase.org/search?query=${encodeURIComponent(query)}`;
    network.silent(url, (html) => {
      const $ = cheerio.load(html);
      const results = [];
      $('.search-item').each((index, element) => {
        const title = $(element).find('.title').text();
        const link = $(element).find('a').attr('href');
        results.push({
          title: title,
          url: link,
          type: $(element).hasClass('series') ? 'series' : 'movie'
        });
      });
      oncomplite(results);
    }, (error) => {
      onerror(error);
    });
  },

  // Функция получения потока
  getStream: function(params, oncomplite, onerror) {
    const url = params.url;
    network.silent(url, (html) => {
      const $ = cheerio.load(html);
      const iframeSrc = $('.player iframe').attr('src');
      if (iframeSrc) {
        network.silent(iframeSrc, (playerHtml) => {
          const $player = cheerio.load(playerHtml);
          const stream = $player('video source').attr('src') || extractFromScript(playerHtml);
          oncomplite([{ url: stream, quality: 'HD' }]);
        }, onerror);
      } else {
        const directStream = $('.video-link').attr('href');
        oncomplite([{ url: directStream, quality: 'HD' }]);
      }
    }, onerror);
  },

  // Информация о модуле
  info: {
    uniqueId: 'kinobase_balancer',
    name: 'Kinobase',
    author: 'Your Name'
  }
};

// Экспорт модуля
this.source = KinobaseBalancer;
