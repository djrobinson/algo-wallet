import uuidv1 = require('uuid/v1')


class ExchangeRules {
  id
  constructor() {
    this.id = uuidv1()
  }

  updateRules() {
    // Step 2: Order Sizing
    const bittrexArray = await x['bittrex'].fetchMarkets()
    const poloArray = await x['poloniex'].fetchMarkets()

    const marketArray = bittrexArray.concat(poloArray)
    const marketInfo = marketArray.reduce((acc, market) => {
      acc[market.id] = market
      return acc
    }, {})
    log.bright.blue(marketInfo)
  }

}