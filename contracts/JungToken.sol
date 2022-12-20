// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract JungToken is Initializable, ERC20Upgradeable, UUPSUpgradeable, OwnableUpgradeable {
    uint256 public tokenPrice;

    /**
     * @dev no constructor in upgradable contracts. Instead we have initializers
     */
    function initialize() public initializer {
        __ERC20_init("JungToken", "JNT");
        __Ownable_init();
        tokenPrice = 3;
    }

    /**
     * @dev Requires 'tokenPrice * amount' wei to mint 'amount' tokens
     */
    function buyToken(uint256 amount) external payable {
        require(msg.value == tokenPrice * amount, "JungToken: Wrong amount of wei sent");
        _mint(msg.sender, amount);
    }

    /**
     * @dev required by the OZ UUPS module
     */
    function _authorizeUpgrade(address) internal override onlyOwner {}
}
