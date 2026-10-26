import { Request, Response } from 'express';
import { pool } from '../db.js';

export const recommendLeadPriority = async (req: Request, res: Response) => {
  try {
    const { monthlyBill, sanctionLoad, roofAreaSqFt, buyingIntent, source, notes } = req.body;

    const bill = Number(monthlyBill) || 0;
    const load = Number(sanctionLoad) || 0;
    const roof = Number(roofAreaSqFt) || 0;
    const notesLower = (notes || '').toLowerCase();
    const intentLower = (buyingIntent || '').toLowerCase();

    // Sizing estimation: 1 kW generates ~120 kWh/month. Average Indian tariff ~ ₹8/kWh
    const estKwFromBill = bill > 0 ? Math.round(bill / (8 * 120)) : 0;
    const estKw = Math.max(estKwFromBill, load);

    let recommendedPriority: 'Urgent' | 'High' | 'Medium' | 'Low' = 'Medium';
    let explanation = '';
    let followUpTarget = '';
    let score = 60;

    // Evaluate Urgent:
    // Commercial/Industrial capacity (>= 20kW) OR Bill >= 25,000 OR explicit urgent/emergency request
    if (
      bill >= 25000 || 
      load >= 20 || 
      estKw >= 20 || 
      notesLower.includes('urgent') || 
      notesLower.includes('immediate quote') || 
      notesLower.includes('factory') || 
      notesLower.includes('hospital') ||
      notesLower.includes('asap')
    ) {
      recommendedPriority = 'Urgent';
      explanation = `High-capacity installation (${estKw >= 20 ? estKw + ' kW Commercial/Industrial scale' : 'high energy bill ₹' + bill.toLocaleString('en-IN')}) requiring immediate executive attention.`;
      followUpTarget = 'Urgent callback within 2 hours';
      score = 95;
    } 
    // Evaluate High:
    // Substantial system (10-19kW) OR Bill 10,000-24,999 OR Immediate intent with bill >= 8,000
    else if (
      (bill >= 10000 && bill < 25000) || 
      (load >= 10 && load < 20) || 
      (estKw >= 10 && estKw < 20) || 
      (intentLower.includes('immediate') && bill >= 8000) ||
      source === 'Referral' ||
      notesLower.includes('ready')
    ) {
      recommendedPriority = 'High';
      explanation = `Substantial energy consumption (₹${bill.toLocaleString('en-IN')}/mo, ~${estKw} kW) with strong conversion probability.`;
      followUpTarget = 'Same-day contact within 4 hours';
      score = 80;
    }
    // Evaluate Low:
    // Low bill (<3000) AND small load (<3kW) OR intent is future (>3 months) OR under-construction
    else if (
      (bill > 0 && bill < 3000 && load < 3) ||
      intentLower.includes('future') ||
      intentLower.includes('budgetary') ||
      notesLower.includes('under construction') ||
      notesLower.includes('budget only') ||
      notesLower.includes('next year')
    ) {
      recommendedPriority = 'Low';
      explanation = 'Early-stage informational inquiry, lower consumption tier, or site under construction (timeline > 3 months).';
      followUpTarget = 'Educational nurture & follow-up within 5 days';
      score = 30;
    }
    // Evaluate Medium:
    // Standard PM Surya Ghar 3-9 kW residential rooftop (Bill ~ ₹3,000 - ₹9,999)
    else {
      recommendedPriority = 'Medium';
      const displayKw = Math.max(3, estKw || 3);
      explanation = `Standard residential rooftop system (~${displayKw} kW) eligible for PM Surya Ghar central government subsidy.`;
      followUpTarget = 'Standard discovery call within 24–48 hours';
      score = 60;
    }

    return res.json({
      success: true,
      data: {
        recommendedPriority,
        explanation,
        followUpTarget,
        estimatedKw: estKw,
        score
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const createLead = async (req: Request, res: Response) => {
  try {
    const l = req.body;

    // Server-side mandatory validation for Name, Mobile Number, and Pincode
    if (!l.name || !l.name.trim()) {
      return res.status(400).json({ success: false, error: 'Customer Name is mandatory' });
    }
    const cleanPhone = (l.phone || '').replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length !== 10) {
      return res.status(400).json({ success: false, error: 'A valid 10-digit Mobile Number is mandatory' });
    }
    if (!l.pincode || !l.pincode.toString().trim()) {
      return res.status(400).json({ success: false, error: 'Pincode is mandatory' });
    }

    // Server-side duplicate validation by phone
    if (cleanPhone.length >= 10) {
      const [existing]: any = await pool.query(
        'SELECT id, name, phone FROM leads WHERE REPLACE(REPLACE(REPLACE(phone, "-", ""), " ", ""), "+91", "") LIKE ? LIMIT 1',
        [`%${cleanPhone.slice(-10)}`]
      );
      if (existing && existing.length > 0) {
        return res.status(409).json({ 
          success: false, 
          error: `Duplicate lead: A lead with phone ${l.phone} already exists (${existing[0].name} - ${existing[0].id})`,
          existingLead: existing[0]
        });
      }
    }

    // Automatic collision prevention for primary key ID
    let finalId = l.id || `LD-2026-${Date.now().toString().slice(-4)}`;
    const [existingId]: any = await pool.query('SELECT id FROM leads WHERE id = ? LIMIT 1', [finalId]);
    if (existingId && existingId.length > 0) {
      const [allIds]: any = await pool.query("SELECT id FROM leads WHERE id LIKE 'LD-2026-%'");
      let maxNum = 28;
      for (const row of allIds) {
        const match = row.id.match(/LD-2026-(\d+)/);
        if (match) {
          const n = parseInt(match[1], 10);
          if (n > maxNum) maxNum = n;
        }
      }
      finalId = `LD-2026-${String(maxNum + 1).padStart(3, '0')}`;
      l.id = finalId;
    }

    const customerType = l.customerType || l.customer_type || 'Residential';
    const systemType = l.systemType || l.system_type || 'On-Grid';

    await pool.query(
      `INSERT INTO leads (id, name, email, phone, city, state, address, pincode, source, status, priority, recommended_priority, priority_override_reason, buying_intent, assigned_to_id, assigned_to_name, monthly_bill, sanction_load, roof_area_sqft, roof_type, recommended_kw, estimated_budget, notes, customer_type, system_type, created_at, updated_at, last_contacted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        l.id, l.name.trim(), l.email || null, cleanPhone, l.city || '', l.state || '', l.address || '', l.pincode.toString().trim(),
        l.source || 'Website', l.status || 'New', l.priority || 'Medium',
        l.recommendedPriority || null, l.priorityOverrideReason || null, l.buyingIntent || null,
        l.assignedToId || 'EMP-02', l.assignedToName || 'Ananya Deshmukh', l.monthlyBill || 0,
        l.sanctionLoad || 0, l.roofAreaSqFt || 0, l.roofType || null, l.recommendedKw || 0,
        l.estimatedBudget || 0, l.notes || '', customerType, systemType,
        l.createdAt || new Date().toISOString(), l.updatedAt || new Date().toISOString(), l.lastContactedAt || null
      ]
    );

    l.customerType = customerType;
    l.systemType = systemType;
    res.json({ success: true, lead: l });
  } catch (err: any) {
    console.error('Error creating lead:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

export const updateLead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) {
      if (!updates.name.trim()) return res.status(400).json({ success: false, error: 'Customer Name cannot be empty' });
      fields.push('name = ?'); values.push(updates.name.trim());
    }
    if (updates.phone !== undefined) {
      const clean = updates.phone.replace(/\D/g, '');
      if (clean.length !== 10) return res.status(400).json({ success: false, error: 'Mobile number must be 10 digits' });
      fields.push('phone = ?'); values.push(clean);
    }
    if (updates.pincode !== undefined) {
      if (!updates.pincode.toString().trim()) return res.status(400).json({ success: false, error: 'Pincode cannot be empty' });
      fields.push('pincode = ?'); values.push(updates.pincode.toString().trim());
    }
    if (updates.status !== undefined) { fields.push('status = ?'); values.push(updates.status); }
    if (updates.priority !== undefined) { fields.push('priority = ?'); values.push(updates.priority); }
    if (updates.recommendedPriority !== undefined) { fields.push('recommended_priority = ?'); values.push(updates.recommendedPriority); }
    if (updates.priorityOverrideReason !== undefined) { fields.push('priority_override_reason = ?'); values.push(updates.priorityOverrideReason); }
    if (updates.customerType !== undefined || updates.customer_type !== undefined) {
      fields.push('customer_type = ?'); values.push(updates.customerType || updates.customer_type);
    }
    if (updates.systemType !== undefined || updates.system_type !== undefined) {
      fields.push('system_type = ?'); values.push(updates.systemType || updates.system_type);
    }
    if (updates.notes !== undefined) { fields.push('notes = ?'); values.push(updates.notes); }
    if (updates.updatedAt !== undefined) { fields.push('updated_at = ?'); values.push(updates.updatedAt); }
    if (updates.assignedToId !== undefined) { fields.push('assigned_to_id = ?'); values.push(updates.assignedToId); }
    if (updates.assignedToName !== undefined) { fields.push('assigned_to_name = ?'); values.push(updates.assignedToName); }

    if (fields.length > 0) {
      values.push(id);
      await pool.query(`UPDATE leads SET ${fields.join(', ')} WHERE id = ?`, values);
    }
    res.json({ success: true, id, updates });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};


export const deleteLead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM leads WHERE id = ?', [id]);
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
