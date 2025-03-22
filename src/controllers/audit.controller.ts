import { Request, Response } from 'express';
import { AuditService } from '../services/audit.service';
import { AuditAction, AuditResource } from '../models/AuditLog';

export class AuditController {
  private auditService: AuditService;

  constructor() {
    this.auditService = new AuditService();
  }

  /**
   * Get all audit logs with optional filtering
   */
  getAllLogs = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { 
        action, 
        resource, 
        resourceId, 
        userId, 
        startDate, 
        endDate, 
        ipAddress 
      } = req.query;

      const filters: any = {};
      if (action) filters.action = action as AuditAction;
      if (resource) filters.resource = resource as AuditResource;
      if (resourceId) filters.resourceId = resourceId as string;
      if (userId) filters.userId = userId as string;
      if (ipAddress) filters.ipAddress = ipAddress as string;
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);

      const logs = await this.auditService.getAllLogs(filters);

      return res.status(200).json({
        status: 'success',
        message: 'Audit logs retrieved successfully',
        results: logs.length,
        data: logs
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to retrieve audit logs'
      });
    }
  };

  /**
   * Get audit logs for a specific resource
   */
  getLogsByResource = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { resource, resourceId } = req.params;

      if (!Object.values(AuditResource).includes(resource as AuditResource)) {
        return res.status(400).json({
          status: 'error',
          message: `Invalid resource. Must be one of: ${Object.values(AuditResource).join(', ')}`
        });
      }

      const logs = await this.auditService.getLogsByResource(
        resource as AuditResource,
        resourceId
      );

      return res.status(200).json({
        status: 'success',
        message: `Audit logs for ${resource} retrieved successfully`,
        results: logs.length,
        data: logs
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to retrieve audit logs'
      });
    }
  };

  /**
   * Get audit logs for a specific user
   */
  getLogsByUser = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { userId } = req.params;
      const logs = await this.auditService.getLogsByUser(userId);

      return res.status(200).json({
        status: 'success',
        message: 'Audit logs retrieved successfully',
        results: logs.length,
        data: logs
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to retrieve audit logs'
      });
    }
  };
}