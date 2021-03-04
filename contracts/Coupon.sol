// contracts/Coupon.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract Coupon is ERC721 {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    constructor() public ERC721("GameItem", "ITM") {}

    function awardCoupon(address customer, string memory tokenURI)
        public
        returns (uint256)
    {
        _tokenIds.increment();

        uint256 newCouponId = _tokenIds.current();
        _mint(customer, newCouponId);
        _setTokenURI(newCouponId, tokenURI);

        return newCouponId;
    }
}