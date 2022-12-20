const { ethers, upgrades } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

describe('NFT Staking with ERC20', function () {
  const TOKEN_PRICE = 3; // costs 3 wei for 1 JungToken
  const MINT_PRICE = ethers.utils.parseEther('10'); // costs 10 JungTokens to mint 1 MyNFT
  const TOKEN_AMOUNT = ethers.utils.parseEther('1000');

  let owner;
  let holder1;
  let holder2;
  let holder3;
  let jungToken;
  let myNFT;
  let nftStaker;

  async function deployFixture() {
    [owner, holder1, holder2, holder3] = await ethers.getSigners();

    // deploy ERC20 Token (JungToken)
    const JungToken = await (
      await ethers.getContractFactory('JungToken')
    ).connect(owner);
    jungToken = await upgrades.deployProxy(JungToken, { kind: 'uups' });
    await jungToken.deployed();
    console.log('JungToken deployed to: ', jungToken.address);

    // deploy ERC721 Token (MyNFT)
    const MyNFT = await (
      await ethers.getContractFactory('MyNFT')
    ).connect(owner);
    myNFT = await upgrades.deployProxy(MyNFT, [jungToken.address, MINT_PRICE], {
      kind: 'uups',
    });
    await myNFT.deployed();
    console.log('MyNFT deployed to:', myNFT.address);

    // deploy NFT Staker contract
    const NFTStaker = await (
      await ethers.getContractFactory('NFTStaker')
    ).connect(owner);
    nftStaker = await upgrades.deployProxy(
      NFTStaker,
      [jungToken.address, myNFT.address],
      { kind: 'uups' }
    );

    return { owner, holder1, holder2, holder3, jungToken, myNFT, nftStaker };
  }

  it('Buy JungToken with `amount * tokenPrice` wei', async function () {
    const { holder1, jungToken } = await loadFixture(deployFixture);

    expect(await jungToken.balanceOf(holder1.address)).to.equal(0);

    const buyTokenTx = await jungToken.connect(holder1).buyToken(TOKEN_AMOUNT, {
      value: TOKEN_AMOUNT.mul(TOKEN_PRICE),
    });
    await buyTokenTx.wait();

    expect(await jungToken.balanceOf(holder1.address)).to.equal(TOKEN_AMOUNT);
  });

  it('Mint MyNFT with `mintPrice` JungToken', async function () {
    const { holder1, jungToken, myNFT } = await loadFixture(deployFixture);

    // holder initially has no NFT
    expect(await myNFT.balanceOf(holder1.address)).to.equal('0');

    // buy TOKEN_AMOUNT JungTokens
    const buyTokenTx = await jungToken.connect(holder1).buyToken(TOKEN_AMOUNT, {
      value: TOKEN_AMOUNT.mul(TOKEN_PRICE),
    });
    await buyTokenTx.wait();

    // reverts before approval
    await expect(myNFT.connect(holder1).mint()).to.be.revertedWith(
      'ERC20: insufficient allowance'
    );

    // approve myNFT contract to spend JungToken on holder1's behalf
    const approve = await jungToken
      .connect(holder1)
      .approve(myNFT.address, await jungToken.balanceOf(holder1.address));
    await approve.wait();

    // Mint token
    await (await myNFT.connect(holder1).mint()).wait();

    expect(await jungToken.balanceOf(holder1.address)).to.equal(
      TOKEN_AMOUNT.sub(MINT_PRICE)
    );
    expect(await myNFT.balanceOf(holder1.address)).to.equal('1');
    expect(await myNFT.ownerOf('0')).to.equal(holder1.address);
  });
});
