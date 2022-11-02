// When running CI, we connect to the hardhat node container
const testHost = process.env.CI === 'true' ? 'eth-node' : '127.0.0.1'

// URL value are public defaults. You should probably replace with your own providers...
module.exports = {
  optimism: {
    chainId: 10,
    url: 'https://mainnet.optimism.io',
    name: 'optimism',
  },
  optimisticGoerli: {
    chainId: 420,
    url: process.env.OPTIMISMGOERLI_PROVIDER,
    name: 'optimism goerli',
  },
  optimismTest: {
    chainId: 10,
    url: process.env.OPTIMISMTEST_PROVIDER,
    name: 'optimism test',
  },
  mumbai: {
    chainId: 80001,
    name: 'mumbai',
    url: process.env.POLYGONMUMBAI_PROVIDER,
  },
  arbitrum: {
    chainId: 42161,
    url: process.env.ARBITRUM_PROVIDER,
    name: 'arbitrum',
  }
}
