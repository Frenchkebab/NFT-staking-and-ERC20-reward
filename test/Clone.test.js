const { ethers, upgrades } = require('hardhat');
const { expect } = require('chai');

describe('ERC20 Clone', function () {
  let erc20;
  let erc20CloneFactory;
  let owner;
  let instance1Owner;
  let instance2Owner;
  let instance1;
  let instance2;

  before(async function () {
    [owner, instance1Owner, instance2Owner] = await ethers.getSigners();

    // Deploy ERC20 contract
    const ERC20ImplementationFactory = await ethers.getContractFactory(
      'ERC20Implementation'
    );
    erc20 = await ERC20ImplementationFactory.connect(owner).deploy();
    await erc20.deployed();

    // Deploy ERC20CloneFactory
    const ERC20CloneFactoryFactory = await ethers.getContractFactory(
      'ERC20CloneFactory'
    );
    erc20CloneFactory = await ERC20CloneFactoryFactory.deploy(erc20.address);
    await erc20CloneFactory.deployed();
  });

  it('should make an instance with expected parameters', async function () {
    const CLONE_HASH =
      '0xb557324045551eafb0789d69d5679a7017a31840124b2220df4b81dea45ec083';

    const cloneTx1 = await erc20CloneFactory
      .connect(instance1Owner)
      .clone('ERC20 Instance 1', 'EI1', ethers.utils.parseEther('1000000'));
    await cloneTx1.wait();
    const logs = (await ethers.provider.getTransactionReceipt(cloneTx1.hash))
      .logs;
    const logData = logs.filter(
      (log) =>
        log.topics.includes(
          ethers.utils.defaultAbiCoder.encode(
            ['address'],
            [instance1Owner.address]
          )
        ) && log.topics.includes(CLONE_HASH)
    )[0].data;
    const instance1Addr = ethers.utils.hexStripZeros(logData, 20);

    instance1 = await (
      await ethers.getContractFactory('ERC20Implementation')
    ).attach(instance1Addr);

    expect(await instance1.name()).to.equal('ERC20 Instance 1');
    expect(await instance1.symbol()).to.equal('EI1');
    expect(await instance1.cap()).to.equal(ethers.utils.parseEther('1000000'));
  });
});
