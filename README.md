# ENOTH Backend API

Full-stack e-commerce backend for ENOTH fashion brand with Stripe payments and Supabase database.

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** Supabase (PostgreSQL)
- **Payments:** Stripe
- **Hosting:** Railway / Render (free tier)

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the backend directory:

```bash
cp .env.example .env
```

Fill in your credentials:

```env
# Supabase (from https://supabase.com → Project Settings → API)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_role_key

# Stripe (from https://dashboard.stripe.com/test/apikeys)
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx  # Get this after setting up webhooks

# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### 3. Set Up Database

1. Go to Supabase SQL Editor
2. Run the SQL in `schema.sql`
3. Verify tables are created

### 4. Run Development Server

```bash
npm run dev
```

Server will start on `http://localhost:5000`

### 5. Test the API

```bash
# Health check
curl http://localhost:5000/api/health

# Get all products
curl http://localhost:5000/api/products

# Get products by collection
curl http://localhost:5000/api/products/collection/Spring%202026
```

## API Endpoints

### Products

- `GET /api/products` - Get all products
  - Query params: `collection`, `category`, `tag`
- `GET /api/products/:id` - Get single product
- `GET /api/products/collection/:name` - Get products by collection
- `GET /api/products/meta/collections` - Get all collections

### Checkout

- `POST /api/checkout/create-session` - Create Stripe checkout session
  - Body: `{ items, customerEmail, customerName, shippingAddress }`
- `GET /api/checkout/session/:sessionId` - Get checkout session details

### Orders

- `GET /api/orders/:orderId` - Get order by ID
- `GET /api/orders/number/:orderNumber` - Get order by order number
- `GET /api/orders/customer/:email` - Get customer order history

### Webhooks

- `POST /api/webhooks` - Stripe webhook endpoint (handles payment events)

## Stripe Webhook Setup

### Development (Local Testing)

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login: `stripe login`
3. Forward webhooks to local server:
   ```bash
   stripe listen --forward-to localhost:5000/api/webhooks
   ```
4. Copy the webhook signing secret (starts with `whsec_`) to `.env`

### Production

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-api-url.com/api/webhooks`
3. Select events to listen to:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
4. Copy webhook signing secret to production environment variables

## Deployment

### Option 1: Railway (Recommended)

1. Create account at https://railway.app
2. New Project → Deploy from GitHub
3. Select your repo
4. Add environment variables in Railway dashboard
5. Deploy!

Railway provides:
- Free $5/month credit
- Automatic HTTPS
- Easy environment variable management

### Option 2: Render

1. Create account at https://render.com
2. New Web Service → Connect GitHub
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Add environment variables
6. Deploy!

Render provides:
- Free tier (750 hours/month)
- Auto-deploy on git push
- Free SSL

## Project Structure

```
backend/
├── config/
│   ├── supabase.js      # Supabase client
│   └── stripe.js        # Stripe client
├── routes/
│   ├── products.js      # Product endpoints
│   ├── orders.js        # Order endpoints
│   ├── checkout.js      # Checkout/payment endpoints
│   └── webhooks.js      # Stripe webhooks
├── .env.example         # Environment variables template
├── .gitignore          # Git ignore file
├── package.json        # Dependencies
├── schema.sql          # Database schema
└── server.js           # Main server file
```

## Testing Payments

Use Stripe test cards:

- **Success:** 4242 4242 4242 4242
- **Decline:** 4000 0000 0000 0002
- **3D Secure:** 4000 0025 0000 3155

Any future expiry date, any 3-digit CVC, any 5-digit ZIP.

## Security Notes

- Never commit `.env` file
- Use `SUPABASE_SERVICE_KEY` only in backend
- Verify webhook signatures
- Validate all user inputs
- Use HTTPS in production
- Keep dependencies updated

## Support

For issues or questions:
- Check Supabase logs in dashboard
- Check Stripe logs in dashboard
- Check server logs: `heroku logs --tail` or Railway/Render logs

## Next Steps

1. Add email notifications (SendGrid/Resend)
2. Add admin dashboard for order management
3. Implement inventory alerts
4. Add product image uploads
5. Set up automated testing
