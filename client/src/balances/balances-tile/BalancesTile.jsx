import React, { Component } from 'react';
import { Col, Row } from 'react-bootstrap';
import './BalancesTile.css';

class BalancesTile extends Component {
  render() {
    return (
      <div className="balances-tile-container">
        <h1>{this.props.mkt}</h1>
        <span className="total">{this.props.balances ? this.props.balances.bittrex.total : ''}</span>
        <span className="used">{this.props.balances ? this.props.balances.bittrex.used : ''}</span>
        <span className="free">{this.props.balances ? this.props.balances.bittrex.free : '' }</span>
      </div>
    );
  }
}

export default BalancesTile;