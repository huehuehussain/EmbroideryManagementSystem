const Design = require('../models/Design');
const CONSTANTS = require('../utils/constants');
const path = require('path');
const fs = require('fs');

class DesignController {
  static async getAllDesigns(req, res) {
    try {
      const { status } = req.query;
      const designs = await Design.getAll(status);

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        designs,
      });
    } catch (error) {
      res.status(CONSTANTS.HTTP_STATUS.INTERNAL_ERROR).json({
        error: error.message,
      });
    }
  }

  static async getDesignById(req, res) {
    try {
      const { id } = req.params;
      const design = await Design.findById(id);

      if (!design) {
        return res.status(CONSTANTS.HTTP_STATUS.NOT_FOUND).json({
          error: 'Design not found',
        });
      }

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        design,
      });
    } catch (error) {
      res.status(CONSTANTS.HTTP_STATUS.INTERNAL_ERROR).json({
        error: error.message,
      });
    }
  }

  static async createDesign(req, res) {
    try {
      const { design_name, designer_name, inventory_items } = req.body;

      if (!design_name) {
        return res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
          error: 'Design name is required',
        });
      }

      const designData = {
        design_name,
        designer_name,
      };

      const design = await Design.create(designData, inventory_items || []);

      res.status(CONSTANTS.HTTP_STATUS.CREATED).json({
        message: 'Design created successfully',
        design,
      });
    } catch (error) {
      res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
        error: error.message,
      });
    }
  }

  static async approveDesign(req, res) {
    try {
      const { id } = req.params;
      const design = await Design.updateStatus(id, 'approved', req.user.id);

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        message: 'Design approved successfully',
        design,
      });
    } catch (error) {
      res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
        error: error.message,
      });
    }
  }

  static async rejectDesign(req, res) {
    try {
      const { id } = req.params;
      const { rejection_reason } = req.body;

      if (!rejection_reason) {
        return res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
          error: 'Rejection reason is required',
        });
      }

      const design = await Design.updateStatus(id, 'rejected', req.user.id, rejection_reason);

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        message: 'Design rejected successfully',
        design,
      });
    } catch (error) {
      res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
        error: error.message,
      });
    }
  }

  static async reviewDesign(req, res) {
    try {
      const { id } = req.params;
      const design = await Design.updateStatus(id, 'reviewed');

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        message: 'Design marked as reviewed',
        design,
      });
    } catch (error) {
      res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
        error: error.message,
      });
    }
  }

  static async updateDesign(req, res) {
    try {
      const { id } = req.params;
      const { design_name, designer_name, inventory_items } = req.body;

      if (!design_name) {
        return res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
          error: 'Design name is required',
        });
      }

      const design = await Design.update(id, {
        design_name,
        designer_name,
      }, inventory_items || []);

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        message: 'Design updated successfully',
        design,
      });
    } catch (error) {
      res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
        error: error.message,
      });
    }
  }

  static async deleteDesign(req, res) {
    try {
      const { id } = req.params;
      const design = await Design.findById(id);

      if (!design) {
        return res.status(CONSTANTS.HTTP_STATUS.NOT_FOUND).json({
          error: 'Design not found',
        });
      }

      // Delete file if exists
      if (design.design_file_path) {
        const filePath = path.join(__dirname, '../../', design.design_file_path);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      await Design.delete(id);

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        message: 'Design deleted successfully',
      });
    } catch (error) {
      res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
        error: error.message,
      });
    }
  }
}

module.exports = DesignController;
