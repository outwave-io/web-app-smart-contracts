// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.7;
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "./EventCoreMixin.sol";

/*
    Provides core functionalties for managing as owner
    - Modify params
    - Payments and withdraw

*/
contract EventOutwaveManagerMixin is EventCoreMixin, Ownable {

    event PaymentReceived(address, uint);
    event OutwaveWithdraw(address beneficiaryAddr, address tokenAddr, uint amount);
 
    // allows the creations of public locks that will use specific erc20 token
    function erc20PaymentTokenAdd (address erc20addr) public onlyOwner{
        _erc20PaymentTokenAdd(erc20addr);
    }

    // removes the creations of public locks that will use specific erc20 token
    function erc20PaymentTokenRemove (address erc20addr) public onlyOwner{
        _erc20PaymentTokenRemove(erc20addr);
    }

    function erc20PaymentTokenIsAllowed(address addr) public view returns (bool) {
        return _erc20PaymentTokenIsAllowed(addr);
    }

    function updateOutwavePaymentAddress(address payable newPaymentAddress)
        public
        onlyOwner
    {
        _outwavePaymentAddress = newPaymentAddress;
    }

    function outwaveWithdraw(address tokenAddr, uint amount) public onlyOwner {

        if(tokenAddr != address(0)){
            //todo: shall we use safeerc20upgradable?
            IERC20 erc20 = IERC20(tokenAddr);
            erc20.transfer(_outwavePaymentAddress, amount);
        }
        else{
            _outwavePaymentAddress.transfer(amount);
        }
        emit OutwaveWithdraw(_outwavePaymentAddress, tokenAddr, amount);

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
