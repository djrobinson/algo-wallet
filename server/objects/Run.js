const uuidv1 = require('uuid/v1')

/*
  Will be the strategy execution itself as well as the data model for all things
  strategy performance
 */
class Run {
  id
  runType = ''
  constructor() {
    this.id = uuidv1()
  }
  updatePriceAndRunStrategy = (startBook, event) => {

    const market = event.market
    // var orderUpdateInstance = new OrderUpdate(event)

    // orderUpdateInstance.save((err) => {
    //   if (err) console.log("There was an error saving order instance")
    //   console.log("Save of order update successful")
    // })

    let book = {}
    let type = ''
    let recalculate = false
    if (startBook.hasOwnProperty(market)) {
      const amount = event.amount
      const rate = event.rate
      const exchange = event.exchange
      const identifier = event.rateString
      if (event.type === 'BID_UPDATE') {
        type = 'bids'
        book = startBook[market].bids
      }
      if (event.type === 'ASK_UPDATE') {
        type = 'asks'
        book = startBook[market].asks
      }
      if (book) {
        let newBook, oldBook
        [newBook, oldBook] = maintainOrderBook(book, identifier, exchange, type, market, rate, amount)
        const newSummary = checkPriceAndVolume(type, market, newBook, oldBook)
        const isPriceChange = newSummary.isPriceChange

        if (runType === 'ON_PRICE_CHANGE' && isPriceChange) {
          console.log("PRICE CHANGE")
          recalculate = true
        }
        if (runType === 'ON_MARKET_CHANGE') {
          recalculate = true
        }
        if (runType === 'ON_INTERVAL' && newIntervalFlags[exchange][market]) {
          console.log("New interval!!")
          recalculate = true
          newIntervalFlags[exchange][market] = false
        }
        startBook[market].summary = newSummary
        startBook[market][type] = newBook

        if (recalculate) {
          runStrategy(event)
        }
      }
    }
  }
}