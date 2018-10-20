import React, { Component } from 'react';
import { Col, Row, Button } from 'react-bootstrap';
import numeral from 'numeral';
import openSocket from 'socket.io-client';
import './TradeEngine.css';

class TradeEngine extends Component {
  constructor() {
    super()
    this.stopSocket = this.stopSocket.bind(this)
    this.startSocket = this.startSocket.bind(this)
  }
  state = {
    markets: {},
    orders: {},
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
        console.log("Engine event: ", message);
    });
  }

  stopSocket() {
    this.socket.emit('stopEngine', {});
  }

  render() {
    let isOverlap;
    return (
      <div className="order-book">
        <Row>
          <h1>TradeEngine Here!</h1>
        </Row>
        <Row>

          <Button onClick={this.startSocket}>Start The Trades!</Button>
          <Button onClick={this.stopSocket}>Stop The Trades</Button>
        </Row>
      </div>
    );
  }
}

export default TradeEngine;