const { ethers, upgrades } = require('hardhat');
const { expect } = require('chai');

describe('Clone Pattern vs Creating New Contract', function () {
  const NAME = 'MyERC20';
  const SYMBOL = 'MRC';
  const CAP = ethers.utils.parseUnits('100000');

  let gasClone;
  let gasCreate;
  let cloneFactory;

  before(async function () {
    // Deploy ERC20 contract
    const ERC20ImplementationFactory = await ethers.getContractFactory(
      'ERC20Implementation'
    );
    const erc20 = await ERC20ImplementationFactory.deploy();
    await erc20.deployed();

    // Deploy ERC20CloneFactory
    const ERC20CloneFactory = await ethers.getContractFactory(
      'ERC20CloneFactory'
    );
    cloneFactory = await ERC20CloneFactory.deploy(erc20.address);
    await cloneFactory.deployed();
  });

  it('Compare Gas Cost', async function () {
    gasCreate = await cloneFactory.estimateGas.create(NAME, SYMBOL, CAP);
    gasClone = await cloneFactory.estimateGas.clone(NAME, SYMBOL, CAP);

    console.log(`           Create : ${gasCreate} gas`);
    console.log(`           Clone  :  ${gasClone} gas`);
    console.log(
      `           Diff   : \x1b[33m${gasCreate - gasClone}\x1b[0m gas`
    );
  });
});
