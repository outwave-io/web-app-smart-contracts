# Getting started


## How to start with this project:
- after clone run `yarn install & yarn build`
- to run all test `yarn test`

## How to run it
- startup the local hardhat node run: `npx hardhat node`
- compile to generate artifacts: `npx hardhat compile`
- deploy outwave contracts and setup, in a separate terminal: `npx hardhat outwave:deploy --network localhost`

## What else can be done?
This project uses Hardhat.
Try running some of the following tasks and always refer to official documentation for:

```shell
npx hardhat accounts
npx hardhat compile
npx hardhat clean
npx hardhat test
npx hardhat node

```

Outwave have developed several tasks that helps to start transactions on localhost or remote nertworks. networks are selected with `--network localhost/mumbai`.  See `/tasks.js` or run `npx hardhat --help` for more info.

Below you can see an example on how this tasks allow a full deployment on network mumbai

```shell
// deploy everything
$ npx hardhat outwave:deploy --network mumbai
- unlock deployed: 0xb868eF5D3183348B7F001d8f3d8A37CC14d2531e
- publiclock template deployed: 0x634bc360D6988396D14E6b1b0369A44f6Bb6C7B2
- outwave org deployed: 0x6C4c1421036aa77245A365fDcD464a271f5D24BC
- event keyburner published at: 0x11e48668d6db234F4EAE814360916E4f0Be61ff3

// allow outwave to create events using erc20 (usdc on mubai)
$ npx hardhat tool:event:addErc20 --outwaveaddr 0x6C4c1421036aa77245A365fDcD464a271f5D24BC --network mumbai
- erc20 address can be used in creating lock: 0x2b8920cBdDCc3e85753423eEceCd179cb9232554

// lets create out first event named technoEvent1
$ npx hardhat tool:event:createEvent --outwaveaddr 0x6C4c1421036aa77245A365fDcD464a271f5D24BC --eventid technoEvent1  --keytokenaddr 0x2b8920cBdDCc3e85753423eEceCd179cb9232554 --keyprice 100  --network mumbai
- event created. lock address is: 0x449dF2567E1E07F0790980D8E8Dd49a2e0Ca584D

// approve erc20 spending on lock
$ npx hardhat tool:erc20:approve --lockaddr 0x449dF2567E1E07F0790980D8E8Dd49a2e0Ca584D  --network mumbai
- user balance is 7999999902
- approved max 9000000000000000 for 0x449dF2567E1E07F0790980D8E8Dd49a2e0Ca584D

//purchase an NFT directly from lock
$ npx hardhat tool:lock:purchase --lockaddr 0x449dF2567E1E07F0790980D8E8Dd49a2e0Ca584D  --network mumbai --erc20 true
- Key balance of 0xB2B2be136eB0b137Fa58F70E24E1A0AC90bAD877 is 1

```



## Git
This project uses husky to lint on pre-commit. You can always skip it with `git commit --no-verify`. 



## Tenderly
Tenderly allows debugging and profiling of smart contracts. To configure the hardhat plugin add a config.yaml file as specified in the docs:

https://www.npmjs.com/package/@tenderly/hardhat-tenderly

`access_key: qlnAUn61wMFTWVXrisR00ZVTu8uKQaV5`

Then ask to the fellow devs to be added to the project on tenderly.co

#### Example commands
- `yarn hardhat tenderly:push EventKeyBurner=0x1085ef079C6CE62E5d3F4a625e79f7FF527DD29A --network mumbai`
- `yarn hardhat tenderly:verify EventKeyBurner=0x1085ef079C6CE62E5d3F4a625e79f7FF527DD29A --network mumbai` 