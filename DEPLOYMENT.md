# Deployment Guide - Wallet P&L Tracker

This guide covers deploying the Wallet P&L Tracker agent to make it reachable via the x402 protocol.

## Prerequisites

- Node.js 20.x or higher
- API keys for blockchain explorers
- CoinGecko API key (optional, but recommended for better rate limits)
- Domain name for deployment
- Server with public IP (VPS, cloud instance, etc.)

## Step 1: Get API Keys

### Blockchain Explorer APIs (Required)

Get free API keys from these block explorers:

1. **Etherscan** (Ethereum): https://etherscan.io/apis
2. **Basescan** (Base): https://basescan.org/apis
3. **Arbiscan** (Arbitrum): https://arbiscan.io/apis
4. **Optimistic Etherscan** (Optimism): https://optimistic.etherscan.io/apis
5. **Polygonscan** (Polygon): https://polygonscan.com/apis
6. **BscScan** (BSC): https://bscscan.com/apis

Each service offers a free tier with rate limits (usually 5 calls/second).

### CoinGecko API (Optional)

- **Free**: https://www.coingecko.com/en/api (limited to 10-50 calls/minute)
- **Pro**: https://www.coingecko.com/en/api/pricing (higher rate limits)

## Step 2: Environment Configuration

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` and add your API keys:

```env
# Blockchain Explorer API Keys
ETHERSCAN_API_KEY=your_actual_etherscan_api_key
BASESCAN_API_KEY=your_actual_basescan_api_key
ARBISCAN_API_KEY=your_actual_arbiscan_api_key
OPTIMISTIC_ETHERSCAN_API_KEY=your_actual_optimistic_etherscan_api_key
POLYGONSCAN_API_KEY=your_actual_polygonscan_api_key
BSCSCAN_API_KEY=your_actual_bscscan_api_key

# Price Data APIs
COINGECKO_API_KEY=your_coingecko_api_key_if_you_have_pro

# Cache Settings (optional - defaults shown)
CACHE_TTL_TRANSACTIONS=600  # 10 minutes
CACHE_TTL_PRICES=120        # 2 minutes

# Agent Settings
PORT=3000
NODE_ENV=production
```

## Step 3: Install and Build

```bash
# Install dependencies
npm install

# Build the project
npm run build
```

## Step 4: Test Locally

Before deploying, test the agent locally with a real wallet address:

```bash
npm run dev
```

Then test by calling the agent (see Testing section below).

## Step 5: Deploy to Server

### Option A: Deploy to VPS/Cloud Server

1. **Setup Server**
   ```bash
   # SSH into your server
   ssh user@your-server.com

   # Install Node.js 20+
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # Install PM2 for process management
   sudo npm install -g pm2
   ```

2. **Upload Code**
   ```bash
   # From your local machine
   rsync -avz --exclude node_modules --exclude dist \
     . user@your-server.com:/var/www/wallet-pnl-tracker/
   ```

3. **Install and Start**
   ```bash
   # On the server
   cd /var/www/wallet-pnl-tracker
   npm install
   npm run build

   # Start with PM2
   pm2 start dist/index.js --name wallet-pnl-tracker
   pm2 save
   pm2 startup
   ```

4. **Setup Reverse Proxy (Nginx)**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

5. **Setup SSL with Let's Encrypt**
   ```bash
   sudo apt-get install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

### Option B: Deploy to Vercel/Railway/Render

These platforms support Node.js apps and can auto-deploy from Git:

1. **Vercel**: https://vercel.com/
2. **Railway**: https://railway.app/
3. **Render**: https://render.com/

Simply connect your GitHub repo and set environment variables in the dashboard.

## Step 6: Configure x402 Protocol

The agent uses `@lucid-dreams/agent-kit` which includes built-in x402 protocol support.

### Register Your Agent

1. Deploy your agent to a public URL (e.g., `https://wallet-pnl.yourdomain.com`)

