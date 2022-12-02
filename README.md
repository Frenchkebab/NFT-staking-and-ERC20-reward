## Staking

A classic feature of NFTs is being able to receive them to stake tokens.

Create a contract where users can send their NFTs and withdraw 10 ERC20 tokens every 24 hours. The user can withdraw the NFT any time. The smart contract must take possession of the NFT and only the user should be able to withdraw it. Beware of the corner case of re-staking to bypass the timer.

Hint: to test the contract, use a shorter timeframe. Remix will respect local timestamps.

## How to test

1. Deploy MyERC20 contract (deployer will initially receive 10k tokens)

2. Deploy MyERC721 contract (deployer will receive token with id 0)

3. Deploy NFTStaker contract with the address of contract in 1 and 2

4. Send 10 token (1000000000000000000000) to NFTStaker contract from MyERC20 contract

5. Approve NFTStaker a token to be staked.

6. Stake an ERC721 token in NFTStaker, the reward is 10 tokens every 10 seconds.
   (If you unstake before 10 seconds, the staked time will just be reset without any reward token)

7. Wait more than 10 seconds and check the reward.

## Memo
