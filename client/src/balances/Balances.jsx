import React, { Component } from 'react'
import { Col, Row } from 'react-bootstrap'
import BalanceTile from './balances-tile/BalancesTile'
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
        this.setState({
          markets: data.markets,
          balances: data
        })
        console.log("What is data from balances: ", data)
      });
  }

  render() {
    return (
      <div className="balances-row">
        {
          (this.state.markets.length) && (
            this.state.markets.map(mkt => {
              return (
                <BalanceTile
                  mkt={mkt}
                  />
                )
            })
          )
        }
      </div>
    );
  }
}

export default Balances;