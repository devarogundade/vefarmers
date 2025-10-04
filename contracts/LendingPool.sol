// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {OracleInterface} from "./interfaces/OracleInterface.sol";
import {FarmerRegistryInterface} from "./interfaces/FarmerRegistryInterface.sol";
import {LendingPoolInterface} from "./interfaces/LendingPoolInterface.sol";
import {InterestLib} from "./libs/InterestLib.sol";
import {PledgeManagerInterface} from "./interfaces/PledgeManagerInterface.sol";
import {LendingPoolLogic} from "./libs/LendingPoolLogic.sol";

contract LendingPool is ReentrancyGuard, Ownable, ERC20, LendingPoolInterface {
    using LendingPoolLogic for LendingPoolLogic.BorrowerPosition;

    OracleInterface public oracle;
    IERC20 public fiat;
    FarmerRegistryInterface public registry;

    uint256 public totalSupplied;
    uint256 public totalBorrowed;

    mapping(address => LendingPoolLogic.BorrowerPosition)
        public farmerPositions;

    uint256 public loanToValueBp = 7_000;
    uint256 public borrowRateBp = 2_400;
    uint256 public constant MAX_BPS = 10_000;
    uint256 public constant LIQUIDATION_BPS = 9_600;

    bytes32 public DOMAIN_SEPARATOR;
    mapping(address => uint256) public nonces;

    constructor(
        address _controller,
        address _oracle,
        address _fiat,
        address _registry
    ) Ownable(_controller) ERC20("LendingPool LP", "pLP") {
        if (
            _oracle == address(0) ||
            _fiat == address(0) ||
            _registry == address(0)
        ) {
            revert LendingPoolLogic.ZeroAddress();
        }

        oracle = OracleInterface(_oracle);
        fiat = IERC20(_fiat);
        registry = FarmerRegistryInterface(_registry);

        uint256 chainId;
        assembly {
            chainId := chainid()
        }
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256(
                    "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
                ),
                keccak256(bytes("LendingPool")),
                keccak256(bytes("1")),
                chainId,
                address(this)
            )
        );
    }

    /* ========== LP Functions ========== */

    function supply(uint256 amount, address behalfOf) external nonReentrant {
        if (amount <= 0) revert LendingPoolLogic.ZeroAmount();
        if (behalfOf == address(0)) revert LendingPoolLogic.ZeroAccount();

        uint256 minted = LendingPoolLogic.calculateLPTokens(
            amount,
            totalSupply(),
            totalSupplied
        );

        fiat.transferFrom(msg.sender, address(this), amount);

        totalSupplied += amount;
        _mint(behalfOf, minted);

        emit Supplied(behalfOf, amount, minted);
    }

    function withdraw(uint256 amount) external nonReentrant {
        uint256 lpToBurn = LendingPoolLogic.calculateWithdrawal(
            amount,
            totalSupply(),
            totalSupplied,
            totalBorrowed
        );

        if (balanceOf(msg.sender) < lpToBurn)
            revert LendingPoolLogic.InsufficientLPBalance();

        _burn(msg.sender, lpToBurn);
        totalSupplied -= amount;

        fiat.transfer(msg.sender, amount);

        emit Withdrawn(msg.sender, amount, lpToBurn);
    }

    function withdrawable(address account) public view returns (uint256) {
        return
            LendingPoolLogic.calculateWithdrawalLP(
                balanceOf(account),
                totalSupply(),
                totalSupplied
            );
    }

    /* ========== Borrowing / Repayment ========== */

    function outstanding(address farmer) public view returns (uint256) {
        LendingPoolLogic.BorrowerPosition storage position = farmerPositions[
            farmer
        ];
        if (position.principal <= 0) return uint256(0);

        return
            position.principal +
            InterestLib.accruedInterest(
                position.principal,
                position.borrowedAt,
                borrowRateBp,
                MAX_BPS
            );
    }

    function borrow(uint256 amount) external nonReentrant returns (bool) {
        return _borrow(amount, msg.sender);
    }

    function borrowWithPermit(
        uint256 amount,
        address farmer,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external nonReentrant returns (bool) {
        uint256 nonce = nonces[farmer]++;

        LendingPoolLogic.validateBorrowPermit(
            DOMAIN_SEPARATOR,
            farmer,
            amount,
            nonce,
            deadline,
            v,
            r,
            s
        );

        return _borrow(amount, farmer);
    }

    function _borrow(uint256 amount, address behalfOf) internal returns (bool) {
        uint256 maxBorrowable = borrowable(behalfOf);
        uint256 currentOutstanding = outstanding(behalfOf);

        LendingPoolLogic.validateBorrow(
            amount,
            totalSupplied,
            totalBorrowed,
            maxBorrowable,
            currentOutstanding
        );

        uint256 newPrincipal = farmerPositions[behalfOf].updateBorrowerPosition(
            amount,
            borrowRateBp,
            MAX_BPS
        );

        totalBorrowed += amount;
        fiat.transfer(msg.sender, amount);

        emit Borrowed(behalfOf, amount, newPrincipal);
        return true;
    }

    function borrowable(address farmer) public view returns (uint256) {
        return
            LendingPoolLogic.calculateBorrowable(
                farmer,
                registry,
                oracle,
                fiat,
                loanToValueBp,
                MAX_BPS
            );
    }

    function repay(
        uint256 amount,
        address behalfOf
    ) external nonReentrant returns (uint256) {
        LendingPoolLogic.BorrowerPosition storage position = farmerPositions[
            behalfOf
        ];

        (
            uint256 remainingPrincipal,
            uint256 interestPaid,
            uint256 principalRepaid
        ) = position.processRepayment(amount, borrowRateBp, MAX_BPS);

        totalBorrowed -= principalRepaid;
        totalSupplied += interestPaid;

        fiat.transferFrom(msg.sender, address(this), amount);

        emit Repaid(behalfOf, amount, remainingPrincipal, interestPaid);
        return remainingPrincipal;
    }

    function ltvBps(address farmer) public view returns (uint256) {
        return
            LendingPoolLogic.calculateLtvBps(
                farmer,
                farmerPositions[farmer],
                registry,
                oracle,
                fiat,
                borrowRateBp,
                MAX_BPS
            );
    }

    function liquidate(address farmer) external nonReentrant {
        LendingPoolLogic.BorrowerPosition storage position = farmerPositions[
            farmer
        ];
        uint256 debt = LendingPoolLogic.validateLiquidation(
            farmer,
            position,
            registry,
            oracle,
            fiat,
            LIQUIDATION_BPS,
            borrowRateBp,
            MAX_BPS
        );

        fiat.transferFrom(msg.sender, address(this), debt);

        position.principal = 0;
        position.borrowedAt = 0;
        totalBorrowed -= debt;

        PledgeManagerInterface(registry.getManager(farmer)).liquidate(
            msg.sender
        );
        emit Repaid(farmer, debt, 0, 0);
    }

    function activatePledge() external {
        address pledgeManager = registry.getManager(msg.sender);
        if (pledgeManager == address(0))
            revert LendingPoolLogic.InvalidPledgeManager();
        PledgeManagerInterface(pledgeManager).setActive(true);
    }

    function deactivatePledge() external {
        if (outstanding(msg.sender) != 0) revert LendingPoolLogic.InDebt();

        address pledgeManager = registry.getManager(msg.sender);
        if (pledgeManager == address(0))
            revert LendingPoolLogic.InvalidPledgeManager();
        PledgeManagerInterface(pledgeManager).setActive(false);
    }

    /* ========== Admin Functions ========== */

    function setOracle(address _oracle) external onlyOwner {
        if (_oracle == address(0)) revert LendingPoolLogic.ZeroAddress();
        oracle = OracleInterface(_oracle);
    }

    function setLoanToValueBp(uint256 bps) external onlyOwner {
        if (bps <= 0 || bps > MAX_BPS) revert LendingPoolLogic.ZeroAmount();
        loanToValueBp = bps;
    }

    function setBorrowRateBp(uint256 bps) external onlyOwner {
        if (bps < 0 || bps > MAX_BPS) revert LendingPoolLogic.ZeroAmount();
        borrowRateBp = bps;
    }

    // ========== Others ========== //

    receive() external payable {}

    function decimals() public view override returns (uint8) {
        return IERC20Metadata(address(fiat)).decimals();
    }
}
