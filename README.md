# A Proof-of-Concept Example of Implemening E-Coupons Using Non-Fungible Token (NFT)
This is a proof-of-concept example of using NFT to implement a simple e-coupon app.  

Each e-coupon, and more specifically its right-to-use, is modelled using a [RC721](https://docs.openzeppelin.com/contracts/3.x/erc721) token. The two key end user operations `redeem` and `transfer` are modeled as Ethereum transactions in the [Solidity contact](contacts/Coupon.sol).

## Running the app
The app and a personal Ethereum blockchain have been [dockerized](docker-compose.yml).

1. To start the app and [`ganache-cli`](https://github.com/trufflesuite/ganache-cli)
```
docker-compose up
```
2. Open `localhost:3000` in your web browser to run the app

## Screenshoot
![](Coupons.png)