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

export const createProduct = async (req: Request, res: Response) => {
  try {
    const p = req.body;
    const id = p.id || `PROD-${Date.now().toString().slice(-4)}`;
    await pool.query(
      `INSERT INTO inventory_products (
        id, sku, name, category, brand, specifications, unit,
        current_stock, reserved_stock, available_stock, min_threshold,
        unit_cost, supplier_name
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        current_stock = VALUES(current_stock),
        available_stock = VALUES(available_stock),
        unit_cost = VALUES(unit_cost)`,
      [
        id, p.sku || id, p.name, p.category || 'Solar Panels', p.brand || '', p.specifications || '', p.unit || 'Nos',
        Number(p.currentStock ?? p.current_stock ?? 0), Number(p.reservedStock ?? p.reserved_stock ?? 0),
        Number(p.availableStock ?? p.available_stock ?? p.currentStock ?? 0), Number(p.minThreshold ?? p.min_threshold ?? 0),
        Number(p.unitCost ?? p.unit_cost ?? 0), p.supplierName || p.supplier_name || ''
      ]
    );
    res.json({ success: true, id, product: { ...p, id } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM inventory_products WHERE id = ? OR sku = ?', [id, id]);
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const clearAllProducts = async (req: Request, res: Response) => {
  try {
    await pool.query('TRUNCATE TABLE inventory_products');
    res.json({ success: true, message: 'All inventory products cleared' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
