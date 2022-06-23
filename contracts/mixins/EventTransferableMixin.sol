// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.7;
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "./EventCoreMixin.sol";
import "../interfaces/IEventTransferable.sol";

/*

*/




contract EventTransferableMixin is EventCoreMixin, Ownable, IEventTransferable {

    function upgradableEventManagersAdd(address newAddress) public onlyOwner{
        // todo: validate via interface
        _upgradableEventManagers[newAddress] = true;
    }

    function upgradableEventManagersRemove(address newAddress) public onlyOwner{
        _upgradableEventManagers[newAddress] = false;
    }

    function upgradableEventManagersIsAllowed(address newAddress) public view returns (bool){
        return _upgradableEventManagers[newAddress];
    }

    function eventLockRegister(
        address ownerAddress,
        bytes32 eventId,
        address entityAdresses,
        bytes32 lockId
     ) public override {
        require( _upgradableEventManagers[msg.sender], "UNAUTHORIZED" );
        _eventLockRegister(ownerAddress, eventId, entityAdresses, lockId);
    }

    function eventLockDeregister(
        address ownerAddress,
        bytes32 eventId,
        address entityAddress
    ) public override {
         require( _upgradableEventManagers[msg.sender] , "UNAUTHORIZED" );
        _eventLockDeregister(ownerAddress, eventId, entityAddress);
    }

}
