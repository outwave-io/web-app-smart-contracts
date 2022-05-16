Uses
- Unlock v11
- Public Lock 10

To work we need to have 
- PublicLock.sol 
- Unlock.sol
in root of /contract to allow task to deploy them.

Outwave code is referencing the interfaces (IPublicLock and IUnlock) due to a strange behavior during compilation i was not able to solve.
For this reason, outwave code uses interfaces, from node_modules/@unlock-protocol for specific versions.