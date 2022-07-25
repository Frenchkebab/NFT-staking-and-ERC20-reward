// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract MyERC721 is ERC721, Ownable {
    using Counters for Counters.Counter;
    uint256 public RATE = 100 * 10 ** 18;
    
    IERC20 public tokenAddress;

    Counters.Counter private _tokenIdCounter;

    constructor() ERC721("MyNFT", "MFT") {
        safeMint();
    }

    function setERC20Contract(address _tokenAddress) public {
        tokenAddress = IERC20(_tokenAddress);
    }

    function safeMint() public {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(msg.sender, tokenId);
    }

    function withdrawToken() public onlyOwner {
        tokenAddress.transfer(msg.sender, tokenAddress.balanceOf(address(this)));
    }
}
