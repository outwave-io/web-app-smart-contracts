require("@nomiclabs/hardhat-waffle");


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

//outwave
require('./tasks/deploy-outwave')



// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.8.7",
};
