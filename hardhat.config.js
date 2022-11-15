// const { copySync } = require('fs-extra')

require('@nomiclabs/hardhat-ethers')
require('@nomiclabs/hardhat-truffle5')

// full stack trace if needed
require('hardhat-tracer')

// erc1820 deployment
require('hardhat-erc1820')

// for upgrades
require('@openzeppelin/hardhat-upgrades')

// debug storage
require('hardhat-storage-layout')

// gas reporting for tests
require('hardhat-gas-reporter')

// test coverage
require('solidity-coverage')

// eslint-disable-next-line global-require
require('@nomiclabs/hardhat-etherscan')

// check contract size
require('hardhat-contract-sizer')

// tenderly plugin (contract debugging, profiling, etc)
require('@tenderly/hardhat-tenderly')

// upgradable contracts plug-in
require('@openzeppelin/hardhat-upgrades')

const { getHardhatNetwork } = require('./helpers/network')

const settings = {
  optimizer: {
    enabled: true,
    runs: 80,
  },
  outputSelection: {
    '*': {
      '*': ['storageLayout'],
    },
  },
}

const networks = getHardhatNetwork()

// tasks
require('./tasks/accounts')
require('./tasks/balance')
require('./tasks/config')
require('./tasks/deploy')
require('./tasks/set')
require('./tasks/toolbox')

// outwave
require('./tasks/deploy-outwave')
require('./tasks/upgrade-outwave')

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  networks,
  etherscan: {
    apiKey: {
      polygonMumbai: 'IES3ED9IU77E9TEWYUEJKTJEQG2DYFW4UF',
    },
  },
  gasReporter: {
    currency: 'USD',
    excludeContracts: ['Migrations', 'TestNoop'],
    gasPrice: 5,
  },
  solidity: {
    compilers: [{ version: '0.8.17', settings }],
  },
  mocha: {
    timeout: 2000000,
  },
  tenderly: {
    project: 'events',
    username: 'outwave-dao',
  },
}
