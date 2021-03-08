import React from 'react';
// import ReactDOM from 'react-dom';
import 'bootstrap/dist/css/bootstrap.css';
import Button from 'react-bootstrap/Button';
// import Form from 'react-bootstrap/Form';
// import FormControl from 'react-bootstrap/FormControl';
// import Table from 'react-bootstrap/Table';
import Card from 'react-bootstrap/Card';
import CardDeck from 'react-bootstrap/CardDeck';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
// import InputGroup from 'react-bootstrap/InputGroup';
// import logo from './logo.svg';
// import './App.css';
import getWeb3 from "./getWeb3";

import CouponContract from "./build/contracts/Coupon.json";

class App extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      nCoupons: 0,
      web3: null,
      eventHistory: [],
      myCoupons: [],
      myAccount: null
    }
  }

  componentDidMount() {
    // Get network provider and web3 instance.
    // See utils/getWeb3 for more info.

    getWeb3
      .then(results => {
        this.setState({
          web3: results.web3,
          accounts: results.accounts,
          network: results.network,
        })

        // Instantiate contract once web3 provided.
        this.instantiateContract()
      })
      .catch((error) => {
        console.log(error)
        alert(error.message)
      })
  }

  async instantiateContract() {
    const contract = require('@truffle/contract')
    const coupon = contract(CouponContract)
    coupon.setProvider(this.state.web3.currentProvider)

    // Declaring this for later so we can chain functions on coupon.
    // var couponInstance
    let myAccount = this.state.accounts[0]
    this.setState({ myAccount: myAccount })
    console.log(`myAccount: ${this.state.myAccount}`)

    let instance = await coupon.deployed()
    this.setState({ couponInstance: instance })
    // let totalSupply = await instance.totalSupply()
    // console.log(`totalSupply(): ${totalSupply.toNumber()}`)

    // let nCoupons = await instance.balanceOf(this.state.myAccount)
    // this.setState({ nCoupons: nCoupons.toNumber() })
    // console.log(`balanceOf(${this.state.myAccount}): ${nCoupons.toNumber()}`)

    let myCoupons = []
    let x = await instance.getMyCoupons({ from: this.state.myAccount });
    myCoupons = x.map(c => {
      let coupon = {}
      coupon.tokenId = c.tokenId
      coupon.description = c.description
      coupon.value = c.value
      coupon.expiryDate = c.expiryDate
      coupon.redeemed = c.redeemed
      return coupon
    })
    console.log(`myCoupons: ${myCoupons}`)
    this.setState({ myCoupons: myCoupons })

    console.log(`nCoupons: ${this.nCoupons()}`)
    this.setState({ nCoupons: this.nCoupons() })
  }

  nCoupons = () => {
    let nCoupons = 0
    for (let c of this.state.myCoupons) {
      if (!c.redeemed) nCoupons++
    }
    return nCoupons
  }

  redeem = async (tokenId) => {
    await this.state.couponInstance.redeem(tokenId, { from: this.state.myAccount })
    let updatedCoupons = [...this.state.myCoupons]
    let coupon2Update = updatedCoupons[tokenId - 1]
    coupon2Update.redeemed = true
    updatedCoupons[tokenId - 1] = coupon2Update
    this.setState({ myCoupons: updatedCoupons })

    this.setState({ nCoupons: this.nCoupons() })

    alert('Coupon redeemed.')
  }

  // updateEventHistory = async () => {
  //   this.state.couponInstance.getPastEvents('ValueChanged', { fromBlock: 0, toBlock: 'latest' }).then(events => {
  //     console.log(JSON.stringify(events))
  //     let history = events.map(e => {
  //       return ({
  //         transactionHash: e.transactionHash,
  //         oldValue: e.returnValues.oldValue,
  //         newValue: e.returnValues.newValue
  //       })
  //     })
  //     this.setState({ eventHistory: history })
  //   })
  // }

  render() {
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    return (
      <Container>
        <Row className="d-flex justify-content-center">
          <h1>Coupons</h1>
        </Row>

        <Row className="d-flex justify-content-center">
          <Provider network={this.state.network} />
        </Row>

        <Row className="d-flex justify-content-center" >
          <p>You have: <span className="h3 text-success font-weight-bolder">{this.state.nCoupons}</span> unused coupon(s)</p>
        </Row>

        <Row className="d-flex justify-content-center" >
          <CouponSelector myCoupons={this.state.myCoupons} redeem={this.redeem} />
        </Row>
      </Container >
    );
  }
}

// class EventHistory extends React.Component {
//   render() {
//     if (this.props.events.length === 0) {
//       return < div ></div >
//     }
//     // let listItems = this.props.events.map((e) => <li key={e.transactionHash}>Value: {e.newValue} (was {e.oldValue})</li>)
//     // return <ol>{listItems}</ol>
//     let listItems = this.props.events.map((e) =>
//       <tr key={e.transactionHash}>
//         {/* <td>{e.transactionHash}</td> */}
//         <td className="text-success">{e.newValue}</td>
//         <td>{e.oldValue}</td>
//       </tr>
//     )
//     return (
//       <div >
//         <div className="d-flex justify-content-center">Transaction History</div>
//         {/* <div className="d-flex justify-content-center table-wrapper-scroll-y my-custom-scrollbar"> */}
//         <div className="d-flex justify-content-center">
//           <Table striped bordered hover size="sm">
//             <thead>
//               <tr>
//                 {/* <th>Hash</th> */}
//                 <th className="bg-success text-white col-auto">New Value</th>
//                 <th className="col-auto">Old Value</th>
//               </tr>
//             </thead>
//             <tbody>
//               {listItems}
//             </tbody>
//           </Table>
//         </div>
//       </div>
//     )
//   }
// }

class Provider extends React.Component {
  render() {
    return (
      <div>
        <h6>Connected to network: <code>{this.props.network.name}</code></h6>
      </div >
    )
  }
}

class CouponSelector extends React.Component {
  render() {
    let couponItems = this.props.myCoupons.map(c =>
      < div key={c.tokenId} className="col-xl-3 col-lg-4 col-md-6" >
        <Card key={c.tokenId} style={{ width: '18rem' }} bg={c.redeemed ? "black" : "light"}>
          <Card.Body>
            <Card.Title>${c.value}</Card.Title>
            <Card.Subtitle className="mb-2 text-muted">Expiry Date: {c.expiryDate}</Card.Subtitle>
            <Card.Text>{c.description}</Card.Text>
            {
              c.redeemed ?
                <Card.Text className="font-weight-bold">
                  Redemmed
                </Card.Text>
                :
                <Button className variant="primary" disabled={c.redeemed} onClick={(e) => {
                  e.preventDefault()
                  this.props.redeem(c.tokenId)
                }}>Redeem</Button>
            }
          </Card.Body>
        </Card>
      </div >
    )
    return (
      <CardDeck>
        {couponItems}
      </CardDeck >
    )
  }
}

/*
function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}
*/
export default App;
