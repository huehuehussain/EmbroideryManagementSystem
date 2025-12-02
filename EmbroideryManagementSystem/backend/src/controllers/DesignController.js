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

  static async uploadDesign(req, res) {
    try {
      const { design_name, designer_name, estimated_stitches, estimated_thread_usage } = req.body;
      const file = req.file;

      if (!design_name || !file) {
        return res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
          error: 'Design name and file are required',
        });
      }

      const designData = {
        design_name,
        design_file_path: `/uploads/${file.filename}`,
        file_size: file.size,
        file_type: file.mimetype,
        designer_name,
        estimated_stitches,
        estimated_thread_usage,
      };

      const design = await Design.create(designData);

      res.status(CONSTANTS.HTTP_STATUS.CREATED).json({
        message: 'Design uploaded successfully',
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
}

module.exports = DesignController;
