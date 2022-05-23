// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;
import "@openzeppelin/contracts/access/Ownable.sol";
import "./OEMixinCore.sol";

/*
    Provides core functionalties for managing as owner
    - Modify params
    - Payments and withdraw

*/
contract OEMixinManage is OEMixinCore, Ownable {
    event PaymentReceived(address, uint);

    function updateOutwavePaymentAddress(address payable newPaymentAddress)
        public
        onlyOwner
    {
        _outwavePaymentAddress = newPaymentAddress;
    }

    function outwaveWithdraw() public onlyOwner {
        _outwavePaymentAddress.transfer(address(this).balance);
    }

    function outwaveUpdateUnlockFactory(address newUnlockAddr)
        public
        onlyOwner
    {
        _unlockAddr = newUnlockAddr;
    }

    function outwaveAllowLockCreation(bool allowLockCreation) public onlyOwner {
        _allowLockCreation = allowLockCreation;
    }

    function outwaveAddNewOutwaveApi(address newoutWaveAddr) public onlyOwner {
        //todo
    }

    function outwaveRemoveNewOutwaveApi(address outwaveEventAddr)
        public
        onlyOwner
    {
        //todo
    }

    receive() external payable {
        emit PaymentReceived(msg.sender, msg.value);
    }
}
