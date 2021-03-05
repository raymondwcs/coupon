// contracts/Coupon.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

// Import Ownable from the OpenZeppelin Contracts library
import "@openzeppelin/contracts/access/Ownable.sol";

contract Coupon is Ownable, ERC721 {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    mapping (uint256 => bool) public redeemed;

    constructor() public ERC721("Coupon", "CPN") {}

    function awardCoupon(address customer, string memory tokenURI)
        public onlyOwner
        returns (uint256)
    {
        _tokenIds.increment();

        uint256 newCouponId = _tokenIds.current();
        _mint(customer, newCouponId);
        _setTokenURI(newCouponId, tokenURI);

        redeemed[newCouponId] = false;

        return newCouponId;
    }

    function redeemCoupon(uint256 tokenId) public { 
        require(ownerOf(tokenId) == msg.sender, "Not owner");
        require(redeemed[tokenId] == false, "Redeemed already");

        redeemed[tokenId] = true;
    }
}