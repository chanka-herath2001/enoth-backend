const express = require('express');
const router = express.Router();
const stripe = require('../config/stripe');
const supabase = require('../config/supabase');

// Stripe webhook handler
router.post('/', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;

      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

// Handle successful checkout session
async function handleCheckoutSessionCompleted(session) {
  console.log('✅ Checkout session completed:', session.id);

  const orderId = session.metadata.order_id || session.client_reference_id;

  if (!orderId) {
    console.error('No order ID found in session metadata');
    return;
  }

  // Update order status to paid
  const { error: orderError } = await supabase
    .from('orders')
    .update({
      status: 'paid',
      stripe_payment_intent_id: session.payment_intent,
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId);

  if (orderError) {
    console.error('Error updating order:', orderError);
    throw orderError;
  }

  // Get order items to update stock
  const { data: orderItems, error: itemsError } = await supabase
    .from('order_items')
    .select('product_id, quantity')
    .eq('order_id', orderId);

  if (itemsError) {
    console.error('Error fetching order items:', itemsError);
    throw itemsError;
  }

  // Decrease stock for each product
  for (const item of orderItems) {
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('stock')
      .eq('id', item.product_id)
      .single();

    if (productError) {
      console.error('Error fetching product:', productError);
      continue;
    }

    const newStock = product.stock - item.quantity;

    await supabase
      .from('products')
      .update({ 
        stock: Math.max(0, newStock), // Prevent negative stock
        updated_at: new Date().toISOString()
      })
      .eq('id', item.product_id);
  }

  console.log(`✅ Order ${orderId} marked as paid and stock updated`);

  // TODO: Send confirmation email to customer
  // You can integrate with services like SendGrid, Mailgun, or Resend here
}

// Handle successful payment intent
async function handlePaymentIntentSucceeded(paymentIntent) {
  console.log('💰 Payment succeeded:', paymentIntent.id);
  
  // Update order if needed
  const { error } = await supabase
    .from('orders')
    .update({
      status: 'paid',
      updated_at: new Date().toISOString()
    })
    .eq('stripe_payment_intent_id', paymentIntent.id);

  if (error) {
    console.error('Error updating order on payment success:', error);
  }
}

// Handle failed payment
async function handlePaymentIntentFailed(paymentIntent) {
  console.log('❌ Payment failed:', paymentIntent.id);

  const { error } = await supabase
    .from('orders')
    .update({
      status: 'failed',
      updated_at: new Date().toISOString()
    })
    .eq('stripe_payment_intent_id', paymentIntent.id);

  if (error) {
    console.error('Error updating order on payment failure:', error);
  }
}

module.exports = router;
