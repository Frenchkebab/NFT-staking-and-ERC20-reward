// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "./ERC20Implementation.sol";

contract ERC20CloneFactory {
    address implementation;

    event Clone(address indexed owner, address instanceAddr);

    constructor(address _implementation) {
        implementation = _implementation;
    }

    function clone(string calldata _name, string calldata _symbol, uint256 _cap) external returns (address) {
        address clone = Clones.clone(implementation);
        ERC20Implementation(clone).initialize(_name, _symbol, msg.sender, _cap);

        emit Clone(msg.sender, clone);
        return clone;
    }

    function create(string calldata _name, string calldata _symbol, uint256 _cap) external returns (address) {
        address instance = address(new ERC20Implementation());
        ERC20Implementation(instance).initialize(_name, _symbol, msg.sender, _cap);

        /// @notice emits just to compare gas more accurately
        emit Clone(msg.sender, instance);
        return instance;
    }
}
