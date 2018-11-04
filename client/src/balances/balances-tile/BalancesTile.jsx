import React, { Component } from 'react';
import { Col, Row } from 'react-bootstrap';
import './BalancesTile.css';

class BalancesTile extends Component {
  state = {
    markets: [],
    showOrderBook: false,
    selectedMarket: ''
  }

  componentDidMount() {

  }

  render() {
    return (
      <div className="balances-tile-container">
        <h1>{this.props.mkt}</h1>
      </div>
    );
  }
}

export default BalancesTile;