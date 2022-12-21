// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "./ERC20Implementation.sol";

contract ERC20CloneFactory {
    address implementation;

    constructor(address _implementation) {
        implementation = _implementation;
    }

    function clone(
        string calldata _name,
        string calldata _symbol,
        address _owner,
        uint256 _cap
    ) external returns (address) {
        address clone = Clones.clone(implementation);
        ERC20Implementation(clone).initialize(_name, _symbol, _owner, _cap);
    }
}
