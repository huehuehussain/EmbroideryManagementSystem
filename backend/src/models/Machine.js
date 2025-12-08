const pool = require('../config/database');

class Machine {
  static async findById(id) {
    const result = await pool.query('SELECT * FROM machines WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async getAll() {
    const result = await pool.query('SELECT * FROM machines ORDER BY name ASC');
    return result.rows;
  }

  static async create(machineData) {
    const { name, model, capacity_stitches_per_hour, supported_thread_colors, location } = machineData;
    const result = await pool.query(
      `INSERT INTO machines (name, model, capacity_stitches_per_hour, supported_thread_colors, location)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, model, capacity_stitches_per_hour, supported_thread_colors, location]
    );
    return result.rows[0];
  }

  static async update(id, machineData) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(machineData).forEach((key) => {
      fields.push(`${key} = $${paramCount++}`);
      values.push(machineData[key]);
    });

    values.push(id);

    if (fields.length === 0) return null;

    const result = await pool.query(
      `UPDATE machines SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0];
  }

  static async validateThreadColors(machineId, requiredColors) {
    const machine = await this.findById(machineId);
    if (!machine) return false;
    return requiredColors.every((color) => machine.supported_thread_colors.includes(color));
  }

  static async validateCapacity(machineId, estimatedStitches) {
    const machine = await this.findById(machineId);
    if (!machine) return false;
    return estimatedStitches <= machine.capacity_stitches_per_hour;
  }

  static async delete(id) {
    const result = await pool.query(
      `DELETE FROM machines WHERE id = $1 RETURNING *`,
      [id]
    );
    return result.rows[0];
  }
}

module.exports = Machine;
