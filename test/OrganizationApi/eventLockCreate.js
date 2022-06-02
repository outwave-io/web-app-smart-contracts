const { assert } = require('chai')
const { ethers } = require('hardhat')
//const { reverts } = require('truffle-assertions')

contract('OutwaveEvent', () => {
  describe('create event lock / behavior ', () => {
    let outwave
    let lockAddress // the address of the lock
    let addr1 // user 1
    let addr2 // user 2

    before(async () => {
      let addresses = await require('../helpers/deploy').deployUnlock('10')
      let outwaveFactory = await ethers.getContractFactory('OutwaveEvent')
      outwave = await outwaveFactory.attach(addresses.outwaveAddress)
      ;[, addr1, addr2] = await ethers.getSigners()

      const tx = await outwave
        .connect(addr1)
        .eventCreate(
          web3.utils.padLeft(web3.utils.asciiToHex('1'), 64),
          'name',
          web3.utils.toWei('0.01', 'ether'),
          100000,
          1,
          'ipfs://QmdBAufFCb7ProgWvWaNkZmeLDdPLXRKF3ku5tpe99vpPx'
        )
      await tx.wait()

      let receipt = await tx.wait()
      let evt = receipt.events.find((v) => v.event === 'LockRegistered')
      lockAddress = evt.args.lockAddress
    })


    it('should create successfully and emit event LockRegistered when created', async () => {
      ;[, addr1] = await ethers.getSigners()
      const tx = await outwave
        .connect(addr1)
        .eventLockCreate(
          web3.utils.padLeft(web3.utils.asciiToHex('1'), 64), //same event id
          'name2',
          web3.utils.toWei('0.01', 'ether'),
          100000,
          1,
          'ipfs://QmdBAufFCb7ProgWvWaNkZmeLDdPLXRKF3ku5tpe99vpPx'
        )
      let receipt = await tx.wait()
      let evt = receipt.events.find((v) => v.event === 'LockRegistered')
      let lockAddress2 = evt.args.lockAddress
      assert(lockAddress2)
    })
  })
})
