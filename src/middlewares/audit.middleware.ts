import { Request, Response, NextFunction } from 'express';
import { AuditService } from '../services/audit.service';
import { AuthRequest } from '../types/auth.types';
import { AuditAction, AuditResource } from '../models/AuditLog';

const auditService = new AuditService();

export interface AuditOptions {
  action: AuditAction;
  resource: AuditResource;
  getResourceId?: (req: Request) => string | undefined;
  getDescription?: (req: Request) => string | undefined;
  getDetails?: (req: Request, res: Response) => object | undefined;
  skipAudit?: (req: Request) => boolean;
}

export const auditLog = (options: AuditOptions) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    // Store the original send function to intercept it later
    const originalSend = res.send;
    
    // Override the send function to intercept the response
    res.send = function (body): Response {
      res.locals.body = body;
      // Call the original send
      return originalSend.call(this, body);
    };
    
    // Continue with the middleware chain
    next();
    
    try {
      // Check if audit should be skipped
      if (options.skipAudit && options.skipAudit(req)) {
        return;
      }
      
      // Get the response status
      const statusCode = res.statusCode;
      
      // Only audit successful operations (2xx status codes)
      if (statusCode >= 200 && statusCode < 300) {
        // Extract audit information
        const userId = req.user?.id;
        const resourceId = options.getResourceId ? options.getResourceId(req) : undefined;
        const description = options.getDescription ? options.getDescription(req) : undefined;
        const details = options.getDetails ? options.getDetails(req, res) : undefined;
        const ipAddress = (req.headers['x-forwarded-for'] || req.socket.remoteAddress) as string;
        const userAgent = req.headers['user-agent'];
        
        // Create the audit log
        await auditService.createLog({
          action: options.action,
          resource: options.resource,
          resourceId,
          description,
          details,
          userId,
          ipAddress,
          userAgent
        });
      }
    } catch (error) {
      // Log the error but don't disrupt the request flow
      console.error('Audit logging failed:', error);
    }
  };
};

// Helper function to create common audit middleware configurations
export const createAuditMiddleware = {
  create: (resource: AuditResource, getResourceId?: (req: Request) => string) => 
    auditLog({ 
      action: AuditAction.CREATE, 
      resource, 
      getResourceId,
      getDescription: (req) => `Created new ${resource}`
    }),
  
  read: (resource: AuditResource, getResourceId?: (req: Request) => string) => 
    auditLog({ 
      action: AuditAction.READ, 
      resource, 
      getResourceId,
      getDescription: (req) => `Viewed ${resource}`
    }),
  
  update: (resource: AuditResource, getResourceId?: (req: Request) => string) => 
    auditLog({ 
      action: AuditAction.UPDATE, 
      resource, 
      getResourceId,
      getDescription: (req) => `Updated ${resource}`
    }),
  
  delete: (resource: AuditResource, getResourceId?: (req: Request) => string) => 
    auditLog({ 
      action: AuditAction.DELETE, 
      resource, 
      getResourceId,
      getDescription: (req) => `Deleted ${resource}`
    }),
  
  approve: (resource: AuditResource, getResourceId?: (req: Request) => string) => 
    auditLog({ 
      action: AuditAction.APPROVE, 
      resource, 
      getResourceId,
      getDescription: (req) => `Approved ${resource}`
    }),
  
  reject: (resource: AuditResource, getResourceId?: (req: Request) => string) => 
    auditLog({ 
      action: AuditAction.REJECT, 
      resource, 
      getResourceId,
      getDescription: (req) => `Rejected ${resource}`
    }),
  
  upload: (resource: AuditResource, getResourceId?: (req: Request) => string) => 
    auditLog({ 
      action: AuditAction.UPLOAD, 
      resource, 
      getResourceId,
      getDescription: (req) => `Uploaded document for ${resource}`
    })
};