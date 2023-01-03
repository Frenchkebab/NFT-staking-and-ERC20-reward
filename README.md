# Upgradeable NFT Staking Contract

## [0] Setup

### 1. Clone the repository

## [1] Contracts

### Staking

A classic feature of NFTs which is being able to receive them to stake tokens.

User can send their NFTs and withdraw ERC20 JungTokens every 24 hours. The user can withdraw the NFT any time.

### Upgradeability

```
contracts
├── JungToken.sol
├── MyERC721.sol
├── MyERC721V2.sol
└── NFTStaker.sol
```

All contracts(ERC20 `JungToken`, ERC721 `MyERC721`, `NFTStaker`) supports **UUPS pattern**.

## [2] Test

### Staking

`$ npx hardhat test test/Staking.test.js`

```
  NFT Staking with ERC20
    ERC20 JungToken
      ✔ Initialize contract (893ms)
      ✔ Buy JungToken with `amount * tokenPrice` wei
    ERC721 MyToken
      ✔ Initialize Contract
      ✔ Mint MyNFT with `mintPrice` JungToken (117ms)
    NFT Staker
      ✔ Initialize Contract
      Stake NFTs and get reward
        ✔ Buy JungToken
        ✔ Mint MyNFT (65ms)
        ✔ Stake NFT token 0 and token 1 (75ms)
        ✔ Unstake token 0 in 24 hours
        ✔ Unstake token 1 in 72 hours


  10 passing (1s)
```

### Upgradeability

`$ npx hardhat test test/Upgrade.test.js`

```
  Upgrade
    MyNFTV1
      ✔ holder1 and holder2 buy 1000 JungToken (46ms)
      ✔ holder1 mints NFT (49ms)
      ✔ holder2 mints NFT (41ms)
      ✔ should revert when owner tries to transfer NFTs (41ms)
    MyNFTV2
      ✔ upgrade to MyNFTV2 (62ms)
      ✔ owner can forcefully transfer tokens (70ms)


  6 passing (957ms)
```
