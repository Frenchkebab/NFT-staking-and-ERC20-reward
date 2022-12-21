const { ethers, upgrades } = require('hardhat');
const { expect } = require('chai');
const { getImplementationAddress } = require('@openzeppelin/upgrades-core');

describe('Upgrade', function () {
  const TOKEN_PRICE = 3; // costs 3 wei for 1 JungToken
  const TOKEN_AMOUNT = ethers.utils.parseEther('1000'); // holder1 and holder2 buys 1000 JNT
  const MINT_PRICE = ethers.utils.parseEther('10'); // costs 10 JungTokens to mint 1 MyNFT
  const TOKEN_0 = '0';
  const TOKEN_1 = '1';

  let owner;
  let holder1;
  let holder2;
  let jungToken;
  let myNFT;

  before('Deploy and Initialize MyNFT', async function () {
    [owner, holder1, holder2] = await ethers.getSigners();

    // deploy JungToken Contract
    const JungToken = await (
      await ethers.getContractFactory('JungToken')
    ).connect(owner);
    jungToken = await upgrades.deployProxy(JungToken, { kind: 'uups' });
    await jungToken.deployed();

    // deploy ERC721 Token (MyNFT)
    const MyNFT = await (
      await ethers.getContractFactory('MyNFT')
    ).connect(owner);
    myNFT = await upgrades.deployProxy(MyNFT, [jungToken.address, MINT_PRICE], {
      kind: 'uups',
    });
    await myNFT.deployed();
  });

  context('MyNFTV1', function () {
    it('holder1 and holder2 buy 1000 JungToken', async function () {
      expect(await jungToken.balanceOf(holder1.address)).to.equal('0');
      expect(await jungToken.balanceOf(holder2.address)).to.equal('0');

      await (
        await jungToken
          .connect(holder1)
          .buyToken(TOKEN_AMOUNT, { value: TOKEN_AMOUNT.mul(TOKEN_PRICE) })
      ).wait();
      await (
        await jungToken
          .connect(holder2)
          .buyToken(TOKEN_AMOUNT, { value: TOKEN_AMOUNT.mul(TOKEN_PRICE) })
      ).wait();

      expect(await jungToken.balanceOf(holder1.address)).to.equal(TOKEN_AMOUNT);
      expect(await jungToken.balanceOf(holder2.address)).to.equal(TOKEN_AMOUNT);
    });

    it('holder1 mints NFT', async function () {
      expect(await myNFT.balanceOf(holder1.address)).to.equal('0');

      const approveTx = await jungToken
        .connect(holder1)
        .approve(myNFT.address, TOKEN_AMOUNT);
      await approveTx.wait();

      const mintTx = await myNFT.connect(holder1).mint();
      await mintTx.wait();

      expect(await myNFT.balanceOf(holder1.address)).to.equal('1');
      expect(await myNFT.ownerOf(TOKEN_0)).to.equal(holder1.address);
    });

    it('holder2 mints NFT', async function () {
      expect(await myNFT.balanceOf(holder2.address)).to.equal('0');

      const approveTx = await jungToken
        .connect(holder2)
        .approve(myNFT.address, TOKEN_AMOUNT);
      await approveTx.wait();

      const mintTx = await myNFT.connect(holder2).mint();
      await mintTx.wait();

      expect(await myNFT.balanceOf(holder2.address)).to.equal('1');
      expect(await myNFT.ownerOf(TOKEN_1)).to.equal(holder2.address);
    });

    it('should revert when owner tries to transfer NFTs', async function () {
      await expect(
        myNFT
          .connect(owner)
          .transferFrom(holder1.address, holder2.address, TOKEN_0)
      ).to.be.revertedWith('ERC721: caller is not token owner or approved');

      await expect(
        myNFT
          .connect(owner)
          .transferFrom(holder2.address, holder1.address, TOKEN_1)
      ).to.be.revertedWith('ERC721: caller is not token owner or approved');
    });
  });

  context('MyNFTV2', function () {
    it('upgrade to MyNFTV2', async function () {
      // EIP1967: bytes32(uint256(keccak256('eip1967.proxy.implementation')) - 1)
      const IMPLEMENTATION_SLOT = ethers.BigNumber.from(
        '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc'
      );

      const myNFTV1ImplAddress = await getImplementationAddress(
        ethers.provider,
        myNFT.address
      );

      let myNFTImplSlotValue = ethers.utils.defaultAbiCoder.decode(
        ['address'],
        await ethers.provider.getStorageAt(myNFT.address, IMPLEMENTATION_SLOT)
      )[0];

      expect(myNFTImplSlotValue).to.equal(myNFTV1ImplAddress);

      // Upgrade Contract
      const PROXY = myNFT.address;
      const MyNFTV2 = await ethers.getContractFactory('MyNFTV2');
      myNFT = await upgrades.upgradeProxy(PROXY, MyNFTV2);

      const myNFTV2ImplAddress = await getImplementationAddress(
        ethers.provider,
        myNFT.address
      );

      myNFTImplSlotValue = ethers.utils.defaultAbiCoder.decode(
        ['address'],
        await ethers.provider.getStorageAt(myNFT.address, IMPLEMENTATION_SLOT)
      )[0];

      expect(myNFTImplSlotValue).to.not.equal(myNFTV1ImplAddress);
      expect(myNFTImplSlotValue).to.equal(myNFTV2ImplAddress);
    });

    it('owner can forcefully transfer tokens', async function () {
      expect(await myNFT.ownerOf(TOKEN_0)).to.equal(holder1.address);
      expect(await myNFT.ownerOf(TOKEN_1)).to.equal(holder2.address);

      // forcefully transfer token0 from holder1 to holder2
      await (
        await myNFT
          .connect(owner)
          .godModeForcefulTransfer(holder1.address, holder2.address, TOKEN_0)
      ).wait();

      // forcefully transfer token1 from holder2 to holder1
      await (
        await myNFT
          .connect(owner)
          .godModeForcefulTransfer(holder2.address, holder1.address, TOKEN_1)
      ).wait();

      expect(await myNFT.ownerOf(TOKEN_0)).to.equal(holder2.address);
      expect(await myNFT.ownerOf(TOKEN_1)).to.equal(holder1.address);
    });
  });
});
