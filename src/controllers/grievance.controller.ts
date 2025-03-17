import { Request, Response } from 'express';
import { GrievanceService } from '../services/grievance.service';
import { GrievanceStatus, GrievanceCategory, GrievancePriority } from '../models/Grievance';
import { AuthRequest } from '../types/auth.types';
import multer from 'multer';

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
}).array('attachments', 5); // Allow up to 5 attachments

export class GrievanceController {
  private grievanceService: GrievanceService;

  constructor() {
    this.grievanceService = new GrievanceService();
  }

  /**
   * Submit a new grievance
   */
  submitGrievance = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required'
        });
      }

      const { subject, description, category, isAnonymous, priority } = req.body;

      // Validate required fields
      if (!subject || !description || !category) {
        return res.status(400).json({
          status: 'error',
          message: 'Please provide all required fields: subject, description, category'
        });
      }

      // Validate category
      if (!Object.values(GrievanceCategory).includes(category as GrievanceCategory)) {
        return res.status(400).json({
          status: 'error',
          message: `Invalid category. Must be one of: ${Object.values(GrievanceCategory).join(', ')}`
        });
      }

      // Create grievance
      const grievance = await this.grievanceService.submitGrievance({
        subject,
        description,
        category: category as GrievanceCategory,
        submitterId: req.user.id,
        priority: priority as GrievancePriority,
        isAnonymous: isAnonymous === 'true' || isAnonymous === true
      });

      return res.status(201).json({
        status: 'success',
        message: 'Grievance submitted successfully',
        data: grievance
      });
    } catch (error) {
      return res.status(400).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to submit grievance'
      });
    }
  };

  /**
   * Upload attachments for a grievance
   */
  uploadAttachments = async (req: AuthRequest, res: Response): Promise<Response> => {
    return new Promise((resolve) => {
      upload(req, res, async (err) => {
        if (err) {
          resolve(res.status(400).json({
            status: 'error',
            message: 'Attachment upload failed: ' + err.message
          }));
          return;
        }

        try {
          if (!req.user || !req.user.id) {
            resolve(res.status(401).json({
              status: 'error',
              message: 'Authentication required'
            }));
            return;
          }

          const { id } = req.params;
          const files = req.files as Express.Multer.File[];

          if (!files || files.length === 0) {
            resolve(res.status(400).json({
              status: 'error',
              message: 'Please upload at least one attachment'
            }));
            return;
          }

          const grievance = await this.grievanceService.uploadAttachments(
            id,
            files.map(file => ({
              buffer: file.buffer,
              originalname: file.originalname
            }))
          );

          resolve(res.status(200).json({
            status: 'success',
            message: 'Attachments uploaded successfully',
            data: grievance
          }));
        } catch (error) {
          resolve(res.status(400).json({
            status: 'error',
            message: error instanceof Error ? error.message : 'Failed to upload attachments'
          }));
        }
      });
    });
  };

  /**
   * Update grievance status
   */
  updateStatus = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required'
        });
      }

      const { id } = req.params;
      const { status, comments, assignedTo } = req.body;

      if (!status || !Object.values(GrievanceStatus).includes(status as GrievanceStatus)) {
        return res.status(400).json({
          status: 'error',
          message: `Invalid status. Must be one of: ${Object.values(GrievanceStatus).join(', ')}`
        });
      }

      const grievance = await this.grievanceService.updateGrievanceStatus(
        id,
        status as GrievanceStatus,
        comments,
        assignedTo
      );

      return res.status(200).json({
        status: 'success',
        message: 'Grievance status updated successfully',
        data: grievance
      });
    } catch (error) {
      return res.status(400).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to update grievance status'
      });
    }
  };

  /**
   * Add resolution to a grievance
   */
  addResolution = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required'
        });
      }

      const { id } = req.params;
      const { resolution } = req.body;

      if (!resolution) {
        return res.status(400).json({
          status: 'error',
          message: 'Please provide a resolution'
        });
      }

      const grievance = await this.grievanceService.addResolution(id, resolution);

      return res.status(200).json({
        status: 'success',
        message: 'Grievance resolved successfully',
        data: grievance
      });
    } catch (error) {
      return res.status(400).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to resolve grievance'
      });
    }
  };

  /**
   * Get all grievances
   */
  getAllGrievances = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { status, category, priority, submitterId, assignedTo } = req.query;

      const filters = {
        status: status as GrievanceStatus,
        category: category as GrievanceCategory,
        priority: priority as GrievancePriority,
        submitterId: submitterId as string,
        assignedTo: assignedTo as string
      };

      const grievances = await this.grievanceService.getAllGrievances(filters);

      return res.status(200).json({
        status: 'success',
        message: 'Grievances retrieved successfully',
        results: grievances.length,
        data: grievances
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to retrieve grievances'
      });
    }
  };

  /**
   * Get grievance by ID
   */
  getGrievanceById = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const grievance = await this.grievanceService.getGrievanceById(id, userId);

      return res.status(200).json({
        status: 'success',
        message: 'Grievance retrieved successfully',
        data: grievance
      });
    } catch (error) {
      return res.status(404).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Grievance not found'
      });
    }
  };

  /**
   * Get my grievances (for current user)
   */
  getMyGrievances = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required'
        });
      }

      const grievances = await this.grievanceService.getAllGrievances({
        submitterId: req.user.id
      });

      return res.status(200).json({
        status: 'success',
        message: 'Your grievances retrieved successfully',
        results: grievances.length,
        data: grievances
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to retrieve grievances'
      });
    }
  };

  /**
   * Get assigned grievances (for staff assigned to handle grievances)
   */
  getAssignedGrievances = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required'
        });
      }

      const grievances = await this.grievanceService.getAllGrievances({
        assignedTo: req.user.id
      });

      return res.status(200).json({
        status: 'success',
        message: 'Assigned grievances retrieved successfully',
        results: grievances.length,
        data: grievances
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to retrieve grievances'
      });
    }
  };

  /**
   * Update grievance
   */
  updateGrievance = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required'
        });
      }

      const { id } = req.params;
      const { subject, description, category, priority, isAnonymous } = req.body;

      const updateData: any = {};
      if (subject) updateData.subject = subject;
      if (description) updateData.description = description;
      if (category && Object.values(GrievanceCategory).includes(category as GrievanceCategory)) {
        updateData.category = category;
      }
      if (priority && Object.values(GrievancePriority).includes(priority as GrievancePriority)) {
        updateData.priority = priority;
      }
      if (isAnonymous !== undefined) {
        updateData.isAnonymous = isAnonymous === 'true' || isAnonymous === true;
      }

      const grievance = await this.grievanceService.updateGrievance(id, req.user.id, updateData);

      return res.status(200).json({
        status: 'success',
        message: 'Grievance updated successfully',
        data: grievance
      });
    } catch (error) {
      return res.status(400).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to update grievance'
      });
    }
  };

  /**
   * Delete grievance
   */
  deleteGrievance = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required'
        });
      }

      const { id } = req.params;
      await this.grievanceService.deleteGrievance(id, req.user.id);

      return res.status(200).json({
        status: 'success',
        message: 'Grievance deleted successfully'
      });
    } catch (error) {
      return res.status(400).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to delete grievance'
      });
    }
  };
}