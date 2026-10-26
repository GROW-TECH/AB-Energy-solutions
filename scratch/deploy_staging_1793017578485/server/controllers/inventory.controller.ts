import { Request, Response } from 'express';
import { pool } from '../db.js';

export const reserveInventory = async (req: Request, res: Response) => {
  try {
    const { category, quantity, sku, productId } = req.body;
    const qty = Number(quantity) || 0;

    if (qty > 0) {
      if (productId || sku) {
        await pool.query(
          `UPDATE inventory_products 
           SET reserved_stock = reserved_stock + ?, available_stock = GREATEST(0, available_stock - ?)
           WHERE id = ? OR sku = ? LIMIT 1`,
          [qty, qty, productId || '', sku || '']
        );
      } else if (category) {
        await pool.query(
          `UPDATE inventory_products 
           SET reserved_stock = reserved_stock + ?, available_stock = GREATEST(0, available_stock - ?)
           WHERE category = ? LIMIT 1`,
          [qty, qty, category]
        );
      }
    }

    res.json({ success: true, category, sku, productId, quantity: qty });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
