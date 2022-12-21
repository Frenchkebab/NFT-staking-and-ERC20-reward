const { ethers, upgrades } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

describe('NFT Staking with ERC20', function () {
  const TOKEN_PRICE = 3; // costs 3 wei for 1 JungToken
  const MINT_PRICE = ethers.utils.parseEther('10'); // costs 10 JungTokens to mint 1 MyNFT
  const TOKEN_AMOUNT = ethers.utils.parseEther('1000');
  const TOKEN_0 = '0';
  const TOKEN_1 = '1';
  const STAKE_REWARD = ethers.utils.parseEther('10');

  let owner;
  let holder;
  let jungToken;
  let myNFT;
  let nftStaker;

  async function deployFixture() {
    [owner, holder] = await ethers.getSigners();

    // deploy ERC20 Token (JungToken)
    const JungToken = await (
      await ethers.getContractFactory('JungToken')
    ).connect(owner);
    jungToken = await upgrades.deployProxy(JungToken, { kind: 'uups' });
    await jungToken.deployed();
    // console.log('JungToken deployed to: ', jungToken.address);

    // deploy ERC721 Token (MyNFT)
    const MyNFT = await (
      await ethers.getContractFactory('MyNFT')
    ).connect(owner);
    myNFT = await upgrades.deployProxy(MyNFT, [jungToken.address, MINT_PRICE], {
      kind: 'uups',
    });
    await myNFT.deployed();
    // console.log('MyNFT deployed to:', myNFT.address);

    // deploy NFT Staker contract
    const NFTStaker = await (
      await ethers.getContractFactory('NFTStaker')
    ).connect(owner);
    nftStaker = await upgrades.deployProxy(
      NFTStaker,
      [jungToken.address, myNFT.address],
      { kind: 'uups' }
    );

    return { owner, holder, jungToken, myNFT, nftStaker };
  }

  describe('ERC20 JungToken', function () {
    it('Initialize contract', async function () {
      const { owner, jungToken } = await loadFixture(deployFixture);

      expect(await jungToken.name()).to.equal('JungToken');
      expect(await jungToken.symbol()).to.equal('JNT');
      expect(await jungToken.owner()).to.equal(owner.address);
    });

    it('Buy JungToken with `amount * tokenPrice` wei', async function () {
      const { holder, jungToken } = await loadFixture(deployFixture);

      expect(await jungToken.balanceOf(holder.address)).to.equal(0);

      const buyTokenTx = await jungToken
        .connect(holder)
        .buyToken(TOKEN_AMOUNT, {
          value: TOKEN_AMOUNT.mul(TOKEN_PRICE),
        });
      await buyTokenTx.wait();

      expect(await jungToken.balanceOf(holder.address)).to.equal(TOKEN_AMOUNT);
    });
  });

  describe('ERC721 MyToken', function () {
    it('Initialize Contract', async function () {
      const { owner, jungToken, myNFT } = await loadFixture(deployFixture);

      expect(await myNFT.owner()).to.equal(owner.address);
      expect(await myNFT.name()).to.equal('MyNFT');
      expect(await myNFT.symbol()).to.equal('MFT');
      expect(await myNFT.tokenAddress()).to.equal(jungToken.address);
    });

    it('Mint MyNFT with `mintPrice` JungToken', async function () {
      const { holder, jungToken, myNFT } = await loadFixture(deployFixture);

      // holder initially has no NFT
      expect(await myNFT.balanceOf(holder.address)).to.equal('0');

      // buy TOKEN_AMOUNT JungTokens
      const buyTokenTx = await jungToken
        .connect(holder)
        .buyToken(TOKEN_AMOUNT, {
          value: TOKEN_AMOUNT.mul(TOKEN_PRICE),
        });
      await buyTokenTx.wait();

      // reverts before approval
      await expect(myNFT.connect(holder).mint()).to.be.revertedWith(
        'ERC20: insufficient allowance'
      );

      // approve myNFT contract to spend JungToken on holder's behalf
      const approve = await jungToken
        .connect(holder)
        .approve(myNFT.address, await jungToken.balanceOf(holder.address));
      await approve.wait();

      // Mint token
      await (await myNFT.connect(holder).mint()).wait();

      expect(await jungToken.balanceOf(holder.address)).to.equal(
        TOKEN_AMOUNT.sub(MINT_PRICE)
      );
      expect(await myNFT.balanceOf(holder.address)).to.equal('1');
      expect(await myNFT.ownerOf(TOKEN_0)).to.equal(holder.address);
    });
  });

  describe('NFT Staker', function () {
    it('Initialize Contract', async function () {
      const { owner, jungToken, myNFT, nftStaker } = await loadFixture(
        deployFixture
      );

      expect(await nftStaker.owner()).to.equal(owner.address);
      expect(await nftStaker.tokenContract()).to.equal(jungToken.address);
      expect(await nftStaker.nftContract()).to.equal(myNFT.address);
    });

    describe('Stake NFTs and get reward', async function () {
      before('', async function () {
        const { owner, holder, jungToken, myNFT, nftStaker } =
          await loadFixture(deployFixture);
        this.owner = owner;
        this.holder = holder;
        this.jungToken = jungToken;
        this.myNFT = myNFT;
        this.nftStaker = nftStaker;

        // fund nftStaker contract 1000 JNT
        await (
          await this.jungToken
            .connect(owner)
            .transfer(this.nftStaker.address, ethers.utils.parseEther('1000'))
        ).wait();

        expect(await this.jungToken.balanceOf(this.nftStaker.address)).to.equal(
          ethers.utils.parseEther('1000')
        );
      });

      it('Buy JungToken', async function () {
        await (
          await this.jungToken.connect(this.holder).buyToken(TOKEN_AMOUNT, {
            value: TOKEN_AMOUNT.mul(await this.jungToken.tokenPrice()),
          })
        ).wait();

        expect(await this.jungToken.balanceOf(this.holder.address)).to.equal(
          TOKEN_AMOUNT
        );
      });

      it('Mint MyNFT', async function () {
        await (
          await this.jungToken
            .connect(this.holder)
            .approve(this.myNFT.address, TOKEN_AMOUNT)
        ).wait();
        // mint NFT with tokenId 0
        await (await this.myNFT.connect(this.holder).mint()).wait();
        // mint NFT with tokenId 1
        await (await this.myNFT.connect(this.holder).mint()).wait();

        expect(await this.myNFT.balanceOf(this.holder.address)).to.equal('2');
        expect(await this.myNFT.ownerOf(TOKEN_0)).to.equal(this.holder.address);
      });

      it('Stake NFT token 0 and token 1', async function () {
        const approveTx = await this.myNFT
          .connect(holder)
          .approve(this.nftStaker.address, TOKEN_0);
        await approveTx.wait();
        const approveTx2 = await this.myNFT
          .connect(holder)
          .approve(this.nftStaker.address, TOKEN_1);
        await approveTx2.wait();

        const stakeTx = await this.nftStaker
          .connect(this.holder)
          .stake(TOKEN_0);
        await stakeTx.wait();

        const stakeTx2 = await this.nftStaker
          .connect(this.holder)
          .stake(TOKEN_1);
        await stakeTx2.wait();

        expect((await this.nftStaker.stakes(TOKEN_0)).tokenOwner).to.equal(
          this.holder.address
        );
        expect((await this.nftStaker.stakes(TOKEN_1)).tokenOwner).to.equal(
          this.holder.address
        );
      });

      it('Unstake token 0 in 24 hours', async function () {
        const currentTimetamp = (await ethers.provider.getBlock()).timestamp;
        const twentyFourHours = 60 * 60 * 24;

        await ethers.provider.send('evm_increaseTime', [twentyFourHours]);
        await ethers.provider.send('evm_mine');

        const timestampIn24Hours = (await ethers.provider.getBlock()).timestamp;

        expect(timestampIn24Hours).to.equal(currentTimetamp + twentyFourHours);

        const jungTokenBalanceBefore = await this.jungToken.balanceOf(
          this.holder.address
        );
        const unstake = await this.nftStaker
          .connect(this.holder)
          .unstake(TOKEN_0);
        await unstake.wait();
        const jungTokenBalanceAfter = await this.jungToken.balanceOf(
          this.holder.address
        );

        expect(jungTokenBalanceAfter).to.equal(
          jungTokenBalanceBefore.add(STAKE_REWARD)
        );
      });

      it('Unstake token 1 in 72 hours', async function () {
        const currentTimetamp = (await ethers.provider.getBlock()).timestamp;
        // 24 hours already passed so we increase 48 hours only
        const seventyTwoHours = 60 * 60 * 48;

        await ethers.provider.send('evm_increaseTime', [seventyTwoHours]);
        await ethers.provider.send('evm_mine');

        const timestampIn72Hours = (await ethers.provider.getBlock()).timestamp;

        expect(timestampIn72Hours).to.equal(currentTimetamp + seventyTwoHours);

        const jungTokenBalanceBefore = await this.jungToken.balanceOf(
          this.holder.address
        );
        const unstake = await this.nftStaker
          .connect(this.holder)
          .unstake(TOKEN_1);
        await unstake.wait();
        const jungTokenBalanceAfter = await this.jungToken.balanceOf(
          this.holder.address
        );

        expect(jungTokenBalanceAfter).to.equal(
          jungTokenBalanceBefore.add(STAKE_REWARD.mul('3'))
        );
      });
    });
  });
});
