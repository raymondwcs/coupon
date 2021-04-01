import React from 'react';
// import ReactDOM from 'react-dom';
import { Button, ButtonGroup, ButtonToolbar, Modal, Table, Card, Container, Col, Form } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.css';
import getWeb3 from "./getWeb3";
import CouponContract from "./build/contracts/Coupon.json";

const App = () => {
  const [showRedeemModal, setShowRedeemModal] = React.useState(false)
  const [showTransferModal, setShowTransferModal] = React.useState(false)
  const [coupon2RedeemMessage, setCoupon2RedeemMessage] = React.useState({})
  const [nCoupons, setNCoupons] = React.useState(0)
  const [web3, setWeb3] = React.useState(null)
  const [eventHistory, setEventHistory] = React.useState([])
  const [myCoupons, setMyCoupons] = React.useState([])
  const [myAccount, setMyAccount] = React.useState("0x0000000000000000000000000000000000000000")
  const [accounts, setAccounts] = React.useState([])
  const [couponInstance, setCouponInstance] = React.useState(null)
  const [tokenId2Transfer, setTokenId2Transfer] = React.useState(0)
  const [transferAccount, setTransferAccount] = React.useState("0x0000000000000000000000000000000000000000")
  const [transferAccountList, setTransferAccountList] = React.useState([])
  const [network, setNetwork] = React.useState(null)
  const [refreshMyCoupons, setRefreshMyCoupons] = React.useState(false)
  const [refreshEventHistory, setRefreshEventHistory] = React.useState(false)

  React.useEffect(() => {
    getWeb3().then(results => {
      setWeb3(results.web3)
      setAccounts(results.accounts)
      setNetwork(results.network)
      return results
    }).then(results => {
      setMyAccount(results.accounts[0])
      return results
    }).then(results => {
      const contract = require('@truffle/contract')
      const coupon = contract(CouponContract)
      coupon.setProvider(results.web3.currentProvider)
      return coupon.deployed()
    }).then(instance => {
      setCouponInstance(instance)
    }).catch(error => {
      console.error(error)
    })
  }, [])  // this runs once

  React.useEffect(() => {
    if (couponInstance) {
      couponInstance.getMyCoupons({ from: myAccount }).then(x => {
        let myCoupons = x.map(c => {
          let coupon = {}
          coupon.tokenId = c.tokenId
          coupon.description = c.description
          coupon.tokenURI = c.tokenURI
          coupon.value = c.value
          coupon.expiryDate = c.expiryDate
          coupon.redeemed = c.redeemed
          coupon.redeemedTimeStamp = c.redeemedTimeStamp
          return coupon
        })
        return myCoupons
      }).then(myCoupons => {
        setMyCoupons(myCoupons)
        let n = 0
        for (let c of myCoupons) {
          if (!c.redeemed && c.tokenId !== 0) n++
        }
        setNCoupons(n)
      })
      console.log(`useEffect() - myCoupons, nCoupons`)
    }
  }, [refreshMyCoupons, myAccount, couponInstance])

  React.useEffect(() => {
    if (couponInstance) {
      const updateEventHistory = async () => {
        // redeem events
        let events = await couponInstance.getPastEvents('redeemCouponEvent', { fromBlock: 0, toBlock: 'latest' })
        let filteredEvents = events.filter(e => e.returnValues.customer === myAccount)
        let filteredRedeemEvents = filteredEvents.map(e => {
          return ({
            event: 'redeem',
            tokenId: e.returnValues.tokenId,
            blockTimeStamp: e.returnValues.blockTimeStamp,
            transactionHash: e.transactionHash,
            remarks: ""
          })
        })

        // transfer events
        events = await couponInstance.getPastEvents('Transfer', { fromBlock: 0, toBlock: 'latest' })
        filteredEvents = events.filter(e => {
          return (
            (e.returnValues.from !== "0x0000000000000000000000000000000000000000") &&
            ((e.returnValues.from === myAccount) || (e.returnValues.to === myAccount))
          )
        })
        let filteredTransferEvents = []
        for (let e of filteredEvents) {
          let results = await web3.eth.getTransaction(e.transactionHash)
          let blockNumber = results.blockNumber
          results = await web3.eth.getBlock(blockNumber)
          let timestamp = results.timestamp
          let eventObject = {}
          eventObject.event = 'transfer'
          eventObject.tokenId = e.returnValues.tokenId
          eventObject.remarks =
            (e.returnValues.from === myAccount)
              ?
              `To: ${e.returnValues.to}`
              :
              `From: ${e.returnValues.from}`
          eventObject.blockTimeStamp = timestamp
          eventObject.transactionHash = e.transactionHash
          filteredTransferEvents.push(eventObject)
        }

        // console.log(`filteredTransferEvents: ${JSON.stringify(filteredTransferEvents)}`)

        let history = [...filteredRedeemEvents, ...filteredTransferEvents]
        return history
      }
      updateEventHistory().then(history => {
        // console.log(history)
        setEventHistory(history.sort(compareTimeStamp))
      })
      console.log(`useEffect() - eventHistory`)
    }
  }, [refreshEventHistory, myAccount, couponInstance, web3])

  const compareTimeStamp = (a, b) => {
    let eventA = a.blockTimeStamp
    let eventB = b.blockTimeStamp

    let comparison = 0
    if (eventA > eventB) {
      comparison = 1
    } else {
      comparison = -1
    }
    return comparison
  }

  const switchAccount = (account) => {
    setMyAccount(account)
  }

  const dismissRedeemModal = () => {
    setShowRedeemModal(false)
  }

  const displayRedeemModal = () => {
    setShowRedeemModal(true)
  }

  const dismissTransferModal = () => {
    setShowTransferModal(false)
  }

  const displayTransferModal = () => {
    setShowTransferModal(true)
  }

  const setCoupon2Redeem = (tokenId) => {
    for (let c of myCoupons) {
      if (c.tokenId === tokenId) {
        // prepare the modal message...
        let coupon2RedeemMessage = {}
        coupon2RedeemMessage.tokenId = tokenId
        coupon2RedeemMessage.value = c.value
        coupon2RedeemMessage.expiryDate = c.expiryDate
        coupon2RedeemMessage.description = c.description
        setCoupon2RedeemMessage(coupon2RedeemMessage)
        displayRedeemModal()
      }
    }
  }

  const setCoupon2Transfer = (tokenId) => {
    let acc = accounts.filter(a => a !== myAccount)
    let transferAccountsList = acc.map(a => {
      return <option key={a} value={a}>{a}</option>
    })
    // console.log(`transferAccount: ${JSON.stringify(transferAccountsList)}`)
    setTransferAccountList(transferAccountsList)
    setTokenId2Transfer(tokenId)
    displayTransferModal()
  }

  const transfer = async () => {
    dismissTransferModal()
    if (tokenId2Transfer && transferAccount) {
      await couponInstance.safeTransferFrom(
        myAccount, transferAccount, tokenId2Transfer, { from: myAccount }
      )
      setRefreshEventHistory(!refreshEventHistory)
      setRefreshMyCoupons(!refreshMyCoupons)
      setTokenId2Transfer(undefined)
      alert(`Coupon [${tokenId2Transfer}] transferred to ${transferAccount}`)
    }
  }

  const redeem = async () => {
    dismissRedeemModal()
    if (coupon2RedeemMessage) {
      let tokenId = coupon2RedeemMessage.tokenId
      let results = await couponInstance.redeem(tokenId, { from: myAccount })
      setRefreshEventHistory(!refreshEventHistory)
      setRefreshMyCoupons(!refreshMyCoupons)
      setCoupon2RedeemMessage(undefined)
      alert(`Redeemed Coupon (${tokenId}) \rTransaction ref: \r${results.tx}`)
    }
  }

  if (!web3) {
    return <div>Loading Web3, accounts, and contract...</div>;
  }

  return (
    <Container>
      <div className="d-flex flex-row justify-content-center">
        <h1>Coupons</h1>
      </div>

      <div className="d-flex flex-row justify-content-center">
        {
          (network) ?
            <Provider network={network} />
            :
            <div></div>
        }
      </div>

      <div className="d-flex flex-row justify-content-center">
        <ContractAddress contractInstance={couponInstance} />
      </div>

      <div className="d-flex flex-row justify-content-center mt-3">
        <AccountSelector
          accounts={accounts}
          switchAccount={switchAccount}
          currentAccount={myAccount}
        />
      </div>

      <div className="d-flex flex-row justify-content-center" >
        <p>You have: <span className="h3 text-success font-weight-bolder">{nCoupons}</span> unused coupon(s)</p>
      </div>

      <div className="d-flex flex-row justify-content-center" >
        <Modal show={showRedeemModal} onHide={dismissRedeemModal}>
          <Modal.Header closeButton>
            <Modal.Title>Redeem this Coupon?</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <p className="h6">No. <span className="font-weight-bolder">
              {(typeof coupon2RedeemMessage === "undefined") ? "" : coupon2RedeemMessage.tokenId}</span>
            </p>
            <ul>
              <li>{(typeof coupon2RedeemMessage === "undefined") ? "" : coupon2RedeemMessage.description}</li>
              <li>Value: {(typeof coupon2RedeemMessage === "undefined") ? "" : coupon2RedeemMessage.value}</li>
              <li>Expiry Date: {(typeof coupon2RedeemMessage === "undefined") ? "" : coupon2RedeemMessage.expiryDate}</li>
            </ul>
          </Modal.Body >

          <Modal.Footer>
            <Button variant="secondary" onClick={dismissRedeemModal}>Cancel</Button>
            <Button variant="primary" onClick={redeem}>Redeem</Button>
          </Modal.Footer>
        </Modal >
      </div>

      <div className="d-flex flex-row justify-content-center" >
        <Modal show={showTransferModal} onHide={dismissTransferModal}>
          <Modal.Header closeButton>
            <Modal.Title>Transfer this Coupon?</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <Form.Control
              as="select"
              className="mr-sm-2"
              id="account"
              custom
              onChange={(e) => e.target.value !== "0" && setTransferAccount(e.target.value)}
            >
              <option key="0" value="0">Choose...</option>
              {transferAccountList}
            </Form.Control>
          </Modal.Body >

          <Modal.Footer>
            <Button variant="secondary" onClick={dismissTransferModal}>Cancel</Button>
            <Button variant="primary" onClick={transfer}>Transfer</Button>
          </Modal.Footer>
        </Modal >
      </div>

      <div className="d-flex flex-row justify-content-center" >
        <CouponSelector
          myAccount={myAccount}
          myCoupons={myCoupons}
          setCoupon2Redeem={setCoupon2Redeem}
          setCoupon2Transfer={setCoupon2Transfer}
        />
      </div>

      <br></br>
      <div className="d-flex flex-row justify-content-center align-items-stretch" >
        {
          (eventHistory) ?
            <EventHistory events={eventHistory} />
            :
            <div></div>
        }
      </div>

    </Container >
  );
}
//
// function components
//
const EventHistory = (props) => {
  if (props.events === null || props.events === undefined) {
    return < div ></div >
  }
  // let listItems = this.props.events.map((e) => <li key={e.transactionHash}>Value: {e.newValue} (was {e.oldValue})</li>)
  // return <ol>{listItems}</ol>
  var listItems = props.events.map((e) =>
    <tr key={e.transactionHash}>
      <td>{e.event}</td>
      <td>{e.tokenId}</td>
      <td>{new Date(e.blockTimeStamp * 1000).toLocaleString()}</td>
      <td>{e.remarks}</td>
    </tr>
  )
  return (
    <div>
      {
        (listItems.length > 0) ?
          <div>
            <div className="d-flex justify-content-center">Transaction History</div>
            <div className="d-flex justify-content-center">
              <Table striped bordered hover size="sm">
                <thead>
                  <tr>
                    <th className="col-auto">Event</th>
                    <th className="col-auto">Coupon</th>
                    <th className="col-auto">Date/Time</th>
                    <th className="col-auto">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {listItems}
                </tbody>
              </Table>
            </div>
          </div>
          :
          <div></div>
      }
    </div>
  )
}

