// TODO: Will end up using some lessons from this strategy to break it up &
// make  more generic, something like "MultiPhaseTrade"
// and "MarketOrderExecution". This will differ from what's in trade engine
// since it will be more focused on precise execution against open orders
// as opposed to setting fixed single limit orders. Will investigate to see if
// exchange apis allow for precise market orders, but I don't want to
// count on it since tri arb will require very specific rates and amts to be
// profitable and we can't count on them being there after a few milliseconds

const triangularArbitrage = (market) => {
  let ALT
  if (market === 'BTC-ETH') {
    ALT = ''
  } else {
    if (market.indexOf('BTC-') > -1) {
      ALT = market.replace('BTC-', '')
    }
    if (market.indexOf('ETH-') > -1) {
      ALT = market.replace('ETH-', '')
    }
  }

  const bidsArray = Object.keys(masterBook[market].bids)
  const asksArray = Object.keys(masterBook[market].asks)

  if (market === `BTC-${ALT}`) {
    AltToBtc[ALT] = {
      bid: {},
      ask: {}
    }
    AltToBtc[ALT].bid = masterBook[market].bids[bidsArray[0]],
    AltToBtc[ALT].ask = masterBook[market].asks[asksArray[0]]
  }

  if (market === 'BTC-ETH') {
    BtcToEth.bid = masterBook[market].bids[bidsArray[0]],
    BtcToEth.ask = masterBook[market].asks[asksArray[0]]
  }

  if (market === `ETH-${ALT}`) {
    AltToEth[ALT] = {
      bid: {},
      ask: {}
    }
    AltToEth[ALT].bid = masterBook[market].bids[bidsArray[0]],
    AltToEth[ALT].ask = masterBook[market].asks[asksArray[0]]
  }
  if (BtcToEth.hasOwnProperty('bid') && AltToBtc[ALT] && AltToEth[ALT] && AltToBtc[ALT].hasOwnProperty('bid') && AltToEth[ALT].hasOwnProperty('bid')) {

    // ALT => BTC => ETH
    // Synthetic AltToEth.bid
    const synthAltToEth = AltToBtc[ALT].bid.rate / BtcToEth.ask.rate
    // ALT => ETH => BTC
    // Synthetic AltToBtc.bid
    const synthAltToBtc = AltToEth[ALT].bid.rate * BtcToEth.bid.rate
    // ETH => BTC => ALT
    // Synthetic 1 / AltToEth.ask
    const synthBtcToAlt = 1 / BtcToEth.ask.rate / AltToEth[ALT].ask.rate
    // BTC => ETH => ALT
    // Synthetic 1 / AltToBtc.ask
    const synthEthToAlt = BtcToEth.bid.rate / AltToBtc[ALT].ask.rate


    const altToEthProfit = ( synthAltToEth - AltToEth[ALT].bid.rate ) / AltToEth[ALT].bid.rate * 100 - 0.25
    const altToBtcProfit = ( synthAltToBtc - AltToBtc[ALT].bid.rate ) / AltToBtc[ALT].bid.rate * 100 - 0.25
    const btcToAltProfit = ( synthBtcToAlt -  1 / AltToBtc[ALT].ask.rate) / AltToBtc[ALT].ask.rate * 100 - 0.25
    const ethToAltProfit = ( synthEthToAlt - 1 / AltToEth[ALT].ask.rate) / AltToEth[ALT].ask.rate * 100 - 0.25


    if (altToEthProfit > 0) {
      // Synthetic ALT-BTC
      marketStuff(AltToBtc[ALT].bid.amount, AltToBtc[ALT].bid.rate, BtcToEth.ask.rate, 'sell', 'buy', ALT + '/BTC', 'ETH/BTC', ALT, AltToBtc[ALT].ask.rate)
    }

    if (altToBtcProfit > 0) {
      // Synthetic ALT-ETH
      marketStuff(AltToBtc[ALT].bid.amount, AltToEth[ALT].bid.rate, BtcToEth.bid.rate, 'sell', 'sell', ALT + '/ETH', 'ETH/BTC', ALT, AltToBtc[ALT].ask.rate)
    }

    if (btcToAltProfit > 0) {
      // Synthetic BTC-ALT
      marketStuff(BtcToEth.ask.amount, BtcToEth.ask.rate, AltToEth[ALT].ask.rate, 'buy', 'buy', 'ETH/BTC', ALT + '/ETH', 'BTC', AltToBtc[ALT].ask.rate)
    }

    if (ethToAltProfit > 0) {
      // Synthetic ETH-ALT
      marketStuff(BtcToEth.bid.amount, BtcToEth.bid.rate, AltToBtc[ALT].ask.rate, 'sell', 'buy', 'ETH/BTC', ALT + '/BTC', 'ETH', AltToBtc[ALT].ask.rate)
    }
  }

}

module.exports = {startHerUp}