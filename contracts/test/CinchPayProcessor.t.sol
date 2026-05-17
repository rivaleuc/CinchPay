// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test} from "forge-std/Test.sol";
import {CinchPayProcessor} from "../src/CinchPayProcessor.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract MockUSDC is ERC20 {
    constructor() ERC20("USD Coin", "USDC") {}
    function decimals() public pure override returns (uint8) { return 6; }
    function mint(address to, uint256 amt) external { _mint(to, amt); }
}

contract CinchPayProcessorTest is Test {
    CinchPayProcessor processor;
    MockUSDC usdc;

    address owner = makeAddr("owner");
    address feeRecipient = makeAddr("feeRecipient");
    address merchant = makeAddr("merchant");
    address customer = makeAddr("customer");

    uint16 constant INITIAL_FEE_BPS = 100; // 1%
    uint256 constant PAY_AMOUNT = 100e6; // 100 USDC

    bytes32 constant PAY_ID_1 = bytes32(uint256(1));
    bytes32 constant PAY_ID_2 = bytes32(uint256(2));
    bytes32 constant METADATA = bytes32("ORDER-001");

    function setUp() public {
        usdc = new MockUSDC();
        processor = new CinchPayProcessor(owner, feeRecipient, INITIAL_FEE_BPS);

        vm.prank(owner);
        processor.setTokenAccepted(address(usdc), true);

        usdc.mint(customer, 10_000e6);
        usdc.mint(merchant, 10_000e6);

        vm.prank(customer);
        usdc.approve(address(processor), type(uint256).max);
        vm.prank(merchant);
        usdc.approve(address(processor), type(uint256).max);
    }

    // ───────────── Construction ─────────────

    function test_Constructor() public view {
        assertEq(processor.owner(), owner);
        assertEq(processor.feeRecipient(), feeRecipient);
        assertEq(processor.feeBps(), INITIAL_FEE_BPS);
    }

    function test_RevertWhen_ConstructorZeroFeeRecipient() public {
        vm.expectRevert(CinchPayProcessor.InvalidAddress.selector);
        new CinchPayProcessor(owner, address(0), 100);
    }

    function test_RevertWhen_ConstructorFeeTooHigh() public {
        vm.expectRevert(CinchPayProcessor.FeeTooHigh.selector);
        new CinchPayProcessor(owner, feeRecipient, 501);
    }

    // ───────────── Payments ─────────────

    function test_Pay() public {
        uint256 expectedFee = (PAY_AMOUNT * INITIAL_FEE_BPS) / 10_000;
        uint256 expectedNet = PAY_AMOUNT - expectedFee;

        vm.prank(customer);
        processor.pay(merchant, address(usdc), PAY_AMOUNT, PAY_ID_1, METADATA);

        assertEq(usdc.balanceOf(merchant), 10_000e6 + expectedNet);
        assertEq(usdc.balanceOf(feeRecipient), expectedFee);
        assertEq(usdc.balanceOf(customer), 10_000e6 - PAY_AMOUNT);
        assertTrue(processor.consumed(PAY_ID_1));
    }

    function test_Pay_ZeroFee() public {
        vm.prank(owner);
        processor.setFeeBps(0);

        vm.prank(customer);
        processor.pay(merchant, address(usdc), PAY_AMOUNT, PAY_ID_1, METADATA);

        assertEq(usdc.balanceOf(merchant), 10_000e6 + PAY_AMOUNT);
        assertEq(usdc.balanceOf(feeRecipient), 0);
    }

    function test_Pay_EmitsEvent() public {
        uint256 fee = (PAY_AMOUNT * INITIAL_FEE_BPS) / 10_000;
        uint256 net = PAY_AMOUNT - fee;

        vm.expectEmit(true, true, true, true);
        emit CinchPayProcessor.Payment(
            merchant, customer, address(usdc), PAY_AMOUNT, net, fee, PAY_ID_1, METADATA
        );

        vm.prank(customer);
        processor.pay(merchant, address(usdc), PAY_AMOUNT, PAY_ID_1, METADATA);
    }

    function test_RevertWhen_PayDuplicateId() public {
        vm.startPrank(customer);
        processor.pay(merchant, address(usdc), PAY_AMOUNT, PAY_ID_1, METADATA);

        vm.expectRevert(CinchPayProcessor.PaymentAlreadyProcessed.selector);
        processor.pay(merchant, address(usdc), PAY_AMOUNT, PAY_ID_1, METADATA);
        vm.stopPrank();
    }

    function test_RevertWhen_PayUnacceptedToken() public {
        MockUSDC unaccepted = new MockUSDC();
        unaccepted.mint(customer, 1_000e6);
        vm.prank(customer);
        unaccepted.approve(address(processor), type(uint256).max);

        vm.expectRevert(CinchPayProcessor.TokenNotAccepted.selector);
        vm.prank(customer);
        processor.pay(merchant, address(unaccepted), PAY_AMOUNT, PAY_ID_1, METADATA);
    }

    function test_RevertWhen_PayZeroAmount() public {
        vm.expectRevert(CinchPayProcessor.InvalidAmount.selector);
        vm.prank(customer);
        processor.pay(merchant, address(usdc), 0, PAY_ID_1, METADATA);
    }

    function test_RevertWhen_PayZeroMerchant() public {
        vm.expectRevert(CinchPayProcessor.InvalidAddress.selector);
        vm.prank(customer);
        processor.pay(address(0), address(usdc), PAY_AMOUNT, PAY_ID_1, METADATA);
    }

    function test_MultiplePaymentsDifferentIds() public {
        vm.startPrank(customer);
        processor.pay(merchant, address(usdc), PAY_AMOUNT, PAY_ID_1, METADATA);
        processor.pay(merchant, address(usdc), PAY_AMOUNT, PAY_ID_2, METADATA);
        vm.stopPrank();

        uint256 expectedNet = PAY_AMOUNT - ((PAY_AMOUNT * INITIAL_FEE_BPS) / 10_000);
        assertEq(usdc.balanceOf(merchant), 10_000e6 + (expectedNet * 2));
    }

    function testFuzz_Pay(uint256 amount, uint16 fee) public {
        amount = bound(amount, 1, 9_000e6);
        fee = uint16(bound(uint256(fee), 0, 500));

        vm.prank(owner);
        processor.setFeeBps(fee);

        uint256 expectedFee = (amount * fee) / 10_000;
        uint256 expectedNet = amount - expectedFee;

        vm.prank(customer);
        processor.pay(merchant, address(usdc), amount, bytes32(uint256(amount)), METADATA);

        assertEq(usdc.balanceOf(merchant), 10_000e6 + expectedNet);
        assertEq(usdc.balanceOf(feeRecipient), expectedFee);
    }

    // ───────────── Refunds ─────────────

    function test_Refund() public {
        // First, customer pays merchant
        vm.prank(customer);
        processor.pay(merchant, address(usdc), PAY_AMOUNT, PAY_ID_1, METADATA);

        uint256 customerBalanceBeforeRefund = usdc.balanceOf(customer);
        uint256 refundAmount = 50e6;

        vm.prank(merchant);
        processor.refund(customer, address(usdc), refundAmount, PAY_ID_1);

        assertEq(usdc.balanceOf(customer), customerBalanceBeforeRefund + refundAmount);
    }

    function test_Refund_EmitsEvent() public {
        vm.expectEmit(true, true, true, true);
        emit CinchPayProcessor.Refund(merchant, customer, address(usdc), 50e6, PAY_ID_1);

        vm.prank(merchant);
        processor.refund(customer, address(usdc), 50e6, PAY_ID_1);
    }

    function test_RevertWhen_RefundZeroCustomer() public {
        vm.expectRevert(CinchPayProcessor.InvalidAddress.selector);
        vm.prank(merchant);
        processor.refund(address(0), address(usdc), 50e6, PAY_ID_1);
    }

    function test_RevertWhen_RefundZeroAmount() public {
        vm.expectRevert(CinchPayProcessor.InvalidAmount.selector);
        vm.prank(merchant);
        processor.refund(customer, address(usdc), 0, PAY_ID_1);
    }

    // ───────────── Owner config ─────────────

    function test_SetFeeBps() public {
        vm.expectEmit(true, true, true, true);
        emit CinchPayProcessor.FeeUpdated(INITIAL_FEE_BPS, 250);

        vm.prank(owner);
        processor.setFeeBps(250);
        assertEq(processor.feeBps(), 250);
    }

    function test_RevertWhen_SetFeeBpsTooHigh() public {
        vm.expectRevert(CinchPayProcessor.FeeTooHigh.selector);
        vm.prank(owner);
        processor.setFeeBps(501);
    }

    function test_RevertWhen_SetFeeBpsNotOwner() public {
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, customer));
        vm.prank(customer);
        processor.setFeeBps(200);
    }

    function test_SetFeeRecipient() public {
        address newRecipient = makeAddr("newRecipient");
        vm.prank(owner);
        processor.setFeeRecipient(newRecipient);
        assertEq(processor.feeRecipient(), newRecipient);
    }

    function test_SetTokenAccepted() public {
        MockUSDC eurc = new MockUSDC();
        vm.prank(owner);
        processor.setTokenAccepted(address(eurc), true);
        assertTrue(processor.acceptedTokens(address(eurc)));

        vm.prank(owner);
        processor.setTokenAccepted(address(eurc), false);
        assertFalse(processor.acceptedTokens(address(eurc)));
    }

    function test_SetTokensAccepted_Batch() public {
        address[] memory tokens = new address[](2);
        tokens[0] = address(new MockUSDC());
        tokens[1] = address(new MockUSDC());

        vm.prank(owner);
        processor.setTokensAccepted(tokens, true);
        assertTrue(processor.acceptedTokens(tokens[0]));
        assertTrue(processor.acceptedTokens(tokens[1]));
    }
}
