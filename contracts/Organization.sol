// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;
import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "./Outwave.sol";
import "./Event.sol";
import "./EventLog.sol";

contract Organization is EventLog, Ownable{

    Outwave _outw;
    uint counterEvent;

     struct S_Event{
        Event eve;
        // easies and low gas ways to handle if istance have been created
        bool Exsists;
    }

    mapping(uint => S_Event) public _events;


    constructor(Outwave outwave, address owner) {
        _outw = outwave;
        _transferOwnership(owner);
        emit ContractCreated(owner, address(this), ContractType.Organization);
    }

    function createEvent(string memory name, uint date) public onlyOwner {
        console.log("called %s %s ", name, date);
        // continuare qui
        Event ev = new Event(this, msg.sender, name, date);
        _events[counterEvent].eve = ev;
        _events[counterEvent].Exsists = true;
        counterEvent++;
        emit ContractCreated(msg.sender, address(ev), ContractType.Event);
        console.log("New event '%s' created for user '%s'", msg.sender,address(ev));

    }

    function eventAddress(uint idevent) public view returns(address){
        require(_events[idevent].Exsists, "No events for given id address");
        return address(_events[idevent].eve);
    }

    // returns all addresses of events
    //todo:  maybe this can be done by querying directly the blockchain? all events,
    // belonging to user, mint from specific contract (current org)
    function eventsAdresses() public view returns(address[] memory){
        address[] memory ret = new address[](counterEvent);
        for (uint i = 0; i < counterEvent; i++) {
            ret[i] = address(_events[i].eve);
        }
        return ret;

    }




}