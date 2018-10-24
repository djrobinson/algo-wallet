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
    this.orderScroll.scrollTop = this.bidAskSpread.offsetTop - 425;
  }

  componentDidMount() {

  }

  componentDidUpdate() {
    this.scrollToBottom();
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
                    return (
                      <Row key={i} className={this.props.asks[ask].exchange + overlapClass + openOrderClass + changeClass + newClass +" order-row ask-row"}>
                        <Col md={4}><span>{numeral(this.props.asks[ask].rate).format('0.00000000')}</span></Col>
                        <Col md={4}><span>{numeral(this.props.asks[ask].amount).format('0.00000000')}</span></Col>
                        <Col md={4}><span>{numeral(this.props.asks[ask].sum).format('0.00000000')}</span></Col>
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
                    const volumeBarStyle = Math.floor(this.props.bids[bid].amount / this.props.summary.largestBid * 100)
                    let test = 24
                    return (
                      <Row key={i} className={this.props.bids[bid].exchange + overlapClass + openOrderClass + changeClass + newClass + openOrderClass + " order-row bid-row"}>
                        <div className="volume-bar" style={{width: volumeBarStyle + '%'}}>
                        </div>
                        <Col md={4}><span>{numeral(this.props.bids[bid].amount).format('0.00000000')}</span></Col>
                        <Col md={4}><span>{numeral(this.props.bids[bid].rate).format('0.00000000')}</span></Col>
                        <Col md={4}><span>{numeral(this.props.bids[bid].sum).format('0.00000000')}</span></Col>
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