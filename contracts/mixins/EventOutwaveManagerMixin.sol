// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.7;
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";

import "./EventCoreMixin.sol";

/*
    Provides core functionalties for managing as owner
    - Modify params
    - Payments and withdraw

*/
contract EventOutwaveManagerMixin is EventCoreMixin {

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

    // returs true if an erc20 can be used for new locks
    function erc20PaymentTokenIsAllowed(address addr) public view returns (bool) {
        return _erc20PaymentTokenIsAllowed(addr);
    }

    function updateOutwavePaymentAddress(address payable newPaymentAddress)
        public
        onlyOwner
    {
        _outwavePaymentAddress = newPaymentAddress;
    }

    function setBaseTokenUri(string calldata newBaseTokenUri)  
        public
        onlyOwner
    {
        _setBaseTokenUri(newBaseTokenUri);
    }

    function getBaseTokenUri() public view returns (string memory){
        return _getBaseTokenUri();
    }


    function getOutwavePaymentAddress()
        public view returns(address)
    {
        return _outwavePaymentAddress;
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

    function  outwaveIsLockCreationEnabled() public view returns(bool) {
        return _allowLockCreation;
    }

    receive() external payable {
        emit PaymentReceived(msg.sender, msg.value);
    }
}
