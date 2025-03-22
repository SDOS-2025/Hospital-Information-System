import { Request, Response } from 'express';
import { LeaveService } from '../services/leave.service';
import { LeaveStatus, LeaveType } from '../models/Leave';
import { AuthRequest } from '../types/auth.types';
import { AuditService } from '../services/audit.service';
import { AuditAction, AuditResource } from '../models/AuditLog';
import multer from 'multer';

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
}).array('documents', 3);

export class LeaveController {
  private leaveService: LeaveService;
  private auditService: AuditService;

  constructor() {
    this.leaveService = new LeaveService();
    this.auditService = new AuditService();
  }

  /**
   * Apply for leave
   */
  applyLeave = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required'
        });
      }

      const {
        type,
        startDate,
        endDate,
        reason,
        isEmergency
      } = req.body;

      // Validate required fields
      if (!type || !startDate || !endDate || !reason) {
        return res.status(400).json({
          status: 'error',
          message: 'Please provide all required fields: type, startDate, endDate, reason'
        });
      }

      // Validate leave type
      if (!Object.values(LeaveType).includes(type as LeaveType)) {
        return res.status(400).json({
          status: 'error',
          message: `Invalid leave type. Must be one of: ${Object.values(LeaveType).join(', ')}`
        });
      }

      const leave = await this.leaveService.applyLeave({
        type: type as LeaveType,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason,
        applicantId: req.user.id,
        isEmergency: isEmergency === true
      });

      // Log leave application
      const ipAddress = (req.headers['x-forwarded-for'] || req.socket.remoteAddress) as string;
      await this.auditService.createLog({
        action: AuditAction.CREATE,
        resource: AuditResource.LEAVE,
        resourceId: leave.id,
        description: `New ${type} leave application submitted ${isEmergency ? '(Emergency)' : ''}`,
        userId: req.user.id,
        ipAddress,
        userAgent: req.headers['user-agent'],
        details: {
          type,
          startDate,
          endDate,
          isEmergency: !!isEmergency,
          reasonLength: reason.length
        }
      });

      return res.status(201).json({
        status: 'success',
        message: 'Leave application submitted successfully',
        data: leave
      });
    } catch (error) {
      return res.status(400).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to apply for leave'
      });
    }
  };

  /**
   * Upload supporting documents
   */
  uploadDocuments = async (req: AuthRequest, res: Response): Promise<Response> => {
    return new Promise((resolve) => {
      upload(req, res, async (err) => {
        if (err) {
          resolve(res.status(400).json({
            status: 'error',
            message: 'Document upload failed: ' + err.message
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
              message: 'Please upload at least one document'
            }));
            return;
          }

          const leave = await this.leaveService.uploadDocuments(
            id,
            files.map(file => ({
              buffer: file.buffer,
              originalname: file.originalname
            }))
          );

          // Log document upload
          const ipAddress = (req.headers['x-forwarded-for'] || req.socket.remoteAddress) as string;
          await this.auditService.createLog({
            action: AuditAction.UPLOAD,
            resource: AuditResource.LEAVE,
            resourceId: id,
            description: `${files.length} document(s) uploaded for leave application`,
            userId: req.user.id,
            ipAddress,
            userAgent: req.headers['user-agent'],
            details: {
              documentCount: files.length,
              fileNames: files.map(f => f.originalname)
            }
          });

          resolve(res.status(200).json({
            status: 'success',
            message: 'Documents uploaded successfully',
            data: leave
          }));
        } catch (error) {
          resolve(res.status(400).json({
            status: 'error',
            message: error instanceof Error ? error.message : 'Failed to upload documents'
          }));
        }
      });
    });
  };

  /**
   * Update leave status
   */
  updateLeaveStatus = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required'
        });
      }

      const { id } = req.params;
      const { status, comments } = req.body;

      if (!status || !Object.values(LeaveStatus).includes(status as LeaveStatus)) {
        return res.status(400).json({
          status: 'error',
          message: `Invalid status. Must be one of: ${Object.values(LeaveStatus).join(', ')}`
        });
      }

      const leave = await this.leaveService.updateLeaveStatus(
        id,
        status as LeaveStatus,
        req.user.id,
        comments
      );

      // Log leave status update
      const ipAddress = (req.headers['x-forwarded-for'] || req.socket.remoteAddress) as string;
      await this.auditService.createLog({
        action: status === LeaveStatus.APPROVED ? AuditAction.APPROVE : 
                status === LeaveStatus.REJECTED ? AuditAction.REJECT : AuditAction.UPDATE,
        resource: AuditResource.LEAVE,
        resourceId: id,
        description: `Leave application ${status.toLowerCase()}${comments ? ' with comments' : ''}`,
        userId: req.user.id,
        ipAddress,
        userAgent: req.headers['user-agent'],
        details: {
          status,
          hasComments: !!comments,
          leaveType: leave.type
        }
      });

      return res.status(200).json({
        status: 'success',
        message: 'Leave status updated successfully',
        data: leave
      });
    } catch (error) {
      return res.status(400).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to update leave status'
      });
    }
  };

  /**
   * Get all leaves
   */
  getAllLeaves = async (req: Request, res: Response): Promise<Response> => {
    try {
      const {
        type,
        status,
        applicantId,
        approvedById,
        fromDate,
        toDate
      } = req.query;

      const filters: any = {};

      if (type) filters.type = type as LeaveType;
      if (status) filters.status = status as LeaveStatus;
      if (applicantId) filters.applicantId = applicantId as string;
      if (approvedById) filters.approvedById = approvedById as string;
      if (fromDate) filters.fromDate = new Date(fromDate as string);
      if (toDate) filters.toDate = new Date(toDate as string);

      const leaves = await this.leaveService.getAllLeaves(filters);

      return res.status(200).json({
        status: 'success',
        message: 'Leaves retrieved successfully',
        results: leaves.length,
        data: leaves
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to retrieve leaves'
      });
    }
  };

  /**
   * Get leave by ID
   */
  getLeaveById = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const leave = await this.leaveService.getLeaveById(id);

      return res.status(200).json({
        status: 'success',
        message: 'Leave retrieved successfully',
        data: leave
      });
    } catch (error) {
      return res.status(404).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Leave not found'
      });
    }
  };

  /**
   * Get my leaves (for current user)
   */
  getMyLeaves = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required'
        });
      }

      const leaves = await this.leaveService.getAllLeaves({
        applicantId: req.user.id
      });

      return res.status(200).json({
        status: 'success',
        message: 'Your leaves retrieved successfully',
        results: leaves.length,
        data: leaves
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to retrieve leaves'
      });
    }
  };

  /**
   * Cancel leave
   */
  cancelLeave = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required'
        });
      }

      const { id } = req.params;
      const leave = await this.leaveService.getLeaveById(id);
      await this.leaveService.cancelLeave(id, req.user.id);

      // Log leave cancellation
      const ipAddress = (req.headers['x-forwarded-for'] || req.socket.remoteAddress) as string;
      await this.auditService.createLog({
        action: AuditAction.UPDATE,
        resource: AuditResource.LEAVE,
        resourceId: id,
        description: `Leave application cancelled`,
        userId: req.user.id,
        ipAddress,
        userAgent: req.headers['user-agent'],
        details: {
          leaveType: leave.type,
          originalStatus: leave.status,
          startDate: leave.startDate,
          endDate: leave.endDate
        }
      });

      return res.status(200).json({
        status: 'success',
        message: 'Leave cancelled successfully'
      });
    } catch (error) {
      return res.status(400).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to cancel leave'
      });
    }
  };

  /**
   * Get leave statistics
   */
  getLeaveStatistics = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required'
        });
      }

      const stats = await this.leaveService.getLeaveStatistics(req.user.id);

      return res.status(200).json({
        status: 'success',
        message: 'Leave statistics retrieved successfully',
        data: stats
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to retrieve leave statistics'
      });
    }
  };
}