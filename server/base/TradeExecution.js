
const createOrder = async (exchange, symbol, orderType, side, amount, price) => {
  try {
    log.bright.yellow("Order: ", symbol, side, price, amount)
    const response = await x[exchange].createOrder (symbol, orderType, side, amount, price)
    log.bright.magenta ('Create Order Succeeded: ', exchange, symbol, side, amount)
    return response
  } catch (e) {
    log.bright.magenta (symbol, side, x[exchange].iso8601 (Date.now ()), e.constructor.name, e.message)
    log.bright.magenta ('Failed')
  }
}

const cancelOrder = async (order) => {
  const exchange = order.exchange
  const id = order.id
  if (pendingCancels.indexOf(id) === -1) {
    console.log("What is ID for cancel ", id)
    pendingCancels.push(id)
    try {
      const response = await x[exchange].cancelOrder(id)
      log.bright.magenta (response)
      if (response) {
        const cancelIndex = pendingCancels.indexOf(id)
        pendingCancels.splice(cancelIndex, 1)
      }

    } catch (e) {
      log.bright.magenta ('Cancel Failed', e, order)
    }
  } else {
    console.log("Dupe cancel prevented")
  }
}