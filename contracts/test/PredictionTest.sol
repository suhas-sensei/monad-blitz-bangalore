// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "../src/PredictionV0.sol";
import "@pythnetwork/IPyth.sol";
import "@pythnetwork/PythStructs.sol";

// Mock Pyth Oracle
contract MockPyth is IPyth {
    mapping(bytes32 => PythStructs.Price) public prices;
    
    function setPrice(bytes32 id, int64 price, uint64 conf, int32 expo, uint publishTime) external {
        prices[id] = PythStructs.Price({
            price: price,
            conf: conf,
            expo: expo,
            publishTime: publishTime
        });
    }
    
    
    function getPriceUnsafe(bytes32 id) external view returns (PythStructs.Price memory) {
        return prices[id];
    }
    
    // Stub implementations for other IPyth functions
    function getPrice(bytes32) external pure returns (PythStructs.Price memory) { revert("Not implemented"); }
    function getPriceNoOlderThan(bytes32, uint) external pure returns (PythStructs.Price memory) { revert("Not implemented"); }
    function getEmaPrice(bytes32) external pure returns (PythStructs.Price memory) { revert("Not implemented"); }
    function getEmaPriceUnsafe(bytes32) external pure returns (PythStructs.Price memory) { revert("Not implemented"); }
    function getEmaPriceNoOlderThan(bytes32, uint) external pure returns (PythStructs.Price memory) { revert("Not implemented"); }
    function getUpdateFee(bytes[] calldata) external pure returns (uint) { return 0; }
    function updatePriceFeeds(bytes[] calldata) external payable {}
    function updatePriceFeedsIfNecessary(bytes[] calldata, bytes32[] calldata, uint64[] calldata) external payable {}
    function parsePriceFeedUpdates(bytes[] calldata, bytes32[] calldata, uint64, uint64) external payable returns (PythStructs.PriceFeed[] memory) { revert("Not implemented"); }
    function getValidTimePeriod() external pure returns (uint) { return 60; }
}

