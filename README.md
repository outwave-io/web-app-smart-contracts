# Getting started

## How to start with this project

- after clone run `yarn install & yarn build`
- to run all test `yarn test`

## How to run it

- startup the local hardhat node run: `npx hardhat node`
- compile to generate artifacts: `npx hardhat compile`
- deploy outwave contracts and setup, in a separate terminal: `npx hardhat outwave:deploy --network localhost`

## How to deploy it on mumbai

- deploy outwave contracts and setup, in a separate terminal: `npx hardhat outwave:deploy --basetokenuri https://outwave-jobs-test.azurewebsites.net/mumbai/event721/  --network mumbai`

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
# deploy complete infrastructure
$ npx hardhat outwave:deploy --network mumbai
!!! DO NOT USE THIS IN PRODUCTION YET: PARAMS HARDCODED!
!!! Outwave payments are set to: 0xB2B2be136eB0b137Fa58F70E24E1A0AC90bAD877
- Outwave Unlock Factory published at: 0xB06C6de617723FA58A4D3FE99A785aeFFE679ba6
- Outwave Public Lock published at: 0xB8f318199380E8AA5B2551C83b9E75aa9E22c947
- Template 0xB8f318199380E8AA5B2551C83b9E75aa9E22c947 set to Factory: 0xB06C6de617723FA58A4D3FE99A785aeFFE679ba6
- Key Burner published at: 0x8d90827D7A138B34F111B3475284f3e9B13E3b72
[onchain] To verify on blockchain: yarn verify 0xB06C6de617723FA58A4D3FE99A785aeFFE679ba6 0x8d90827D7A138B34F111B3475284f3e9B13E3b72 --network SOME_NETWORK

# deploy unlock
$ npx hardhat outwave:deploy:unlock --network mumbai
- Outwave Unlock published at: 0x6C4c1421036aa77245A365fDcD464a271f5D24BC

# upgrade unlock
$ npx hardhat outwave:deploy:unlock --network mumbai --unlock-address 0x6C4c1421036aa77245A365fDcD464a271f5D24BC
- Outwave Unlock upgraded at: 0x6C4c1421036aa77245A365fDcD464a271f5D24BC

# deploy key burner
$ npx hardhat outwave:deploy:keyburner --network mumbai --unlockaddr 0xb868eF5D3183348B7F001d8f3d8A37CC14d2531e --keyburnerAddr 0x389A229aCe1016FAdAcfb07b5CB96277366eC3b8
- Key Burner published at: 0x11e48668d6db234F4EAE814360916E4f0Be61ff3

# upgrade key burner
$ npx hardhat outwave:deploy:keyburner --network mumbai --unlockaddr 0xb868eF5D3183348B7F001d8f3d8A37CC14d2531e --keyburnerAddr 0x389A229aCe1016FAdAcfb07b5CB96277366eC3b8
- Key Burner upgraded at: 0x11e48668d6db234F4EAE814360916E4f0Be61ff3

# purchase an NFT directly from lock
$ npx hardhat tool:lock:purchase --lockaddr 0x449dF2567E1E07F0790980D8E8Dd49a2e0Ca584D  --network mumbai --erc20 true
- Key balance of 0xB2B2be136eB0b137Fa58F70E24E1A0AC90bAD877 is 1

# verify lock contracts
$ npx verify <lockcontractaddress> --network mumbai  

```

## Git

This project uses husky to lint on pre-commit. You can always skip it with `git commit --no-verify`. 

## Tenderly

Tenderly allows debugging and profiling of smart contracts. To configure the hardhat plugin add a config.yaml file as specified in the docs:

https://www.npmjs.com/package/@tenderly/hardhat-tenderly

`access_key: qlnAUn61wMFTWVXrisR00ZVTu8uKQaV5`

Then ask to the fellow devs to be added to the project on tenderly.co

### Example commands

- `yarn hardhat tenderly:push EventKeyBurner=0x1085ef079C6CE62E5d3F4a625e79f7FF527DD29A --network mumbai`
- `yarn hardhat tenderly:verify EventKeyBurner=0x1085ef079C6CE62E5d3F4a625e79f7FF527DD29A --network mumbai`

## Slither

Slither is a Solidity source code analyzier and requires Python 3.x and solc-select (to properly work).

```shell
# install choco if not present on your system (admin console)
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# install solc-select deps (admin console)
choco install visualstudio2017buildtools

# install solc-select and set correct Solidity verison
pip install solc-select
solc-select install 0.8.7
solc-select use 0.8.7

# install slither
pip install slither-analyzer

# run it (from repo root)
yarn slither
```

Be aware that the command `yarn slither` may fail from VS Code integrated terminal, please run it eg in a regular Windows Terminal.

## Solhint

Solhint is a Solidity linter and can be installed with npm and runned with yarn:

```shell
# install solhint
npm install -g solhint

#  run it (from repo root)
yarn solhint
```

## Binaries analysis

It could be useful to genrate contracts binaries for static analysis tools like [Rattle](https://github.com/crytic/rattle).

You need `soljs` command and invoke it as follow:

```shell
# instal soljs command
npm install -g solc

# generate binary artifacts
solcjs --bin --include-path ./node_modules --base-path . ./contracts/OutwaveEvent.sol -o ./binaries/OutwaveEvent

solcjs --bin --include-path ./node_modules --base-path . ./contracts/EventKeyBurner.sol -o ./binaries/EventKeyBurner
```

### Rattle

In first instance Rattle requires Python 3. Clone rattle repo and install its dependencies:

```shell
# choose a location outside the repo
cd ~/src

# clone the rattle repo
git clone https://github.com/crytic/rattle

# install dependencies
cd rattle
pip install -r ./requirements.txt
sudo apt install graphviz # pip install graphviz (on Windows won't achieve the same effect)
```

Analyze Outwave contracts binaries:

```shell
# analyze OutwaveEvent contract
python ~/src/rattle/rattle-cli.py --input ./binaries/OutwaveEvent/contracts_OutwaveEvent_sol_OutwaveEvent.bin -O

# analyze EventKeyBurner contract
python ~/src/rattle/rattle-cli.py --input ./binaries/EventKeyBurner/contracts_EventKeyBurner_sol_EventKeyBurner.bin -O
```

On Windows machines rattle will fail in the end cause `dot` command of `graphviz` package is not available, so it's recommended to use Ubuntu Terminal.
Otherwise an Ubuntu VM or Docker image will be fine.

## ASM JSON files

Some tools like [GASOL](https://github.com/costa-group/gasol-optimizer) could need a ASM JSON file as input. You can use the following commands to produce them (from an Ubuntu machine):

```shell
# use a version of solc that supports --include-path parameter
solc-select install 0.8.17
solc-select use 0.8.17

# invoke solc to output the asm json files
solc --combined-json asm ./contracts/OutwaveEvent.sol --base-path . --include-path ./node_modules 1> ./asmjsonfiles/OutwaveEvent.asmjson

solc --combined-json asm ./contracts/EventKeyBurner.sol --base-path . --include-path ./node_modules 1> ./asmjsonfiles/EventKeyBurner.asmjson
```
