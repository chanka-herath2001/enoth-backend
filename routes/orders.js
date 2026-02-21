const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// GET order by ID
router.get('/:orderId', async (req, res, next) => {
  try {
    const { orderId } = req.params;

    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *
        )
      `)
      .eq('id', orderId)
      .single();

    if (error) throw error;

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    res.json({
      success: true,
      order
    });
  } catch (error) {
    next(error);
  }
});

// GET order by order number
router.get('/number/:orderNumber', async (req, res, next) => {
  try {
    const { orderNumber } = req.params;

    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *
        )
      `)
      .eq('order_number', orderNumber)
      .single();

    if (error) throw error;

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    res.json({
      success: true,
      order
    });
  } catch (error) {
    next(error);
  }
});

// GET orders by customer email (for order history)
router.get('/customer/:email', async (req, res, next) => {
  try {
    const { email } = req.params;

    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *
        )
      `)
      .eq('customer_email', email)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
