const { ethers } = require('hardhat')
const { reverts } = require('truffle-assertions')

contract('Event Outwave Manager', () => {
  describe('Set newUnlockAddr / behavior ', () => {
    let outwave

    before(async () => {
      let addresses = await require('../helpers/deploy').deployUnlock('10')
      let outwaveFactory = await ethers.getContractFactory('OutwaveEvent')
      outwave = await outwaveFactory.attach(addresses.outwaveAddress)
    })
    it('shuold disallow to set a newUnlockAddr with zero address', async () => {
      await reverts(
        outwave.outwaveUpdateUnlockFactory(
          '0x0000000000000000000000000000000000000000'
        ),
        'ZERO_ADDRESS_NOT_ALLOWED'
      )
    })
  })
})
