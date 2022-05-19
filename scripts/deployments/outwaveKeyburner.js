const { ethers } = require('hardhat')

async function main({ outwaveAddress, unlockAddress }) {
  // eslint-disable-next-line no-console
  console.log('KEYBURNER DEPLOY > creating a new keyBurner...')

  const KeyBurner = await ethers.getContractFactory('OutwaveKeyBurner')
  const keyBurner = await KeyBurner.deploy(outwaveAddress, unlockAddress)
  await keyBurner.deployed()

  // eslint-disable-next-line no-console
  console.log(
    `KEYBURNER DEPLOY > deployed to: ${keyBurner.address} (tx: ${keyBurner.deployTransaction.hash})`
  )

  return keyBurner.address
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
