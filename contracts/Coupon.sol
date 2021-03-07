// contracts/Coupon.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

// Import Ownable from the OpenZeppelin Contracts library
import "@openzeppelin/contracts/access/Ownable.sol";

contract Coupon is Ownable, ERC721 {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    struct CouponItem { 
        uint256 tokenId;
        string description;
        string expiryDate;
        uint value;
        bool redeemed;
    }
    
    mapping (uint256 => CouponItem) public coupons;

    constructor() public ERC721("Coupon", "CPN") {}

    function awardCoupon(address customer, string memory tokenURI) public onlyOwner returns (uint256)
    {
        _tokenIds.increment();

        uint256 newCouponId = _tokenIds.current();
        _mint(customer, newCouponId);
        _setTokenURI(newCouponId, tokenURI);

        CouponItem memory c;
        c = CouponItem(newCouponId,"Cash Coupon","2022-12-31",50,false);

        coupons[newCouponId] = c;

        return newCouponId;
    }

    event redeemCouponEvent(address customer, uint256 tokenId, string tokenURI);

    function redeem(uint256 tokenId) public { 
        require(ownerOf(tokenId) == msg.sender, "Not Owner");
        require(coupons[tokenId].redeemed == false, "Already Redeemed");

        coupons[tokenId].redeemed = true;

        emit redeemCouponEvent(msg.sender, tokenId, tokenURI(tokenId));
    }

    function getMyCoupons() public view returns (CouponItem[] memory) {
        CouponItem [] memory myCoupons = new CouponItem[](balanceOf(msg.sender));
        CouponItem storage c;
        uint256 tokenId;

        if (balanceOf(msg.sender) > 0) {
            uint j = 0;
            for (uint i = 0; i < totalSupply(); i++) {
                tokenId = tokenByIndex(i);
                if (ownerOf(tokenId) == msg.sender) {
                    c = coupons[tokenId];
                    myCoupons[j] = c;
                    j += 1;
                }
            }
        }

        return myCoupons;
    }
}