// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PayStream
 * @notice Zincir üstü tekrarlayan USDC ödeme protokolü
 * @dev Arc Testnet üzerinde USDC ile abonelik ve otomatik ödeme yönetimi
 */
contract PayStream is ReentrancyGuard, Ownable {
    IERC20 public immutable usdc;

    // Protokol fee: 50 = %0.5 (10000 üzerinden)
    uint256 public protocolFeeBps = 50;
    uint256 public collectedFees;

    struct Subscription {
        address subscriber;
        address recipient;
        uint256 amount;       // USDC miktarı (6 decimals)
        uint256 interval;     // saniye cinsinden (örn. 30 gün = 2592000)
        uint256 lastPayment;  // son ödeme timestamp
        uint256 nextPayment;  // bir sonraki ödeme timestamp
        bool active;
    }

    // subscriptionId => Subscription
    mapping(uint256 => Subscription) public subscriptions;
    uint256 public nextSubId;

    // subscriber => subscriptionId listesi
    mapping(address => uint256[]) public subscriberSubs;
    // recipient => subscriptionId listesi
    mapping(address => uint256[]) public recipientSubs;

    // --- Events ---
    event SubscriptionCreated(
        uint256 indexed subId,
        address indexed subscriber,
        address indexed recipient,
        uint256 amount,
        uint256 interval
    );
    event PaymentExecuted(
        uint256 indexed subId,
        address indexed subscriber,
        address indexed recipient,
        uint256 amount,
        uint256 fee
    );
    event SubscriptionCancelled(uint256 indexed subId, address indexed by);
    event FeesWithdrawn(address indexed to, uint256 amount);

    constructor(address _usdc) Ownable(msg.sender) {
        usdc = IERC20(_usdc);
    }

    /**
     * @notice Yeni abonelik oluştur
     * @param recipient Ödeme alacak adres
     * @param amount Her dönemde ödenecek USDC miktarı
     * @param interval Ödeme aralığı (saniye)
     * @param startNow İlk ödemeyi hemen yap
     */
    function createSubscription(
        address recipient,
        uint256 amount,
        uint256 interval,
        bool startNow
    ) external nonReentrant returns (uint256 subId) {
        require(recipient != address(0), "Gecersiz alici");
        require(amount > 0, "Miktar sifir olamaz");
        require(interval >= 60, "Minimum 60 saniye aralik");

        subId = nextSubId++;

        uint256 firstPayment = startNow ? block.timestamp : block.timestamp + interval;

        subscriptions[subId] = Subscription({
            subscriber: msg.sender,
            recipient: recipient,
            amount: amount,
            interval: interval,
            lastPayment: 0,
            nextPayment: firstPayment,
            active: true
        });

        subscriberSubs[msg.sender].push(subId);
        recipientSubs[recipient].push(subId);

        emit SubscriptionCreated(subId, msg.sender, recipient, amount, interval);

        // İlk ödemeyi hemen yap
        if (startNow) {
            _executePayment(subId);
        }
    }

    /**
     * @notice Vadesi gelen ödemeyi çalıştır (herkes tetikleyebilir)
     * @param subId Abonelik ID
     */
    function executePayment(uint256 subId) external nonReentrant {
        _executePayment(subId);
    }

    function _executePayment(uint256 subId) internal {
        Subscription storage sub = subscriptions[subId];
        require(sub.active, "Abonelik aktif degil");
        require(block.timestamp >= sub.nextPayment, "Henuz odeme zamani gelmedi");

        uint256 fee = (sub.amount * protocolFeeBps) / 10000;
        uint256 netAmount = sub.amount - fee;

        // Subscriber'dan çek
        require(
            usdc.transferFrom(sub.subscriber, sub.recipient, netAmount),
            "Transfer basarisiz"
        );

        if (fee > 0) {
            require(
                usdc.transferFrom(sub.subscriber, address(this), fee),
                "Fee transfer basarisiz"
            );
            collectedFees += fee;
        }

        sub.lastPayment = block.timestamp;
        sub.nextPayment = block.timestamp + sub.interval;

        emit PaymentExecuted(subId, sub.subscriber, sub.recipient, netAmount, fee);
    }

    /**
     * @notice Aboneliği iptal et (subscriber veya recipient)
     */
    function cancelSubscription(uint256 subId) external {
        Subscription storage sub = subscriptions[subId];
        require(
            msg.sender == sub.subscriber || msg.sender == sub.recipient,
            "Yetkisiz"
        );
        require(sub.active, "Zaten iptal edilmis");

        sub.active = false;
        emit SubscriptionCancelled(subId, msg.sender);
    }

    /**
     * @notice Birden fazla ödemeyi tek tx'te çalıştır
     */
    function batchExecutePayments(uint256[] calldata subIds) external nonReentrant {
        for (uint256 i = 0; i < subIds.length; i++) {
            Subscription storage sub = subscriptions[subIds[i]];
            if (sub.active && block.timestamp >= sub.nextPayment) {
                _executePayment(subIds[i]);
            }
        }
    }

    /**
     * @notice Aboneliğin ödemeye hazır olup olmadığını kontrol et
     */
    function isDue(uint256 subId) external view returns (bool) {
        Subscription storage sub = subscriptions[subId];
        return sub.active && block.timestamp >= sub.nextPayment;
    }

    /**
     * @notice Subscriber'ın tüm aboneliklerini getir
     */
    function getSubscriberSubs(address subscriber) external view returns (uint256[] memory) {
        return subscriberSubs[subscriber];
    }

    /**
     * @notice Recipient'ın tüm aboneliklerini getir
     */
    function getRecipientSubs(address recipient) external view returns (uint256[] memory) {
        return recipientSubs[recipient];
    }

    // --- Admin ---
    function setProtocolFee(uint256 newFeeBps) external onlyOwner {
        require(newFeeBps <= 500, "Max %5 fee");
        protocolFeeBps = newFeeBps;
    }

    function withdrawFees(address to) external onlyOwner {
        uint256 amount = collectedFees;
        collectedFees = 0;
        require(usdc.transfer(to, amount), "Withdraw basarisiz");
        emit FeesWithdrawn(to, amount);
    }
}
