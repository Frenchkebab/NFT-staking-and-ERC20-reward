const { ethers, upgrades } = require('hardhat');

async function main() {
  const JungToken = await ethers.getContractFactory('JungToken');
  console.log('Deploying JungToken...');
  const jungToken = await upgrades.deployProxy(JungToken, { kind: 'uups' });
  await jungToken.deployed();

  console.log('JungToken deployed to:', jungToken.address);
}

main();
