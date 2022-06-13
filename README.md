# Getting started
This project uses husky to lint on pre-commit. You can always skip it with `git commit --no-verify`. 

- startup the local hardhat node run: `npx hardhat node`
- compile to generate artifacts: `npx hardhat compile`
- deploy outwave contracts and setup, in a separate terminal: `npx hardhat outwave:deploy:createlock --network localhost`

## Hardhat
This project uses Hardhat.
Try running some of the following tasks and always refer to official documentation for:

```shell
npx hardhat accounts
npx hardhat compile
npx hardhat clean
npx hardhat test
npx hardhat node
node scripts/sample-script.js 
npx hardhat help
```

## Outwave
- after clone run `yarn install & yarn build`
- to run all test `yarn test`
- to deploy everything to specific network: `npx hardhat outwave:deploy --network mumbai`

## Tenderly
Tenderly allows debugging and profiling of smart contracts. To configure the hardhat plugin add a config.yaml file as specified in the docs:

https://www.npmjs.com/package/@tenderly/hardhat-tenderly

`access_key: qlnAUn61wMFTWVXrisR00ZVTu8uKQaV5`

Then ask to the fellow devs to be added to the project on tenderly.co

#### Example commands
- `yarn hardhat tenderly:push EventKeyBurner=0x1085ef079C6CE62E5d3F4a625e79f7FF527DD29A --network mumbai`
- `yarn hardhat tenderly:verify EventKeyBurner=0x1085ef079C6CE62E5d3F4a625e79f7FF527DD29A --network mumbai` 