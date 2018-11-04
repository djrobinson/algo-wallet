import React, { Component } from 'react'
import { Col, Row } from 'react-bootstrap'
import BalanceTile from './balances-tile/BalancesTile'
import './Balances.css';

class Balances extends Component {
  state = {
    exchanges: [],
    markets: [],
    balances: {}
  }

  componentDidMount() {
    fetch('/api/getBalances')
      .then(res => res.json())
      .then(data => {
        this.setState({
          markets: data.markets,
          exchanges: data.exchanges,
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
              return <BalanceTile
                        key={mkt}
                        mkt={mkt}
                        exchanges={this.state.exchanges}
                        balances={this.state.balances[mkt]}
                      />
            })
          )
        }
      </div>
    );
  }
}

export default Balances;