2. The agent will automatically expose x402 payment endpoints

3. Register your agent in the x402 directory (follow @lucid-dreams documentation)

### Payment Configuration

The agent includes a mock x402 payment handler for testing. In production, you'll want to:

1. Configure real payment rails (Lightning, Base, Ethereum)
2. Set pricing for API calls
3. Implement payment verification

Example x402 payment flow:
```
1. Client requests P&L calculation
2. Agent returns x402 payment request (e.g., 100 sats)
3. Client pays via Lightning/Base
4. Agent verifies payment
5. Agent returns P&L data
```

## Step 7: Monitoring and Maintenance

### Monitoring

```bash
# View logs with PM2
pm2 logs wallet-pnl-tracker

# Monitor resource usage
pm2 monit
```

### Maintenance

```bash
# Restart agent
pm2 restart wallet-pnl-tracker

# Update code
git pull
npm install
npm run build
pm2 restart wallet-pnl-tracker
```

## Testing Your Deployment

### Test the Agent

```bash
# Test endpoint
curl https://your-domain.com/api/test

# Calculate P&L for a wallet
curl -X POST https://your-domain.com/api/calculate_pnl \
  -H "Content-Type: application/json" \
  -d '{
    "wallet_address": "0x...",
    "chains": ["ethereum", "base"],
    "cost_basis_method": "fifo"
  }'
```

### Test x402 Payment

```bash
# Simulate payment
curl -X POST https://your-domain.com/api/mock_x402_payment \
  -H "Content-Type: application/json" \
  -d '{
    "amount_usd": 0.10,
    "payment_method": "lightning"
  }'
```

## Performance Optimization

### Caching

The agent uses in-memory caching by default. For production:

- Consider Redis for distributed caching
- Adjust cache TTL values in `.env`
- Monitor cache hit rates with `cache_stats` endpoint

### Rate Limiting

To avoid API rate limits:

- Use paid API tiers for high-volume usage
- Implement request queuing
- Cache aggressively
- Consider running multiple instances with load balancing

### Scaling

For high traffic:

```bash
# Run multiple instances with PM2
pm2 start dist/index.js -i max --name wallet-pnl-tracker
```

## Security Considerations

1. **API Keys**: Never commit `.env` file to git
2. **HTTPS**: Always use SSL/TLS in production
3. **Rate Limiting**: Implement rate limiting per user
4. **Input Validation**: All inputs are validated with Zod schemas
5. **CORS**: Configure CORS appropriately for your use case

## Troubleshooting

### API Rate Limits

If you hit rate limits:
- Check cache is working: `curl https://your-domain.com/api/cache_stats`
- Clear cache if needed: `curl -X POST https://your-domain.com/api/clear_cache`
- Upgrade to paid API tiers
- Implement request throttling

### No Transactions Found

- Verify wallet address is correct
- Check API keys are valid
- Verify the wallet has activity on the selected chains
- Check API responses in logs

### Price Data Issues

- CoinGecko free tier has strict rate limits
- Consider upgrading to CoinGecko Pro
- Historical prices may not be available for all tokens
- Add custom token mappings if needed

## Support

For issues related to:
- **Agent Kit**: https://github.com/lucid-dreams/agent-kit
- **x402 Protocol**: https://x402.org/docs
- **This Agent**: Open an issue in the repository

## Cost Estimation

### API Costs (Free Tier)

- **Blockchain Explorers**: Free (5 calls/sec limit)
- **CoinGecko Free**: Free (10-50 calls/min)
- **Hosting**: $5-20/month (VPS/cloud)

### API Costs (Paid Tier)

- **CoinGecko Pro**: $129-999/month
- **Etherscan Pro**: $99-499/month (per chain)
- **Hosting**: $5-50/month depending on scale

### Revenue via x402

Set pricing based on costs:
- Example: $0.01-0.10 per P&L calculation
- Lightning Network: Instant micropayments
- Base: Low-fee Layer 2 transactions
