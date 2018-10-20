import React, { Component } from 'react';
import { Col, Row } from 'react-bootstrap';
import OrderBook from './OrderBook';
import TradeEngine from './TradeEngine';
import './App.css';

class App extends Component {
  state = {
    markets: [],
    showOrderBook: false,
    selectedMarket: ''
  }

  componentDidMount() {
    fetch('/test')
      .then(res => res.json())
      .then(data => {
        this.setState({ test: data.test })
      });
  }

  render() {
    return (
      <div className="App">
        <Row className="header-row">
          <div className="header">
            <h1>ALGOWALLET</h1>
          </div>
        </Row>
        <TradeEngine />
      </div>
    );
  }
}

export default App;