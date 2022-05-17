
const { ethers } = require('hardhat')

contract('OutwaveEvent', () => {
  let outwave;
  before(async () => {
    let addresses = await require('./helpers/deploy').deployUnlock('10')
    let outwaveFactory = await ethers.getContractFactory("OutwaveEvent");
    outwave = await outwaveFactory.attach(addresses.outwaveAddress)
  })

  describe('create event', () => {

    let lockAddress
    let owner
    let addr1

    it('should emit event LockRegistered when created', async () => {
      [owner, addr1] = await ethers.getSigners()
      const tx = await outwave.connect(addr1).eventCreate(
        1,
        ["name"],
        [web3.utils.toWei('0.01', 'ether')],
        [100000],
        [1],
        ["ipfs://QmdBAufFCb7ProgWvWaNkZmeLDdPLXRKF3ku5tpe99vpPx"]
      );
      let receipt = await tx.wait()
      let evt = receipt.events.find((v) => v.event === 'LockRegistered')
      lockAddress = evt.args.lockAddress;
      assert(lockAddress)
    })

    it('should return correct lock version', async () => {
      var version = await outwave.connect(addr1).publicLockVersion(
        lockAddress
      );
      assert.equal(version, 10)
    })

    // it('should update pricing if owner', async () => {
    //   const tx = await outwave.connect(addr1).updateKeyPricing(
    //     lockAddress,
    //     [web3.utils.toWei('0.02', 'ether')],
    //   );
    //   let receipt = await tx.wait();
    // })


  });
})
