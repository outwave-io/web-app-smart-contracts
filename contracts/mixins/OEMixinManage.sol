
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;
import "@openzeppelin/contracts/access/Ownable.sol";
import "./OEMixinCore.sol";


/*
    Provides core functionalties for managing as owner
    - Modify params
    - Payments and withdraw

*/
contract OEMixinManage is OEMixinCore, Ownable{

    event PaymentReceived(address, uint);

    function updateOutwavePaymentAddress(
        address payable newPaymentAddress
    ) onlyOwner public {
        _outwavePaymentAddress = newPaymentAddress;
    }

    function outwaveWithdraw(
    ) onlyOwner public {
        _outwavePaymentAddress.transfer(address(this).balance);
    }

    function outwaveUpdateUnlockFactory(
        address newUnlockAddr
    ) onlyOwner public {
        _unlockAddr = newUnlockAddr;
    }

    function outwaveAllowLockCreation(
    bool allowLockCreation
    ) onlyOwner public {
        _allowLockCreation = allowLockCreation;
    }

    function outwaveAddNewOutwaveApi(
        address newoutWaveAddr
    ) onlyOwner public{
    //todo
    }

    function outwaveRemoveNewOutwaveApi(
        address outwaveEventAddr
    ) onlyOwner public{
    //todo
    }

    
    receive() external payable {
        emit PaymentReceived(msg.sender, msg.value);
    }


}