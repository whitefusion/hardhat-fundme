const { run } = require("hardhat");

async function verify(contractAddress, args) {
    console.log("verifying ...");
    try {
        await run("verify:verify", {
            address: contractAddress,
            constructorArguments: args,
        });
    } catch (e) {
        if (e.message.includes("already verified")) {
            console.log("Already verified");
        } else {
            console.log(e);
        }
    }
}

module.exports = { verify };
