// When running CI, we connect to the hardhat node container
const testHost = process.env.CI === 'true' ? 'eth-node' : '127.0.0.1'

// URL value are public defaults. You should probably replace with your own providers...
module.exports = {
  optimisticGoerli: {
    chainId: 420,
    url: 'https://opt-goerli.g.alchemy.com/v2/xvmUe2COEAAcn_caQeRbtiDITCCZFyj1',
    name: 'optimism goerli',
  },
  optimismTest: {
    chainId: 10,
    url: 'https://opt-mainnet.g.alchemy.com/v2/Db3tVIWDDMfLSmZNXwiwQZ2GCwbEj8VU',
    name: 'optimism test',
  },
  mumbai: {
    chainId: 80001,
    name: 'mumbai',
    url: 'https://polygon-mumbai.g.alchemy.com/v2/IFm_wxxCk2b0TFTQwPjDK6QXWFDjxer_',
  },
}
