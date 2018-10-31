const uuidv1 = require('uuid/v1')

/* What exactly should this contain?? Performance? */
class Run {
  id:string
  constructor() {
    this.id = uuidv1()
  }
  updatePriceAndRunStrategy = (event) => {

    const market = event.market
    // var orderUpdateInstance = new OrderUpdate(event)

    // orderUpdateInstance.save((err) => {
    //   if (err) console.log("There was an error saving order instance")
    //   console.log("Save of order update successful")
    // })

    let book = {}
    let type = ''
    let recalculate = false
    if (masterBook.hasOwnProperty(market)) {
      const amount = event.amount
      const rate = event.rate
      const exchange = event.exchange
      const identifier = event.rateString
      if (event.type === 'BID_UPDATE') {
        type = 'bids'
        book = masterBook[market].bids
      }
      if (event.type === 'ASK_UPDATE') {
        type = 'asks'
        book = masterBook[market].asks
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
        masterBook[market].summary = newSummary
        masterBook[market][type] = newBook

        if (recalculate) {
          runStrategy(event)
        }
      }
    }
  }
}