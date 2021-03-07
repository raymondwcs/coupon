import React from 'react';
// import ReactDOM from 'react-dom';
import 'bootstrap/dist/css/bootstrap.css';
import Button from 'react-bootstrap/Button';
// import Form from 'react-bootstrap/Form';
// import FormControl from 'react-bootstrap/FormControl';
// import Table from 'react-bootstrap/Table';
import Card from 'react-bootstrap/Card';
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
      myCoupons: []
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
    // let myAccount = this.state.accounts[0]
    // console.log(`myAccount: ${myAccount}`)

    let instance = await coupon.deployed()
    this.setState({ couponInstance: instance })
    // let totalSupply = await instance.totalSupply()
    // console.log(`totalSupply(): ${totalSupply.toNumber()}`)

    // let nCoupons = await instance.balanceOf(myAccount)
    // this.setState({ nCoupons: nCoupons.toNumber() })
    // console.log(`balanceOf(${myAccount}): ${nCoupons.toNumber()}`)

    let myCoupons = []
    myCoupons = await instance.getMyCoupons();
    // for (let i = 0; i < totalSupply.toNumber(); i++) {
    //   let tokenId = await instance.tokenByIndex(i)
    //   console.log(`tokenByIndex(${i}): ${tokenId}`)
    //   let owner = await instance.ownerOf(tokenId)
    //   console.log(`owner(${tokenId}): ${owner}`)
    //   if (owner.toString() === myAccount.toString()) {
    //     let c = {}
    //     c.tokenId = tokenId.toNumber()

    //     let details = await instance.coupons(tokenId)
    //     c.value = details.value.toNumber()
    //     c.expiryDate = details.expiryDate.toString()
    //     // console.log(`redeemed: ${details.redeemed}`)
    //     c.redeemed = (details.redeemed.toString() === "false") ? false : true
    //     myCoupons.push(c)
    //   }
    // }
    this.setState({ myCoupons: myCoupons })
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
      <div className="App container">
        <h1 className="d-flex justify-content-center">Coupons</h1>
        <Provider network={this.state.network} />

        <div className="d-flex justify-content-center">
          <p>You have: <span className="h3 text-success font-weight-bolder">{this.props.nCoupons}</span> coupon(s)</p>
        </div>

        <div className="row">
          <div className="col-md-3"></div>
          <div className="col-md-6">
            <CouponSelector myCoupons={this.state.myCoupons} couponValue={this.state.couponValue} couponExpiryDate={this.state.couponExpiryDate} />
          </div>
          <div className="col-md-3"></div>
        </div>
        <br></br>
        {/* <div className="row">
          <div className="col-md-3"></div>
          <div className="col-md-6">
            <EventHistory events={this.state.eventHistory} />
          </div>
          <div className="col-md-3"></div>
        </div> */}
      </div>

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
      <div className="d-flex justify-content-center">
        <h6>Connected to network: <code>{this.props.network.name}</code></h6>
      </div >
    )
  }
}

class CouponSelector extends React.Component {
  redeem = async (tokenId) => {
    alert('Under construction!')
  }

  render() {
    let couponItems = this.props.myCoupons.map(c =>
      <Card key={c.tokenId} style={{ width: '18rem' }}>
        <Card.Body>
          <Card.Title>${c.value}</Card.Title>
          <Card.Subtitle className="mb-2 text-muted">Expiry Date: {c.expiryDate}</Card.Subtitle>
          <Card.Text>{c.description}</Card.Text>
          <Button variant="primary" disabled={c.redeemed} onClick={(e) => {
            e.preventDefault()
            this.redeem(c)
          }}>Redeem</Button>
          {/* <Card.Link href="#">Card Link</Card.Link>
          <Card.Link href="#">Another Link</Card.Link> */}
        </Card.Body>
      </Card>
    )
    return (
      <div className="d-flex justify-content-center">
        {couponItems}
      </div>
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
