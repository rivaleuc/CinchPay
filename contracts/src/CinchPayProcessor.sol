// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title CinchPayProcessor
/// @notice Stablecoin checkout processor. Customers pay merchants; protocol takes a configurable fee.
/// @dev Each payment is identified by an off-chain generated paymentId (UUID/nonce) used by the indexer.
contract CinchPayProcessor is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @notice Basis points denominator (10000 = 100%)
    uint16 public constant BPS = 10_000;
    /// @notice Max fee the owner can set (5%)
    uint16 public constant MAX_FEE_BPS = 500;

    /// @notice Current fee in basis points (e.g. 100 = 1%)
    uint16 public feeBps;
    /// @notice Recipient of protocol fees
    address public feeRecipient;
    /// @notice Tokens accepted for payment (e.g. USDC, EURC)
    mapping(address => bool) public acceptedTokens;
    /// @notice Tracks consumed paymentIds to prevent duplicates per (merchant, paymentId)
    mapping(bytes32 => bool) public consumed;

    event Payment(
        address indexed merchant,
        address indexed payer,
        address indexed token,
        uint256 grossAmount,
        uint256 netAmount,
        uint256 fee,
        bytes32 paymentId,
        bytes32 metadata
    );
    event Refund(
        address indexed merchant,
        address indexed customer,
        address indexed token,
        uint256 amount,
        bytes32 paymentId
    );
    event FeeUpdated(uint16 oldBps, uint16 newBps);
    event FeeRecipientUpdated(address oldRecipient, address newRecipient);
    event TokenAccepted(address indexed token, bool accepted);

    error InvalidAddress();
    error InvalidAmount();
    error TokenNotAccepted();
    error FeeTooHigh();
    error PaymentAlreadyProcessed();

    constructor(address _owner, address _feeRecipient, uint16 _feeBps) Ownable(_owner) {
        if (_feeRecipient == address(0)) revert InvalidAddress();
        if (_feeBps > MAX_FEE_BPS) revert FeeTooHigh();
        feeRecipient = _feeRecipient;
        feeBps = _feeBps;
    }

    // ────────────────────────────────────────────────────────────────────────
    // Payments
    // ────────────────────────────────────────────────────────────────────────

    /// @notice Settle a payment from `msg.sender` to `merchant` in `token`, taking protocol fee.
    /// @param merchant Address receiving the net amount
    /// @param token ERC-20 token contract (must be accepted)
    /// @param amount Gross amount (in token decimals) — fee is deducted from this
    /// @param paymentId Off-chain generated unique id (UUID / nonce). Cannot be replayed.
    /// @param metadata Optional bytes32 the merchant uses to reconcile (e.g. SKU, orderId hash)
    function pay(
        address merchant,
        address token,
        uint256 amount,
        bytes32 paymentId,
        bytes32 metadata
    ) external nonReentrant {
        if (merchant == address(0)) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();
        if (!acceptedTokens[token]) revert TokenNotAccepted();
        if (consumed[paymentId]) revert PaymentAlreadyProcessed();

        consumed[paymentId] = true;

        uint256 fee = (amount * feeBps) / BPS;
        uint256 net = amount - fee;

        IERC20 t = IERC20(token);
        if (fee > 0) {
            t.safeTransferFrom(msg.sender, feeRecipient, fee);
        }
        t.safeTransferFrom(msg.sender, merchant, net);

        emit Payment(merchant, msg.sender, token, amount, net, fee, paymentId, metadata);
    }

    /// @notice Merchant-initiated refund. Pulls `amount` of `token` from the merchant and sends to customer.
    /// @dev The merchant must approve this contract for `amount`. We don't track the original payment
    ///      so partial/multiple refunds are allowed. Indexer reconciles via paymentId.
    function refund(
        address customer,
        address token,
        uint256 amount,
        bytes32 paymentId
    ) external nonReentrant {
        if (customer == address(0)) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();
        if (!acceptedTokens[token]) revert TokenNotAccepted();

        IERC20(token).safeTransferFrom(msg.sender, customer, amount);
        emit Refund(msg.sender, customer, token, amount, paymentId);
    }

    // ────────────────────────────────────────────────────────────────────────
    // Owner config
    // ────────────────────────────────────────────────────────────────────────

    function setFeeBps(uint16 _feeBps) external onlyOwner {
        if (_feeBps > MAX_FEE_BPS) revert FeeTooHigh();
        emit FeeUpdated(feeBps, _feeBps);
        feeBps = _feeBps;
    }

    function setFeeRecipient(address _feeRecipient) external onlyOwner {
        if (_feeRecipient == address(0)) revert InvalidAddress();
        emit FeeRecipientUpdated(feeRecipient, _feeRecipient);
        feeRecipient = _feeRecipient;
    }

    function setTokenAccepted(address token, bool accepted) external onlyOwner {
        if (token == address(0)) revert InvalidAddress();
        acceptedTokens[token] = accepted;
        emit TokenAccepted(token, accepted);
    }

    function setTokensAccepted(address[] calldata tokens, bool accepted) external onlyOwner {
        for (uint256 i; i < tokens.length; ++i) {
            address token = tokens[i];
            if (token == address(0)) revert InvalidAddress();
            acceptedTokens[token] = accepted;
            emit TokenAccepted(token, accepted);
        }
    }
}
