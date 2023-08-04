require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const proxyUrl = "http://127.0.0.1:2081";
const { ProxyAgent, setGlobalDispatcher } = require("undici");
const proxyAgent = new ProxyAgent(proxyUrl);
setGlobalDispatcher(proxyAgent);

module.exports = {
  solidity: {
    version: "0.8.9",
    settings: {
      optimizer: {
        enabled: true,
      },
    },
  },
  mocha: {
    timeout: 100000000,
  },
  allowUnlimitedContractSize: true,
  networks: {
    hardhat: {},
    ETH_SEPOLIA: {
      accounts: [`${process.env.OWNER_PRIVATE_KEY}`],
      url: `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
      apiKey: process.env.ALCHEMY_API_KEY,
    },
    ETH_MAINNET: {
      accounts: [`${process.env.OWNER_PRIVATE_KEY}`],
      url: `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
    },
    ETH_GOERLI: {
      accounts: [`${process.env.OWNER_PRIVATE_KEY}`],
      url: `https://eth-goerli.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
    },
  },
  etherscan: {
    url: "https://api-sepolia.etherscan.io/${process.env.ETHERSCAN_API_KEY}",
    apiKey: {
      mainnet: process.env.ETHERSCAN_API_KEY,
      sepolia: process.env.ALCHEMY_API_KEY,
    },
  },
  paths: {
    artifacts: "../fronted/artifacts",
  },
};
