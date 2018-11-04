import React, { Component } from 'react';
import { Col, Row, Button } from 'react-bootstrap';
import numeral from 'numeral';
import openSocket from 'socket.io-client';
import OrderBook from './OrderBook';
import './TradeEngine.css';

class TradeEngine extends Component {
  constructor() {
    super()
    this.stopSocket = this.stopSocket.bind(this)
    this.startSocket = this.startSocket.bind(this)
  }
  state = {
    markets: [],
    orders: [],
    openOrders: {},
  }

  socket = null;

  componentDidMount() {

  }

  componentDidUpdate(prevProps, prevState) {

  }

  componentWillUnmount() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  startSocket() {

    if (this.socket) {
      console.log("Disconnecting socket first");
      this.socket.emit('end');
    }

    this.socket = openSocket();

    this.socket.emit('startEngine', {});

    this.socket.on('MARKET_UPDATE', (message) => {
      console.log(message)
    });
    this.socket.on('ORDER_BOOK_INIT', (message) => {
      console.log(message)
    });
    this.socket.on('ORDER_ACTION', message => {

      if (this.state[message.market]) {
        let openOrders = {...this.state.openOrders}
        if (openOrders[message.market] && openOrders[message.market].length) {
          if (message.type === 'CANCEL') {
            openOrders[message.market] = this.state.openOrders[message.market].filter(o => (o.orderUuid !== message.orderUuid))
          }
          if (message.type === 'OPEN') {
            openOrders[message.market] = [...this.state.openOrders[message.market], message]
          }
        } else {
          if (message.type === 'OPEN') {
            openOrders[message.market] = [message]
          }
        }
        this.setState({ openOrders })
      } else {
        if (message.type === 'OPEN') {
          let openOrders = {...this.state.openOrders}
          openOrders[message.market] = [message]
          this.setState({ openOrders })
        }
      }
      this.setState({orders: [...this.state.orders, message]})
    })
  }

  stopSocket() {
    if (this.socket) {
      this.socket.emit('stopEngine', {})
    }

  }

  render() {
    let isOverlap;
    return (
      <div>
        <Row>
          <Button onClick={this.startSocket}>Start The Trades!</Button>
        </Row>


        <Row>
          {
            this.state.markets.map((market) => {
              return (
                <Col md={3} key={market}>
                  <OrderBook
                    market={market}
                    bids={this.state[market].bids}
                    asks={this.state[market].asks}
                    summary={this.state[market].summary}
                    prevBids={this.state[market].prevBids}
                    prevAsks={this.state[market].prevAsks}
                    openOrders={this.state.openOrders[market]}
                  />
                </Col>
              )
            })
          }
          <Col md={3} className="order-action-column">
            {
              this.state.orders.map((order, i) => {
                return (
                  <div key={i} className="order-action-tile">
                    <p>Exchange: {order.exchange} | Order: {order.market} | Type: {order.type} | Rate: {order.rate}</p>
                  </div>
                )
              })
            }
          </Col>
        </Row>
      </div>
    );
  }
}

export default TradeEngine;