const Provider = (props) => {
  return (
    (props.network === undefined || props.network === null)
      ?
      <div></div>
      :
      <div className="d-flex justify-content-center">
        <small>Connected to network: <code className="text-info">{props.network.networkType} (Id: {props.network.Id})</code></small>
      </div >
  )
}

const ContractAddress = (props) => {
  return (
    (props.contractInstance === undefined || props.contractInstance === null) ?
      <div className="d-flex justify-content-center">
        <small className="text-danger">Contract not deployed??</small>
      </div>
      :
      <div className="d-flex justify-content-center">
        <small>Contract address: <code className="text-info">{props.contractInstance.address}</code></small>
      </div>
  )
}

const CouponSelector = (props) => {
  if (!props.myCoupons || props.myCoupons === undefined || props.myCoupons === null) {
    return <div></div>
  }
  let couponItems = props.myCoupons.map(c =>
    <Card style={{ width: "18rem" }} bg={c.redeemed ? "light" : "black"}>
      <Card.Header as="h6">No. {c.tokenId}</Card.Header>
      <Card.Body>
        <Card.Title>${c.value}</Card.Title>
        <Card.Subtitle>
          {c.description}
        </Card.Subtitle>
        <div className="d-flex">
          {
            c.redeemed ?
              <Card.Text>
                <span className="text-success font-weight-bold">Redemmed</span><br></br>
                <small>{new Date(c.redeemedTimeStamp * 1000).toLocaleString()}</small>
              </Card.Text>
              :
              <div>
                <Card.Text>
                  Expiry Date: {c.expiryDate}
                </Card.Text>
                <ButtonToolbar>
                  <ButtonGroup className="mr-2">
                    <Button className variant="primary" disabled={c.redeemed} onClick={
                      (event) => {
                        props.setCoupon2Redeem(c.tokenId)
                      }}>Redeem
                      </Button>
                  </ButtonGroup>
                  <ButtonGroup className="mr-2">
                    <Button className variant="primary" disabled={c.redeemed} onClick={
                      (event) => {
                        props.setCoupon2Transfer(c.tokenId)
                      }}>Transfer
                      </Button>
                  </ButtonGroup>
                </ButtonToolbar>
              </div>
          }
        </div>
      </Card.Body>
      <Card.Footer className="bg-transparent">
        <div className="d-flex flex-row-reverse align-self-end mb-2 mr-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-info-circle" viewBox="0 0 16 16"
            onClick={(e) => { alert(c.tokenURI) }}
            style={{ cursor: "pointer" }}>
            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
            <path d="M8.93 6.588l-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" />
          </svg>
        </div>
      </Card.Footer>
    </Card >
  )
  return (
    <Container className="d-flex row-cols-xl-4 row-cols-lg-3 row-cols-md-2 row row-cols-sm-1 align-items-stretch justify-content-center">
      {couponItems}
    </Container>
    // <Container className="d-flex flex-wrap align-items-stretch justify-content-center">
    //   {couponItems}
    // </Container>
  )
}

const AccountSelector = (props) => {
  if (!props.accounts || props.accounts === undefined || props.accounts === null) {
    return <div></div>
  }
  let accounts = props.accounts.map(a => {
    return <option key={a} value={a}>{a}</option>
  })
  return (
    <Form>
      <Form.Row>
        <Col xs="auto">
          <Form.Label>Account</Form.Label>
        </Col>
        <Col xs="auto">
          <Form.Control
            as="select"
            className="mr-sm-2"
            id="account"
            custom
            value={props.currentAccount}
            onChange={(e) => e.target.value !== "0" && props.switchAccount(e.target.value)}
          >
            <option key="0" value="0">Choose...</option>
            {accounts}
            {/* <option value={this.props.accounts[0]}>{this.props.accounts[0]}</option>
              <option value={this.props.accounts[1]}>{this.props.accounts[1]}</option> */}
          </Form.Control>
        </Col>
      </Form.Row>
    </Form>
  )
}

export default App;
