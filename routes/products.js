const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// GET all products
router.get('/', async (req, res, next) => {
  try {
    const { collection, category, tag, is_active = true } = req.query;

    let query = supabase
      .from('products')
      .select('*')
      .eq('is_active', is_active)
      .order('created_at', { ascending: false });

    // Apply filters if provided
    if (collection) {
      query = query.eq('collection', collection);
    }
    if (category) {
      query = query.eq('category', category);
    }
    if (tag) {
      query = query.eq('tag', tag);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      count: data.length,
      products: data
    });
  } catch (error) {
    next(error);
  }
});

// GET single product by ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    res.json({
      success: true,
      product: data
    });
  } catch (error) {
    next(error);
  }
});

// GET products by collection
router.get('/collection/:collectionName', async (req, res, next) => {
  try {
    const { collectionName } = req.params;

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('collection', collectionName)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      collection: collectionName,
      count: data.length,
      products: data
    });
  } catch (error) {
    next(error);
  }
});

// GET all collections
router.get('/meta/collections', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      count: data.length,
      collections: data
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
