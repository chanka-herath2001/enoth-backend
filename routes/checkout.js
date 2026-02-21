const express = require('express');
const router = express.Router();
const stripe = require('../config/stripe');
const supabase = require('../config/supabase');

// Create Stripe Checkout Session
router.post('/create-session', async (req, res, next) => {
  try {
    const { items, customerEmail, customerName, shippingAddress } = req.body;

    // Validate required fields
    if (!items || !items.length) {
      return res.status(400).json({
        success: false,
        error: 'Cart items are required'
      });
    }

    if (!customerEmail || !customerName || !shippingAddress) {
      return res.status(400).json({
        success: false,
        error: 'Customer details and shipping address are required'
      });
    }

    // Fetch product details from database to ensure price integrity
    const productIds = items.map(item => item.productId);
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .in('id', productIds);

    if (productsError) throw productsError;

    // Build line items for Stripe
    const lineItems = items.map(item => {
      const product = products.find(p => p.id === item.productId);
      
      if (!product) {
        throw new Error(`Product ${item.productId} not found`);
      }

      // Check stock
      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}`);
      }

      return {
        price_data: {
          currency: 'lkr',
          product_data: {
            name: product.name,
            description: product.description,
            images: product.image_url ? [`${process.env.FRONTEND_URL}/assets/${product.image_url}`] : [],
          },
          unit_amount: Math.round(product.price * 100), // Convert to cents
        },
        quantity: item.quantity,
      };
    });

    // Calculate total
    const totalAmount = items.reduce((sum, item) => {
      const product = products.find(p => p.id === item.productId);
      return sum + (product.price * item.quantity);
    }, 0);

    // Create order in database (with pending status)
    const orderNumber = `ENOTH-${Date.now()}`;
    
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_email: customerEmail,
        customer_name: customerName,
        shipping_address: shippingAddress,
        total_amount: totalAmount,
        status: 'pending'
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Create order items
    const orderItems = items.map(item => {
      const product = products.find(p => p.id === item.productId);
      return {
        order_id: order.id,
        product_id: product.id,
        product_name: product.name,
        product_price: product.price,
        quantity: item.quantity
      };
    });

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      customer_email: customerEmail,
      client_reference_id: order.id,
      metadata: {
        order_id: order.id,
        order_number: orderNumber,
      },
      success_url: `${process.env.FRONTEND_URL}/order-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/cart`,
      shipping_address_collection: {
        allowed_countries: ['US', 'CA', 'GB', 'AU', 'LK'], // Add countries you ship to
      },
    });

    // Update order with session ID
    await supabase
      .from('orders')
      .update({ stripe_checkout_session_id: session.id })
      .eq('id', order.id);

    res.json({
      success: true,
      sessionId: session.id,
      url: session.url,
      orderId: order.id,
      orderNumber: orderNumber
    });

  } catch (error) {
    console.error('Checkout error:', error);
    next(error);
  }
});

// Get session details (for success page)
router.get('/session/:sessionId', async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Get order from database
    const { data: order, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('stripe_checkout_session_id', sessionId)
      .single();

    if (error) throw error;

    res.json({
      success: true,
      session: {
        id: session.id,
        payment_status: session.payment_status,
        customer_email: session.customer_email,
        amount_total: session.amount_total,
      },
      order
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
