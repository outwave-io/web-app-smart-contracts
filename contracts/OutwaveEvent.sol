// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.7;
// extenal
import "@openzeppelin/contracts/access/Ownable.sol";

// outwave
import "./mixins/EventOrganizationManagerMixin.sol";
import "./mixins/EventOutwaveManagerMixin.sol";
import "./mixins/EventCoreMixin.sol";
import "./mixins/EventPurchaseHookMixin.sol";
import "./mixins/EventTokenUriHookMixin.sol";


/* 
  main todo
  - ensure the app uses only locks created by us. we could read the factory to retrive this information but what happens when in grows? can we use a counter for the sync with the db? 
   the idea is to pull new locks by using the counter
  - we need to understand how to remove outwave as lockmanager as this would allow us to take control of users locks
  - there is a problem with the splt payment: users will need to move payment between publiclock to the splitpayment. there will be always to places where money is stored and this needs to be reflected also in ui
  - dobbiamo capire come gestire i tokent erc20: se ignorarli oppure no

idee todo
-  public lock uri deve poter essere aggiornabile o per lo meno disabilitabile per non permettere nuovi lock di essere creati in caso di problemi con unlock
- 

*/

/**
 * @title Outwave factory
 * @author Miro Radenovic (demind.io)
 * @dev ERC165 allows our contract to be queried to determine whether it implements a given interface.
 * Every ERC-721 compliant contract must implement the ERC165 interface.
 * https://eips.ethereum.org/EIPS/eip-721
 */
contract OutwaveEvent is
    EventCoreMixin,
    EventOutwaveManagerMixin,
    EventOrganizationManagerMixin,
    EventPurchaseHookMixin,
    EventTokenUriHookMixin
{
    constructor(address unlockaddr, address payable paymentAddr) {
        EventCoreMixin._initializeOEMixinCore(unlockaddr, paymentAddr);
    }
}
