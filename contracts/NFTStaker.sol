// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

contract NFTStaker is IERC721Receiver {
    IERC721 public myNFT;
    IERC20 public myERC20;

    // Need to stake at least 10 seconds to get reward
    uint256 constant REWARD_TIME = 10;

    struct StakedToken {
        address tokenOwner;
        uint256 timestamp;
    }

    // map tokenId to stake details
    mapping(uint256 => StakedToken) public stakes;

    // map tokenId to total staking time
    mapping(uint256 => uint256) public stakingTime;

    constructor(IERC721 _NFTContractAddress, IERC20 _tokenContractAddress) {
        myNFT = IERC721(_NFTContractAddress);
        myERC20 = IERC20(_tokenContractAddress);
    }

    function stake(uint256 _tokenId) external {
        require(myNFT.ownerOf(_tokenId) == msg.sender, "Caller is not owner of the token");
        stakes[_tokenId] = StakedToken(msg.sender, block.timestamp);
        myNFT.safeTransferFrom(msg.sender, address(this), _tokenId, "0x00");
    }

    // checks if the token has been staked more than REWARD_TIME
    // resets after unstaking
    function unstake(uint256 _tokenId) external {
        require(stakes[_tokenId].tokenOwner == msg.sender, "Caller is not owner of the token");
        myNFT.safeTransferFrom(address(this), msg.sender, _tokenId, "0x00");
        uint256 stakedTime = block.timestamp - stakes[_tokenId].timestamp;

        if (stakedTime >= REWARD_TIME) {
            uint256 cycles = stakedTime / REWARD_TIME;
            uint256 reward = 10 * 10 ** 18 * cycles;
            myERC20.transfer(msg.sender, reward);
        }
        delete stakes[_tokenId];
    }

    // This function checks if the receiver can understand what's going on
    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external override returns (bytes4) {
        return this.onERC721Received.selector;
    }
}
