# PayStream

Arc Testnet üzerinde USDC ile zincir üstü abonelik ve tekrarlayan ödeme protokolü.

## Kurulum

```bash
npm install
```

## Kontrat

```bash
# Compile
npm run compile

# Test
npm run test

# Deploy (önce .env dosyasını doldur)
cp .env.example .env
npm run deploy:testnet
```

## .env

```
PRIVATE_KEY=cüzdan_private_key
USDC_ADDRESS=arc_testnet_usdc_adresi
```

Arc Testnet USDC almak için: https://faucet.circle.com

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Deploy sonrası `frontend/lib/wagmi.ts` içindeki `PAYSTREAM_ADDRESS` ve `USDC_ADDRESS` değerlerini güncelle.

## Özellikler

- USDC ile tekrarlayan ödeme (günlük / haftalık / aylık)
- Pull payment modeli (subscriber approve eder, herkes tetikleyebilir)
- %0.5 protokol fee
- Batch ödeme çalıştırma
- Abonelik iptal etme
