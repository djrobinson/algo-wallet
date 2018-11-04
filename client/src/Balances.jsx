import React, { Component } from 'react';
import { Col, Row } from 'react-bootstrap';
import OrderBook from './OrderBook';
import './Balances.css';

class Balances extends Component {
  state = {
    markets: [],
    showOrderBook: false,
    selectedMarket: ''
  }

  componentDidMount() {
    fetch('/api/getBalances')
      .then(res => res.json())
      .then(data => {
        console.log("What is data from balances: ", data)
      });
  }

  render() {
    return (
      <div className="balances-container">
      </div>
    );
  }
}

export default Balances;