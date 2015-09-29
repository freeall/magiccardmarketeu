# magiccardmarketeu

Fetch card details from http://magiccardmarket.eu.

It only takes `Singles` cards. If the card is in different sets, it will load it from all sets.

```
npm install magiccardmarketeu --save
```

## Usage

``` js
var magiccardmarketeu = require('magiccardmarketeu')

magiccardmarketeu('Birds of Paradise', function (err, card) {
  console.log(card)
  /*
    {
      "fourth edition: alternate": {
        "image": "https://www.magiccardmarket.eu/img/9d477b691cc90a71867c0b63cdc8fb22/cards/Fourth_Edition_Alternate/birds_of_paradise.jpg",
        "rarity": "rare",
        "available": 2,
        "set": "fourth edition: alternate",
        "rulesText": "Flying\n\n{T}: Add one mana of any color to your mana pool.",
        "price": {
          "from": "69,95 €",
          "trend": "75,00 €"
        },
        "sellers": [
          {
            "name": "Raphygames",
            "link": "https://www.magiccardmarket.eu/Users/Raphygames",
            "itemLocation": "france",
            "language": "english",
            "condition": "played",
            "comment": "",
            "price": {
              "value": 55,
              "currency": "€"
            },
            "available": {
              "count": 1,
              "parenthesis": 3
            },
            "tags": [
              "Outstanding seller"
            ],
            "score": "648"
          },
          ...
        }
      },
      "fourth edition: black bordered": { ... },
      ...
    }
  /*
})
```

## License

MIT