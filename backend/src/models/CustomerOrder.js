const pool = require('../config/database');

class CustomerOrder {
  static async findById(id) {
    const result = await pool.query('SELECT * FROM customer_orders WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async findByOrderNumber(orderNumber) {
    const result = await pool.query('SELECT * FROM customer_orders WHERE order_number = $1', [orderNumber]);
    return result.rows[0];
  }

  static async getAll() {
    const result = await pool.query('SELECT * FROM customer_orders ORDER BY order_date DESC');
    return result.rows;
  }

  static async create(orderData) {
    const {
      order_number,
      customer_name,
      customer_email,
      customer_phone,
      delivery_address,
      required_delivery_date,
      total_quantity,
      total_price,
      notes,
    } = orderData;

    const result = await pool.query(
      `INSERT INTO customer_orders (order_number, customer_name, customer_email, customer_phone, delivery_address, required_delivery_date, total_quantity, total_price, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [order_number, customer_name, customer_email, customer_phone, delivery_address, required_delivery_date, total_quantity, total_price, notes]
    );
    return result.rows[0];
  }

  static async update(id, orderData) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(orderData).forEach((key) => {
      fields.push(`${key} = $${paramCount++}`);
      values.push(orderData[key]);
    });

    values.push(id);

    if (fields.length === 0) return null;

    const result = await pool.query(
      `UPDATE customer_orders SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0];
  }

  static async updateStatus(id, status) {
    const actualDeliveryDate = status === 'delivered' ? new Date() : null;
    const result = await pool.query(
      `UPDATE customer_orders SET status = $1, actual_delivery_date = $2 WHERE id = $3 RETURNING *`,
      [status, actualDeliveryDate, id]
    );
    return result.rows[0];
  }
}

module.exports = CustomerOrder;
