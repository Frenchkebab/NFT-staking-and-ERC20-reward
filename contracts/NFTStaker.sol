// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721ReceiverUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

/**
 * @title Upgradeable NFT staking contract
 * @author Junghyun Choi (@Frenchkebab)
 * @notice
 */

contract NFTStaker is Initializable, OwnableUpgradeable, IERC721ReceiverUpgradeable, UUPSUpgradeable {
    IERC721 public nftContract;
    IERC20 public tokenContract;

    /// @dev Need to stake at least 24 hours to get reward
    uint256 constant REWARD_TIME = 24 hours;

    struct StakedToken {
        address tokenOwner;
        uint256 timestamp;
    }

    /// @dev map tokenId to stake details
    mapping(uint256 => StakedToken) public stakes;

    function initialize(IERC20 _tokenContractAddress, IERC721 _NFTContractAddress) public initializer {
        nftContract = IERC721(_NFTContractAddress);
        tokenContract = IERC20(_tokenContractAddress);
        __Ownable_init();
    }

    function stake(uint256 _tokenId) external {
        require(nftContract.ownerOf(_tokenId) == msg.sender, "NFTStaker: Caller is not owner of the token");
        stakes[_tokenId] = StakedToken(msg.sender, block.timestamp);
        nftContract.safeTransferFrom(msg.sender, address(this), _tokenId, "0x00");
    }

    /**
     * @dev checks if the token has been staked more than REWARD_TIME
     * resets after unstaking
     */
    //
    function unstake(uint256 _tokenId) external {
        require(stakes[_tokenId].tokenOwner == msg.sender, "NFTStaker: Caller is not owner of the token");
        nftContract.safeTransferFrom(address(this), msg.sender, _tokenId, "0x00");
        uint256 stakedTime = block.timestamp - stakes[_tokenId].timestamp;

        require(stakedTime >= REWARD_TIME, "NFTStaker: Need to wait more to unstake");
        uint256 cycles = stakedTime / REWARD_TIME;
        uint256 reward = 10 * 10 ** 18 * cycles;
        tokenContract.transfer(msg.sender, reward);

        delete stakes[_tokenId];
    }

    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external override returns (bytes4) {
        return this.onERC721Received.selector;
    }

    /**
     * @dev required by the OZ UUPS module
     */
    function _authorizeUpgrade(address) internal override onlyOwner {}
}
