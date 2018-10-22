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

  componentDidMount() {
    console.log("This.props: ", this.props)
  }

  render() {
    let isOverlap;
    let openRates = []
    if (this.props.openOrders && this.props.openOrders.length) {
      openRates = this.props.openOrders.map(o => o.rate)
    }

    return (
      <div className="order-book">
        <Row>
          <Col md={12}>
            <h1>{this.props.market} Order Book</h1>
            <p>openRates: {openRates.map(r => r)}</p>
          </Col>
        </Row>
        <Row>
          <Col md={6}>
            <h5>Bids</h5>

            <Row className="title-row">

              <Col md={6}><span>Order Size</span></Col>
              <Col md={6}><span>Bid Rate</span></Col>
            </Row>

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
                  return (
                    <Row key={i} className={this.props.bids[bid].exchange + overlapClass + openOrderClass + changeClass + newClass + openOrderClass + " order-row bid-row"}>
                      <Col md={6}><span>{numeral(this.props.bids[bid].amount).format('0.00000000')}</span></Col>
                      <Col md={6}><span>{numeral(this.props.bids[bid].rate).format('0.00000000')}</span></Col>
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
          </Col>
          <Col md={6}>
            <h5>Asks</h5>
            <Row className="title-row">
              <Col md={6}><span>Rate</span></Col>
              <Col md={6}><span>Order Size</span></Col>
            </Row>
            {
              (this.props.asks && Object.keys(this.props.asks)[0]) &&
              (Object.keys(this.props.asks).map((ask, i) => {
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
                      <Col md={6}><span>{numeral(this.props.asks[ask].rate).format('0.00000000')}</span></Col>
                      <Col md={6}><span>{numeral(this.props.asks[ask].amount).format('0.00000000')}</span></Col>
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
          </Col>
        </Row>
      </div>
    );
  }
}

export default OrderBook;