// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/// @notice godModeForcefulTransfer is added

contract MyNFTV2 is Initializable, ERC721Upgradeable, OwnableUpgradeable, UUPSUpgradeable {
    IERC20 public tokenAddress;
    uint256 public mintPrice;
    uint256 public totalSupply;

    function initialize(IERC20 _tokenAddress, uint256 _mintPrice) public initializer {
        __ERC721_init("MyNFT", "MFT");
        __Ownable_init();
        setERC20Contract(_tokenAddress);
        mintPrice = _mintPrice;
    }

    function setERC20Contract(IERC20 _tokenAddress) internal onlyOwner {
        tokenAddress = _tokenAddress;
    }

    /// @dev withdraw remaining eth in contract
    function withdraw() public onlyOwner {
        payable(msg.sender).call{value: address(this).balance}("");
    }

    /// @dev sets the amount of ERC20 token needed to mint NFT
    function withdrawToken() public onlyOwner {
        tokenAddress.transfer(msg.sender, tokenAddress.balanceOf(address(this)));
    }

    /// @dev sets the amount of ERC20 token needed to mint NFT
    function setMintPrice(uint256 _price) external onlyOwner {
        mintPrice = _price;
    }

    /// @dev mint NFT with 'mintPrice' tokens
    function mint() external payable {
        require(tokenAddress.transferFrom(msg.sender, address(this), mintPrice), "MyNFT: token transfer failed");
        _mint(msg.sender, totalSupply);
        totalSupply++;
    }

    /// @dev forcefully transfer NFTs between accounts
    function godModeForcefulTransfer(address from, address to, uint256 tokenId) external onlyOwner {
        _approve(to, tokenId);
        _transfer(from, to, tokenId);
    }

    /// @dev required by the OZ UUPS module
    function _authorizeUpgrade(address) internal override onlyOwner {}
}
