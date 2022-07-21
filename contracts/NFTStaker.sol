// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Receiver.sol";

contract NFTStaker {
    IERC1155 public parentNFT;

    struct Stake {
        uint256 tokenId;
        uint256 amount;
        uint256 timestamp;
    }
 
    // map staker address to stake details
    mapping(address => Stake) public stakes;

    // map staker to total staking time
    mapping(address => uint256) public stakingTime;

    constructor(IERC1155 _NFTContractAddress) {
        parentNFT = IERC1155(_NFTContractAddress);
    }

    function stake(uint256 _tokenId, uint256 _amount) public {
        stakes[msg.sender] = Stake(_tokenId, _amount, block.timestamp);
        parentNFT.safeTransferFrom(msg.sender, address(this), _tokenId, _amount, "0x00");
    }

    function unstake() public {
        parentNFT.safeTransferFrom(address(this), msg.sender, stakes[msg.sender].tokenId, stakes[msg.sender].amount, "0x00");
        stakingTime[msg.sender] += (block.timestamp - stakes[msg.sender].timestamp);
        delete stakes[msg.sender];
    }

    // This function checks if the receiver can understand what's going on
    function onERC1155Received(
        address operator,
        address from,
        uint256 id,
        uint256 value,
        bytes calldata data
    ) external returns (bytes4) {
        return bytes4(keccak256("onERC1155Received(address,address,uint256,uint256,bytes)"));
    }
}