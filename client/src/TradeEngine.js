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
    openOrders: {}
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
    const market = this.props.market;
    if (this.socket) {
      console.log("Disconnecting socket first");
      this.socket.emit('end');
    }

    this.socket = openSocket();

    this.socket.emit('startEngine', {});

    this.socket.on('ENGINE_EVENT', (message) => {
      this.setState({ [message.market]: message})
      console.log("Getting order book init: ", this.state[message.market])
      if (this.state.markets.indexOf(message.market) === -1) {
        this.setState({markets: [...this.state.markets, message.market]})
      }
    });
    this.socket.on('ORDER_ACTION', message => {
      console.log("Order actions", message)
      if (this.state[message.market]) {
        let openOrders = {...this.state.openOrders}
        console.log("What is orders: ",this.state.openOrders[message.market] )
        if (openOrders[message.market] && openOrders[message.market].length) {
          console.log("if")
          openOrders[message.market] = [...this.state.openOrders[message.market], message]
        } else {
          console.log("else")
          openOrders[message.market] = [message]
        }
        this.setState({ openOrders })
      } else {
        let openOrders = {...this.state.openOrders}
        openOrders[message.market] = [message]
        this.setState({ openOrders })
      }
      console.log("Handling order actions: ", this.state.openOrders)
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
      <div className="order-book">
        <Row>
          <Button onClick={this.startSocket}>Start The Trades!</Button>
          <Button onClick={this.stopSocket}>Stop The Trades</Button>
        </Row>
        <Row className="order-action-row">
          {
            this.state.orders.map((order, i) => {
              return (
                <div key={i} className="order-action-tile">
                  <p>Order {order.market}</p>
                  <p>Rate: {order.rate}</p>
                </div>
              )
            })
          }
        </Row>

        <Row>
          {
            this.state.markets.map((market) => {
              return (
                <Col md={4} key={market}>
                  <OrderBook
                    market={market}
                    bids={this.state[market].bids}
                    asks={this.state[market].asks}
                  />
                </Col>
              )
            })
          }
        </Row>
      </div>
    );
  }
}

export default TradeEngine;