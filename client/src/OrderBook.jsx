import React, { Component } from 'react';
import { Col, Row, Button } from 'react-bootstrap';
import numeral from 'numeral';
import openSocket from 'socket.io-client';
import './OrderBook.css';

class OrderBook extends Component {
  state = {
    prevBids: {},
    prevAsks: {}
  }

  scrollToBottom = () => {
    console.log("scroll bottom")
    this.orderScroll.scrollTop = this.bidAskSpread.offsetTop - 400;
  }

  componentDidMount() {
    this.scrollToBottom()
  }

  maintainOrderBook(
                      book,
                      identifier,
                      exchange,
                      type,
                      market,
                      rate,
                      amount
                    ) {
    let newBook = {}
    let bookKeys = Object.keys(book)
    bookKeys.forEach(o => {
      newBook[o] = book[o]
    })
    if (!amount && book[identifier]) {
      delete newBook[identifier]
      return [newBook, book]
    } else if (book[identifier]) {
      let order = {
        exchange: exchange,
        rate: rate,
        market: market,
        amount: amount
      }
      newBook[identifier] = order
      return [newBook, book]
    } else if (amount > 0) {
      let order = {
        exchange: exchange,
        rate: rate,
        market: market,
        amount: amount
      }
      newBook[identifier] = order
      const sortedKeys = Object.keys(newBook).sort((a, b) => {
        if (type === 'bids') {
          return newBook[b].rate - newBook[a].rate
        }
        if (type === 'asks') {
          return newBook[a].rate - newBook[b].rate
        }
      })
      let sortedNewBook = {}
      sortedKeys.forEach(o => {
        sortedNewBook[o] = newBook[o]
      })
      newBook = sortedNewBook
    }
    let sumAccumulator = 0

    Object.keys(newBook).forEach(o => {
       sumAccumulator = sumAccumulator + newBook[o].amount
       newBook[o].sum = sumAccumulator
    })
    return [newBook, book]
  }

  render() {
    let isOverlap;
    let openRates = []
    if (this.props.openOrders && this.props.openOrders.length) {
      openRates = this.props.openOrders.map(o => o.rate)
    }
    let askKeys
    if (this.props.asks) {
      askKeys = Object.keys(this.props.asks)
      askKeys.reverse()
    }



    return (
      <Row className="order-book">
        <div className="order-book-scroll" ref={(el) => { this.orderScroll = el; }}>
          <div className="ask-book" id="ask-book">

              {
                (this.props.asks && askKeys[0]) &&
                (askKeys.map((ask, i) => {
                  const rate = this.props.asks[ask].rate
                  let isNewOrder = false
                  let isChangeAmount = false
                  if (ask.market === this.market) {
                    if (this.props.prevAsks) {
                      isNewOrder = !this.props.prevAsks[ask]
                      if (!isNewOrder) {
                        isChangeAmount = this.props.prevAsks[ask].amount != this.props.asks[ask].amount
                      }
                    }

                    const changeClass = isChangeAmount ? " amount-change" : ""
                    const newClass = isNewOrder ? " new-order" : ""
                    const openOrderClass = openRates.indexOf(rate) !== -1 ? " active-order" : ""
                    const overlapClass = this.props.highestBid > this.props.asks[ask].rate ? " overlap" : ""
                    isOverlap = overlapClass;
                    const volumeBarStyle = Math.floor(this.props.asks[ask].sum / this.props.summary.totalAsks * 100)
                    return (
                      <Row key={i} className={this.props.asks[ask].exchange + overlapClass + openOrderClass + changeClass + newClass +" order-row ask-row"}>
                        <div className="volume-bar-ask" style={{width: volumeBarStyle + '%'}}>
                        </div>
                        <Col md={4}><span>{numeral(this.props.asks[ask].rate).format('0.0000000')}</span></Col>
                        <Col md={4}><span>{numeral(this.props.asks[ask].amount).format('0.00000')}</span></Col>
                      </Row>
                    );
                  } else {
                    return (
                      null
                    )
                  }
                }))
              }
              {
                (!this.props.asks || !Object.keys(this.props.asks)[0]) && <h2>Loading...</h2>
              }
              <h5>Asks</h5>
          </div>
          <div
            className="bid-ask-spread"
            style={{ clear: "both" }}
            ref={(el) => { this.bidAskSpread = el; }}>
            <h2>{this.props.market}</h2>
          </div>

          <div className="bid-book">
              <h5>Bids</h5>
              { (this.props.bids && Object.keys(this.props.bids)[0]) &&
                (Object.keys(this.props.bids).map((bid, i) => {
                  const rate = this.props.bids[bid].rate
                  let isNewOrder = false
                  let isChangeAmount = false
                  if (bid.market === this.market) {
                    if (this.props.prevBids) {
                      isNewOrder = !this.props.prevBids[bid]
                      if (!isNewOrder) {
                        isChangeAmount = this.props.prevBids[bid].amount != this.props.bids[bid].amount
                      }
                    }

                    const changeClass = isChangeAmount ? " amount-change" : ""
                    const newClass = isNewOrder ? " new-order" : ""
                    const openOrderClass = openRates.indexOf(rate) !== -1 ? " active-order" : ""
                    const overlapClass = this.props.lowestAsk > this.props.bids[bid].rate ? " overlap" : ""
                    isOverlap = overlapClass;
                    const volumeBarStyle = Math.floor(this.props.bids[bid].sum / this.props.summary.totalBids * 100)
                    let test = 24
                    return (
                      <Row key={i} className={this.props.bids[bid].exchange + overlapClass + openOrderClass + changeClass + newClass + openOrderClass + " order-row bid-row"}>
                        <div className="volume-bar-bid" style={{width: volumeBarStyle + '%'}}>
                        </div>
                        <Col md={4}><span>{numeral(this.props.bids[bid].amount).format('0.00000')}</span></Col>
                        <Col md={4}><span>{numeral(this.props.bids[bid].rate).format('0.000000')}</span></Col>
                      </Row>
                    );
                  } else {
                    return (
                      null
                    )
                  }
                }))
              }
              {
                (!this.props.bids || !Object.keys(this.props.bids)[0]) && <h2>Loading...</h2>
              }

          </div>
        </div>

      </Row>
    );
  }
}

export default OrderBook;