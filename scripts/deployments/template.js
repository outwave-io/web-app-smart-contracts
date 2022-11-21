const { ethers } = require('hardhat')
const { addDeployment } = require('../../helpers/deployments')

async function main() {
  const factory = await ethers.getContractFactory('OutwavePublicLock')
  const contract = await factory.deploy()
  await contract.deployed()
  const initParams = {
    lockCreator: ethers.constants.AddressZero,
    expirationDuration: 0,
    tokenAddress: ethers.constants.AddressZero,
    keyPrice: 0,
    maxNumberOfKeys: 0,
    lockName: '',
    lockTokenURI: '',
    outwavePaymentAddress: ethers.constants.AddressZero,
    lockFeePercent: 0,
    maxKeysPerAddress: 0,
  }
  contract.initialize(initParams)

  // eslint-disable-next-line no-console
  // console.log(
  //   `PUBLIC LOCK > deployed to : ${contract.address} (tx: ${contract.deployTransaction.hash})`
  // )
  // eslint-disable-next-line no-console
  // console.log(
  //   'PUBLIC LOCK > Please verify it and call `yarn hardhat set:template`.'
  // )

  // save deployment info
  await addDeployment('OutwavePublicLock', contract, false)

  return contract.address
}

// execute as standalone
if (require.main === module) {
  /* eslint-disable promise/prefer-await-to-then, no-console */
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

module.exports = main
