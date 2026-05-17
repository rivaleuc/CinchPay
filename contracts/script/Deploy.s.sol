// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script, console} from "forge-std/Script.sol";
import {CinchPayProcessor} from "../src/CinchPayProcessor.sol";

contract DeployScript is Script {
    // Arc Testnet stablecoin addresses
    address constant USDC = 0x3600000000000000000000000000000000000000;
    address constant EURC = 0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a;

    function run() external returns (CinchPayProcessor processor) {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(pk);

        // Defaults: deployer is owner + feeRecipient, 1% fee
        address owner = vm.envOr("OWNER", deployer);
        address feeRecipient = vm.envOr("FEE_RECIPIENT", deployer);
        uint16 feeBps = uint16(vm.envOr("FEE_BPS", uint256(100)));

        vm.startBroadcast(pk);

        processor = new CinchPayProcessor(owner, feeRecipient, feeBps);

        // Whitelist USDC + EURC right away
        address[] memory tokens = new address[](2);
        tokens[0] = USDC;
        tokens[1] = EURC;
        processor.setTokensAccepted(tokens, true);

        vm.stopBroadcast();

        console.log("=========================================");
        console.log("CinchPayProcessor deployed");
        console.log("=========================================");
        console.log("Address:        ", address(processor));
        console.log("Owner:          ", owner);
        console.log("Fee recipient:  ", feeRecipient);
        console.log("Fee bps:        ", feeBps);
        console.log("Accepted USDC:  ", USDC);
        console.log("Accepted EURC:  ", EURC);
        console.log("=========================================");
    }
}
