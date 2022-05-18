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
- to deploy to specific network: `npx hardhat outwave:deploy --network mumbai`
