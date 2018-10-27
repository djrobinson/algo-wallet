  // Step 1: Fund Management
  const openBalances = await Promise.all(exchanges.map(async (exch) => {
    const balances = await getBalances(exch)
    currentBalances[exch] = balances
    // Standardize balances
    openOrders[exch] = []
    return {
      exch,
      balances
    }
  }))

  openBalances.forEach(bals => {
    console.log('What bals: ', bals)
    Object.keys(bals.balances).forEach(bal => {
      if ( bals.balances[bal].free > 0 ) {
        looseChange.push({
          exchange: bals.exch,
          coin: bal,
          amount: bals.balances[bal].free
        })
      }
    })
  })

  console.log("What is loose change: ", looseChange)

  // Step 2: Order Sizing
  const bittrexArray = await x['bittrex'].fetchMarkets()
  const poloArray = await x['poloniex'].fetchMarkets()

  const marketArray = bittrexArray.concat(poloArray)
  marketInfo = marketArray.reduce((acc, market) => {
    acc[market.id] = market
    return acc
  }, {})
  log.bright.blue(marketInfo)