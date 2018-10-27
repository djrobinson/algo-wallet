// const ccxt = require ('ccxt')

// const x = {
//   bittrex: new ccxt.bittrex ({
//     'apiKey': process.env.BITTREX_API_KEY,
//     'secret': process.env.BITTREX_SECRET,
//     'verbose': false, // set to true to see more debugging output
//     'timeout': 60000,
//     'enableRateLimit': true, // add this
//   }),
//   poloniex: new ccxt.poloniex ({
//     'apiKey': process.env.POLONIEX_API_KEY,
//     'secret': process.env.POLONIEX_SECRET,
//     'verbose': false, // set to true to see more debugging output
//     'timeout': 60000,
//     'enableRateLimit': true, // add this
//   })
// }

// const start = async (markets, exchanges) => {
//   let ws = {}

//   const bittrex = new Bittrex()
//   bittrex.initExchange()

//   const poloniex = new Poloniex()
//   poloniex.initExchange()

//   ws['bittrex'] = bittrex
//   ws['poloniex'] = poloniex

//   emitter.on('EXCHANGE_READY', (exchange) => {
//     console.log(exchange, " is connected")
//     newIntervalFlags[exchange] = {}
//     markets.forEach((market) => {
//       newIntervalFlags[exchange] = {}
//       newIntervalFlags[exchange][market] = false
//       ws[exchange].initOrderBook(market)
//     })
//   })

//   if (runType === 'ON_INTERVAL') {
//     setInterval(() => {
//       exchanges.forEach(exch => {
//         markets.forEach(market => {
//           newIntervalFlags[exch][market] = true
//         })
//       })
//     }, intervalSize)
//   }

//   emitter.on('ORDER_BOOK_INIT', (event) => {
//     initializeOrderBooks(event)
//     collectCoins(event.exchange)
//   })

//   emitter.on('MARKET_UPDATE', updatePriceAndRunStrategy)

//   emitter.on('ORDER_DELTA', onOrderDelta)
// }

// const stop = () => {
//   console.log("STOP to be implemented")
// }