contract PredictionTest is Test {
    PredictionV0 public prediction;
    MockPyth public mockPyth;
    
    // Use EOA addresses (not contract addresses)
    address admin;
    address operator;
    address user1;
    address user2;
    
    bytes32 priceId = 0x31491744e2dbf6df7fcf4ac0820d18a609b49076d45066d3568424e62f686cd1;
    
    uint256 constant INTERVAL = 60; // 60 seconds
    uint256 constant BUFFER = 120; // 120 seconds
    uint256 constant MIN_BET = 0.001 ether;
    
    function setUp() public {
        // Create real EOA addresses using makeAddr
        admin = makeAddr("admin");
        operator = makeAddr("operator");
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        
        // Deploy mock Pyth
        mockPyth = new MockPyth();
        
        // Deploy prediction contract
        vm.prank(admin);
        prediction = new PredictionV0(
            address(mockPyth),
            priceId,
            admin,
            operator,
            INTERVAL,
            BUFFER,
            MIN_BET,
            300, // oracle allowance
            300  // 3% treasury fee
        );
        
        // Fund users
        vm.deal(user1, 10 ether);
        vm.deal(user2, 10 ether);
        
        // Set initial price at timestamp 0
        mockPyth.setPrice(priceId, 2000_00000000, 1000000, -8, 1);
    }
    
    function testGenesisFlow() public {
        console.log("\n=== Testing Genesis Flow ===");
        
        // 1. Genesis Start at T=0
        vm.warp(10);
        mockPyth.setPrice(priceId, 2000_00000000, 1000000, -8, 10);
        
        vm.prank(operator);
        prediction.performUpkeep();
        
        assertEq(prediction.currentEpoch(), 1);
        assertTrue(prediction.genesisStartOnce());
        assertFalse(prediction.genesisLockOnce());
        console.log("Genesis Start: Epoch", prediction.currentEpoch());
        
        // 2. Users bet during epoch 1 (T=10 to T=70)
        vm.warp(30);
        vm.startPrank(user1, user1); // startPrank(sender, origin)
        prediction.betBull{value: 0.01 ether}(1);
        vm.stopPrank();
        console.log("User1 bet Bull at T=30");
        
        vm.warp(50);
        vm.startPrank(user2, user2);
        prediction.betBear{value: 0.01 ether}(1);
        vm.stopPrank();
        console.log("User2 bet Bear at T=50");
        
        // 3. Genesis Lock at T=70 (after lockTimestamp)
        vm.warp(70);
        mockPyth.setPrice(priceId, 2100_00000000, 1000000, -8, 70);
        
        vm.prank(operator);
        prediction.performUpkeep();
        
        assertEq(prediction.currentEpoch(), 2);
        assertTrue(prediction.genesisLockOnce());
        console.log("Genesis Lock: Epoch", prediction.currentEpoch());
        console.log("Epoch 1 locked at price: 2100");
        
        // 4. Users bet during epoch 2 (T=70 to T=130)
        vm.warp(90);
        vm.startPrank(user1, user1);
        prediction.betBull{value: 0.01 ether}(2);
        vm.stopPrank();
        console.log("User1 bet Bull on Epoch 2 at T=90");
        
        // 5. First Normal Execution at T=190 (epoch 2 closes at 70+120=190)
        vm.warp(190);
        mockPyth.setPrice(priceId, 2050_00000000, 1000000, -8, 190);
        
        vm.prank(operator);
        prediction.performUpkeep();
        
        assertEq(prediction.currentEpoch(), 3);
        console.log("Normal Execution: Epoch", prediction.currentEpoch());

        vm.warp(200);
         vm.startPrank(user1, user1);
        prediction.betBull{value: 0.01 ether}(3);
        vm.stopPrank();
        console.log("User1 bet Bull on ",prediction.currentEpoch() );
        
        // Check epoch 1 results (all 14 fields)
        (,,,, int256 lockPrice1, int256 closePrice1,,,,,,,,bool oracleCalled1) = prediction.rounds(1);
        console.log("Epoch 1 - Lock:", uint256(lockPrice1));
        console.log("Epoch 1 - Close:", uint256(closePrice1));
        assertTrue(oracleCalled1);
        
        // 6. Continue normal executions every 60s
        vm.warp(250); // T=250
        mockPyth.setPrice(priceId, 2200_00000000, 1000000, -8, 250);
        vm.warp(310); // T=310 (epoch 3 closes at 250+60=310)
        vm.prank(operator);
        prediction.performUpkeep();
        
        assertEq(prediction.currentEpoch(), 4);
        console.log("Next Execution: Epoch", prediction.currentEpoch());
    }
    
    function testTimingIssue() public {
        console.log("\n=== Testing Timing Issue ===");
        
        // Genesis start
        vm.warp(10);
        mockPyth.setPrice(priceId, 2000_00000000, 1000000, -8, 10);
        vm.prank(operator);
        prediction.performUpkeep();
        console.log("T=10: Genesis Start, Epoch", prediction.currentEpoch());
        
        // Genesis lock
        vm.warp(70);
        mockPyth.setPrice(priceId, 2100_00000000, 1000000, -8, 70);
        vm.prank(operator);
        prediction.performUpkeep();
        console.log("T=70: Genesis Lock, Epoch", prediction.currentEpoch());
        
        // Try calling at T=130 (TOO EARLY - epoch 2 closes at 190)
        vm.warp(130);
        mockPyth.setPrice(priceId, 2050_00000000, 1000000, -8, 130);
        
        vm.expectRevert("Too early to execute");
        vm.prank(operator);
        prediction.performUpkeep();
        console.log("T=130: FAILED - Too early to execute");
        
        // Should work at T=190
        vm.warp(190);
        mockPyth.setPrice(priceId, 2050_00000000, 1000000, -8, 190);
        vm.prank(operator);
        prediction.performUpkeep();
        console.log("T=190: SUCCESS - Epoch", prediction.currentEpoch());
    }
    
    function testClaimWinnings() public {
        console.log("\n=== Testing Claim Winnings ===");
        
        // Setup rounds
        vm.warp(10);
        mockPyth.setPrice(priceId, 2000_00000000, 1000000, -8, 10);
        vm.prank(operator);
        prediction.performUpkeep();
        
        // Bet on epoch 1
        vm.warp(30);
        vm.startPrank(user1, user1);
        prediction.betBull{value: 1 ether}(1);
        vm.stopPrank();
        
        vm.startPrank(user2, user2);
        prediction.betBear{value: 1 ether}(1);
        vm.stopPrank();
        
        // Lock epoch 1
        vm.warp(70);
        mockPyth.setPrice(priceId, 2100_00000000, 1000000, -8, 70); // Lock at 2100
        vm.prank(operator);
        prediction.performUpkeep();
        
        // Close epoch 1 (price goes up - Bull wins)
        vm.warp(190);
        mockPyth.setPrice(priceId, 2200_00000000, 1000000, -8, 190); // Close at 2200
        vm.prank(operator);
        prediction.performUpkeep();
        
        // Check claimable
        assertTrue(prediction.claimable(1, user1));
        assertFalse(prediction.claimable(1, user2));
        console.log("User1 (Bull) can claim:", prediction.claimable(1, user1));
        console.log("User2 (Bear) can claim:", prediction.claimable(1, user2));
        
        // Claim
        uint256 balanceBefore = user1.balance;
        vm.startPrank(user1, user1);
        uint256[] memory epochs = new uint256[](1);
        epochs[0] = 1;
        prediction.claim(epochs);
        vm.stopPrank();
        
        uint256 balanceAfter = user1.balance;
        console.log("User1 winnings:", (balanceAfter - balanceBefore) / 1e18, "ETH");
    }
    
    function testAutomationScheduling() public {
        console.log("\n=== Testing Automation Scheduling ===");
        console.log("Interval:", INTERVAL, "seconds");
        console.log("Buffer:", BUFFER, "seconds");
        
        // Genesis start at T=10 (not 0 to avoid issues)
        vm.warp(10);
        mockPyth.setPrice(priceId, 2000_00000000, 1000000, -8, 10);
        vm.prank(operator);
        prediction.performUpkeep();
        (,uint256 start1, uint256 lock1, uint256 close1,,,,,,,,,,) = prediction.rounds(1);
        console.log("Epoch 1 Start:", start1);
        console.log("Epoch 1 Lock:", lock1);
        console.log("Epoch 1 Close:", close1);
        
        // Genesis lock at T=70
        vm.warp(70);
        mockPyth.setPrice(priceId, 2100_00000000, 1000000, -8, 70);
        vm.prank(operator);
        prediction.performUpkeep();
        (,uint256 start2, uint256 lock2, uint256 close2,,,,,,,,,,) = prediction.rounds(2);
        console.log("Epoch 2 Start:", start2);
        console.log("Epoch 2 Lock:", lock2);
        console.log("Epoch 2 Close:", close2);
        
        console.log("\n*** CRITICAL: Next call should be at T=", close2, "***");
        console.log("*** NOT at T=120 (60s interval) ***");
        console.log("*** should run every", close2 - start2, "seconds ***");
    }
}