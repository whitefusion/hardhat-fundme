// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

// https://github.com/smartcontractkit/chainlink/blob/develop/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

/*
    library cannot have any state variable and cannot send ether
*/
library PriceConverter {
    function getPrice(
        AggregatorV3Interface priceFeed
    ) internal view returns (uint256) {
        // interact external contract requires abi and address
        // ETH/USD: "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419"
        // AggregatorV3Interface priceFeed = AggregatorV3Interface(
        //     0x694AA1769357215DE4FAC081bf1f309aDC325306
        // );

        /*
            object deconstruction here
        */
        (, int256 price, , , ) = priceFeed.latestRoundData();
        // ETH in terms of USD
        // 3000.00000000
        return uint256(price * 1e10);
    }

    function getVersion() internal view returns (uint256) {
        AggregatorV3Interface priceFeed = AggregatorV3Interface(
            0x694AA1769357215DE4FAC081bf1f309aDC325306
        );
        return priceFeed.version();
    }

    // the caller itself will be the first argument
    function getConversionRate(
        uint256 ethAmount,
        AggregatorV3Interface priceFeed
    ) internal view returns (uint256) {
        uint256 ethPrice = getPrice(priceFeed);
        // percision problem, do multiple first then division
        uint256 ethAmountInUsd = (ethPrice * ethAmount) / 1e18;
        return ethAmountInUsd;
    }
}
