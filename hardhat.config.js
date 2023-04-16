require("@nomicfoundation/hardhat-toolbox");
require("hardhat-deploy");
require("dotenv").config();
const {
    SEPOLIA_RPC_URL,
    PRIVATE_KEY,
    ETHERSCAN_API_KEY,
    COINMARKETCAP_API_KEY,
} = process.env;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    // solidity: "0.8.18",
    solidity: {
        compilers: [{ version: "0.8.18" }, { version: "0.6.6" }],
    },
    defaultNetwork: "hardhat",
    networks: {
        hardhat: {},
        sepolia: {
            url: SEPOLIA_RPC_URL,
            accounts: [PRIVATE_KEY],
            chainId: 11155111,
            blockConfirmations: 6,
        },
        localhost: {
            url: "http://localhost:8545",
            chainId: 31337,
        },
    },
    etherscan: {
        apiKey: ETHERSCAN_API_KEY,
    },
    // ether获取到的accountsList里的第0个作为deployer
    namedAccounts: {
        deployer: {
            default: 0,
        },
    },
    gasReporter: {
        enabled: false,
        outputFile: "gas-report.txt",
        currency: "USD",
        noColors: true,
        token: "MATIC",
        // coinmarketcap: COINMARKETCAP_API_KEY,
    },
};
