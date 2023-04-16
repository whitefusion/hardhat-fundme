/*
    <FUND ME>
    Get funds from users
    Withdraw funds
    Set a minimum funding value in USD
*/

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import "./PriceConverter.sol";

// Error Codes
error FundMe__NotOwner();

// Libraries, Interfaces, Contracts

/**
 * @title A contract for crowd funding
 * @author Xin Bai
 * @notice This contract is to demo a sample funding contract
 * @dev here tells how to output documentation: https://docs.soliditylang.org/en/v0.8.19/natspec-format.html#documentation-output
 */
contract FundMe {
    // Type Declarations
    using PriceConverter for uint256;

    /*
        immutable vs constant
        a constant variable's value cannot be changed once it is set. 
        In contrast, an immutable variable's reference cannot be changed, 
        but the variable can be reassigned to point to a new object.    
    */

    // State Variables
    uint256 public constant MINIMUM_USD = 50 * 1e18;

    address private immutable i_owner;
    /**
     * @notice var starting with 's_' is going to be storage variable which is expensive
     */
    address[] private s_funders;
    mapping(address => uint256) private s_addressToAmountFunded;

    AggregatorV3Interface private s_priceFeed;

    // Modifier
    modifier onlyOwner() {
        // _; do all the code in function first
        // require(msg.sender == i_owner, "Sender is not owner");

        if (msg.sender != i_owner) revert FundMe__NotOwner();

        _; // do all the thing in function afterwards
    }

    /*
        Order of function:
            constructor
            receive function (if exists)
            fallback function (if exists)
            external
            public
            internal
            private
    */

    constructor(address priceFeedAddress) {
        // no msg in global scope, only within function
        i_owner = msg.sender;
        s_priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    // called when pay not via fund function
    // other ways like metamask send or calldata low level interaction
    receive() external payable {
        fund();
    }

    fallback() external payable {
        fund();
    }

    /*
        smart contract can hold funds just like how wallets can
    */
    function fund() public payable {
        /*
            could revert gas cost of remaining code if fail
            and previous code will be undone.

            msg is global variable

            we don't want store the message 'didn't send enough' on chain
            error codes are cheaper
        */
        require(
            msg.value.getConversionRate(s_priceFeed) >= MINIMUM_USD,
            "didn't send enough"
        ); // 1e18 = 1 * 10^18

        s_funders.push(msg.sender);
        s_addressToAmountFunded[msg.sender] += msg.value;
    }

    function withdraw() public payable onlyOwner {
        /*
            Every loop would read storage which is expensive
            We can load s_funders into memory onetime and read from the memory
        */
        for (
            uint256 funderIndex = 0;
            funderIndex < s_funders.length;
            funderIndex++
        ) {
            address funder = s_funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }

        // reset array
        s_funders = new address[](0);

        /*
            we actually have 3 methods to withdraw the funds
            transfer, send, call
            https://solidity-by-example.org/sending-ether/
        */

        // transfer
        // payable(msg.sender).transfer(address(this).balance);

        // send
        // bool sendSuccess = payable(msg.sender).send(address(this).balance);
        // require(sendSuccess, "Send failed");

        // call
        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(callSuccess, "Call failed");
    }

    function cheaperWithdraw() public payable onlyOwner {
        /*
            mappings can't be in memory         
        */
        address[] memory funders = s_funders;

        for (uint256 i = 0; i < funders.length; i++) {
            address funder = funders[i];
            s_addressToAmountFunded[funder] = 0;
        }
        s_funders = new address[](0);
        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(callSuccess, "Call failed");
    }

    function getOwner() public view returns (address) {
        return i_owner;
    }

    function getFunders(uint256 index) public view returns (address) {
        return s_funders[index];
    }

    function getAddressToAmountFunded(
        address funder
    ) public view returns (uint256) {
        return s_addressToAmountFunded[funder];
    }

    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return s_priceFeed;
    }
}
