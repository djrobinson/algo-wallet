import React, { Component } from 'react';
import { Col, Row, Button } from 'react-bootstrap';
import numeral from 'numeral';
import openSocket from 'socket.io-client';
import './OrderBook.css';

class OrderBook extends Component {
  state = {
    lowestAsk: null,
    highestBid: null,
    bids: {},
    asks: {},
    poloniexStatus: 'Pending...',
    bittrexStatus: 'Pending...',
    showRetry: false,
    arbitragePercentage: 0
  }

  socket = null;

  componentDidMount() {
    this.startSocket();
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.market !== this.props.market) {
      this.setState({ bids: {}, asks: {}, lowestAsk: null, highestBid: null})
      this.startSocket();
    }
  }

  componentWillUnmount() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  startSocket() {
    const market = this.props.market;
    this.setState({ showRetry: false })
    if (this.socket) {
      console.log("Disconnecting socket first");
      this.socket.emit('end');
    }
    this.setState({
      bittrexStatus: 'Pending...',
      poloniexStatus: 'Pending...',
      arbitragePercentage: 0,
      bids: {},
      asks: {},
      lowestAsk: null,
      highestBid: null
    });

    this.socket = openSocket();

    this.socket.emit('startMarket', { market });

    this.socket.on('orderbook', (message) => {
      let data = JSON.parse(message);
      if (data.type === 'ORDER_BOOK_INIT' && data.market === market) {
        console.log("Order book init: ", data);
        if (data.exchange === 'poloniex') {
          this.setState({
            poloniexStatus: 'Connected'
          });

        }
        if (data.exchange === 'bittrex') {
          this.setState({
            bittrexStatus: 'Connected'
          });
        }
        if (data.lowestAsk) {
          this.setState({
            bids: data.orderBook.bids,
            asks: data.orderBook.asks,
            lowestAsk: data.lowestAsk,
            highestBid: data.highestBid,
            arbitragePercentage: numeral((data.highestBid / data.lowestAsk) - 1).format('0.000%')
          })
        } else {
          this.setState({
            bids: data.orderBook.bids,
            asks: data.orderBook.asks
          });
        }
      } else if (data.type === 'WS_ERROR') {
        if (data.exchange === 'poloniex') {
          this.setState({
            poloniexStatus: 'Websocket failed while getting initial order book. Please retry connection.',
            showRetry: true
          });
        } else if (data.exchange === 'bittrex') {
          this.setState({
            bittrexStatus: 'Websocket failed while getting initial order book. Please retry connection.',
            showRetry: true
          });
        }
      }
    });
  }

  updateOrderBook(event) {
    if (event.type === 'BID_UPDATE') {
      const book = this.state.bids;
      if (!event.amount) {
        if (book[event.rateString]) {
          delete book[event.rateString];
        }
        this.setState({ bids: book })
      } else {
        let order = {
          exchange: event.exchange,
          rate: event.rate,
          amount: event.amount
        };
        book[event.rateString] = order;
        this.setState({ bids: book })

      }
    }
    if (event.type === 'ASK_UPDATE') {
      const book = this.state.asks;
      if (!event.amount) {
        if (book[event.rateString]) {
          delete book[event.rateString];
        }
        this.setState({ asks: book })
      } else {
        let order = {
          exchange: event.exchange,
          rate: event.rate,
          amount: event.amount
        };
        book[event.rateString] = order;
        this.setState({ asks: book })
      }
    }
  }

  render() {
    let isOverlap;
    return (
      <div className="order-book">
        <Row>
          <Col md={4}>
            <h1>{this.props.market} Order Book</h1>
            <h3>Exchange Status</h3>
            <h4>Bittrex: {this.state.bittrexStatus}</h4>
            <h4>Poloniex: {this.state.poloniexStatus}</h4>
            {
              (!!this.state.showRetry) && (
                <Button bsStyle="primary" onClick={this.startSocket.bind(this)}>Retry Connection</Button>
              )
            }
          </Col>
          <Col md={4}>
            <h2>Arbitrage Opportunity</h2>
            <div className={parseFloat(this.state.arbitragePercentage) > 0 ? "positive arb-percent" : "negative arb-percent"}>
              <span>{this.state.arbitragePercentage}</span>
            </div>
          </Col>
          <Col md={4}>
            <h3>Lowest Ask: {this.state.lowestAsk}</h3>
            <h3>Highest Bid: {this.state.highestBid}</h3>
          </Col>
        </Row>
        <Row>
          <Col md={6}>
            <h2>Bids</h2>
            <Row className="title-row">
              <Col md={4}><span>Exchange</span></Col>
              <Col md={4}><span>Order Size</span></Col>
              <Col md={4}><span>Bid Rate</span></Col>
            </Row>

            { (this.state.bids && Object.keys(this.state.bids)[0]) &&
              (Object.keys(this.state.bids).map((bid, i) => {
                const overlapClass = this.state.lowestAsk < this.state.bids[bid].rate ? " overlap" : ""
                if (bid.market === this.market) {
                  return (
                    <Row key={i} className={this.state.bids[bid].exchange + overlapClass + " order-row bid-row"}>
                      <Col md={4}><span className="exchange-name">{this.state.bids[bid].exchange}</span></Col>
                      <Col md={4}><span>{numeral(this.state.bids[bid].amount).format('0.00000000')}</span></Col>
                      <Col md={4}><span>{numeral(this.state.bids[bid].rate).format('0.00000000')}</span></Col>
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
              (!this.state.bids || !Object.keys(this.state.bids)[0]) && <h2>Loading...</h2>
            }
          </Col>
          <Col md={6}>
            <h2>Asks</h2>
            <Row className="title-row">
              <Col md={4}><span>Ask Rate</span></Col>
              <Col md={4}><span>Order Size</span></Col>
              <Col md={4}><span>Exchange</span></Col>
            </Row>
            {
              (this.state.asks && Object.keys(this.state.asks)[0]) &&
              (Object.keys(this.state.asks).map((ask, i) => {
                const overlapClass = this.state.highestBid > this.state.asks[ask].rate ? " overlap" : ""
                isOverlap = overlapClass;
                return (
                  <Row key={i} className={this.state.asks[ask].exchange + overlapClass + " order-row ask-row"}>
                    <Col md={4}><span>{numeral(this.state.asks[ask].rate).format('0.00000000')}</span></Col>
                    <Col md={4}><span>{numeral(this.state.asks[ask].amount).format('0.00000000')}</span></Col>
                    <Col md={4}><span className="exchange-name">{this.state.asks[ask].exchange}</span></Col>
                  </Row>
                );
              }))
            }
            {
              (!this.state.asks || !Object.keys(this.state.asks)[0]) && <h2>Loading...</h2>
            }
          </Col>
        </Row>
      </div>
    );
  }
}

export default OrderBook;