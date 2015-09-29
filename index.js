var cheerio = require('cheerio')
var request = require('request')

request = request.defaults({
  jar: false,
  followRedirect: false,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.99 Safari/537.36'
  }
})

var HOST = 'https://www.magiccardmarket.eu'
var reMsgbox = /showMsgBox\(\'(.*)\'\)/

var parseCard = function (html, path) {
  var $ = cheerio.load(html)
  var card = {
    image: HOST + $('#prodImageId').attr('src').substr(1),
    rarity: $('.prodDetails .infoTableSingles tr:nth-of-type(1) td:nth-of-type(2) img').attr('alt').toLowerCase(),
    available: parseInt($('.prodDetails .availTable tbody tr:nth-of-type(1) td:nth-of-type(2)').text(), 10),
    set: decodeURIComponent(path.match(/\/Products\/Singles\/(.*)\//)[1]).replace(/\+/g, ' ').toLowerCase(),
    rulesText: $('.prodDetails .rulesBlock').text(),
    price: {
      from: $('.prodDetails .availTable tbody tr:nth-of-type(2) td:nth-of-type(2)').text(),
      trend: $('.prodDetails .availTable tbody tr:nth-of-type(3) td:nth-of-type(2)').text()
    },
    sellers: []
  }

  $('.specimenTable tbody tr').map(function (i, $seller) {
    var res = {
      name: $('td:nth-of-type(1) span:nth-of-type(1) a', $seller).text(),
      link: HOST + $('td:nth-of-type(1) span:nth-of-type(1) a', $seller).attr('href'),
      itemLocation: $('td:nth-of-type(1) span:nth-of-type(2) span', $seller).attr('onmouseover').match(/location\: (.*)\'/)[1].toLowerCase(),
      language: $('td:nth-of-type(2) span', $seller).attr('onmouseover').match(reMsgbox)[1].toLowerCase(),
      condition: $('td:nth-of-type(3) img', $seller).attr('onmouseover').match(reMsgbox)[1].toLowerCase(),
      comment: $('td.comment-cell', $seller).text(),
      price: {
        value: parseFloat($('td:nth-of-type(10)', $seller).text().match(/(.*) /)[1].replace(',', '.')),
        currency: $('td:nth-of-type(10)', $seller).text().match(/ (.*)/)[1]
      },
      available: { count: 0 },
      tags: []
    }

    // Tags
    $('td:nth-of-type(1) span:nth-of-type(n+3) img', $seller).map(function (i, $tag) {
      res.tags.push($($tag).attr('onmouseover').match(reMsgbox)[1])
    })

    // Seller score
    $('td:nth-of-type(1) span:nth-of-type(1) a', $seller).remove()
    res.score = parseInt($('td:nth-of-type(1) span:nth-of-type(1)', $seller).text().match(/\((\d*)\)/)[1], 10)

    // Foil
    var hasFoil = $('td:nth-of-type(4) img', $seller).length
    if (hasFoil) res.foil = $('td:nth-of-type(4) img', $seller).attr('onmouseover').match(reMsgbox)[1].toLowerCase()

    // Signed
    var hasSigned = $('td:nth-of-type(5) img', $seller).length
    if (hasSigned) res.foil = $('td:nth-of-type(5) img', $seller).attr('onmouseover').match(reMsgbox)[1].toLowerCase()

    // Playset
    var hasPlayset = $('td:nth-of-type(6) img', $seller).length
    if (hasPlayset) res.foil = $('td:nth-of-type(6) img', $seller).attr('onmouseover').match(reMsgbox)[1].toLowerCase()

    // Altered
    var hasAltered = $('td:nth-of-type(7) img', $seller).length
    if (hasAltered) res.foil = $('td:nth-of-type(7) img', $seller).attr('onmouseover').match(reMsgbox)[1].toLowerCase()

    // Available
    var hasAvailableParenthesis = $('td:nth-of-type(11) div', $seller).length

    if (hasAvailableParenthesis) {
      res.available.parenthesis = parseInt($('td:nth-of-type(11) div', $seller).text().match(/\((.*)\)/)[1], 10)
      $('td:nth-of-type(11) div').remove()
    }
    res.available.count = parseInt($('td:nth-of-type(11)', $seller).text(), 10)

    card.sellers.push(res)
  })

  return card
}

var fetchCard = function (url, cb) {
  request(HOST + url, function (err, response) {
    if (err) return cb(err)

    var card = parseCard(response.body, url)
    cb(null, card)
  })
}

var getLinks = function (html) {
  var $ = cheerio.load(html)
  var res = []

  var rows = $('.SearchTable tbody tr')
  rows.map(function (i, $row) {
    var type = $('td:nth-of-type(6)', $row).text().toLowerCase()

    if (type !== 'singles') return

    res.push($('td:nth-of-type(5) a', $row).attr('href'))
  })

  return res
}
var getOneSet = function (response, cb) {
  fetchCard(response.headers.location, function (err, card) {
    if (err) return cb(err)
    var res = {}
    res[card.set] = card
    cb(null, res)
  })
}

module.exports = function (name, cb) {
  request(HOST, {qs: {
    mainPage: 'showSearchResult',
    searchFor: name
  }}, function (err, response) {
    if (err) return cb(err)
    if (!(response.statusCode in {200: 1, 301: 1})) return cb(new Error('wrong statuscode ' + response.statusCode))

    // Single set (is redirected)
    if (response.statusCode === 301) return getOneSet(response, cb)

    // Different sets
    var res = {}
    var links = getLinks(response.body)

    var next = function () {
      var link = links.pop()
      if (!link) return cb(null, res)

      fetchCard(link, function (err, card) {
        if (err) return cb(err)
        res[card.set] = card
        next()
      })
    }
    next()
  })
}
