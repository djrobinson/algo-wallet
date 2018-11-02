const checkPriceAndVolume = (type, market, newBook, oldBook) => {
  // Return orderBook summary here. Will be saved periodically
  // Will also be analyzed based on run strategy settings (potentially everyupdate)
  const newKeys = Object.keys(newBook)
  const oldKeys = Object.keys(oldBook)
  const base = market.slice(0,3)

  const oldSummary = masterBook[market].summary
  let summary = {}
  summary.isPriceChange = false

  if (type === 'bids') {
    const newBidString = newKeys[0]
    const oldBidString = oldKeys[0]
    const newBid = newBook[newBidString]
    const oldBid = oldBook[oldBidString]

    if (newBid != oldBid) {
      summary.isPriceChange = true
    }
    summary.highestBid = newBid
    const { volumeAt50Orders, desiredDepthRate, maxAmount, totalBook } = tallyVolumeStats(newBook, newKeys, desiredDepth[base])
    summary.bidVolumeAt50Orders = volumeAt50Orders
    summary.bidDesiredDepth = desiredDepthRate
    summary.largestBid = maxAmount
    summary.totalBids = totalBook
    // Determine time (use Date.now() to group into minute categories)
    // Check against last summary to determine how much it has changed
    // If it is past a certain interval
  }
  if (type === 'asks') {
    const newAskString = newKeys[0]
    const oldAskString = oldKeys[0]
    const newAsk = newBook[newAskString]
    const oldAsk = oldBook[oldAskString]

    if (newAsk != oldAsk) {
      summary.isPriceChange = true
    }
    const { volumeAt50Orders, desiredDepthRate, maxAmount, totalBook } = tallyVolumeStats(newBook, newKeys, desiredDepth[base])
    summary.lowestAsk = newAsk
    summary.askVolumeAt50Orders = volumeAt50Orders
    summary.askDesiredDepth = desiredDepthRate
    summary.largestAsk = maxAmount
    summary.totalAsks = totalBook
  }
  const newSummary = {
    ...oldSummary,
    ...summary
  }
  return newSummary
}

const tallyVolumeStats = (book, newKeys, desiredDepth) => {
  let volumeCounter = 0
  let maxAmount = 0
  let foundOrder = false
  let desiredDepthRate
  let totalBook = 0
  newKeys.forEach((order, i) => {
    if (volumeCounter > desiredDepth && !foundOrder) {
      desiredDepthRate = book[order].rate
      foundOrder = true
      volumeCounter += (book[order].amount * book[order].rate)
    } else if (i < 50) {
      volumeCounter += (book[order].amount * book[order].rate)
    }
    if ( book[order].amount > maxAmount ) {
      maxAmount = book[order].amount
    }
    totalBook += book[order].amount
  })
  return {
    volumeAt50Orders: volumeCounter,
    desiredDepthRate,
    maxAmount,
    totalBook
  }
}