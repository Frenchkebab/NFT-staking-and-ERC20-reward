// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20CappedUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract ERC20Implementation is Initializable, ERC20CappedUpgradeable, OwnableUpgradeable {
    uint256 public tokenPrice;

    /**
     * @dev no constructor in upgradable contracts. Instead we have initializers
     */
    function initialize(
        string calldata _name,
        string calldata _symbol,
        address _owner,
        uint256 _cap
    ) public initializer {
        __ERC20_init(_name, _symbol);
        __ERC20Capped_init(_cap);
        __Ownable_init();
        transferOwnership(_owner);
    }
}
