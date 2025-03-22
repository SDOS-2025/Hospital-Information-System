import { Router } from 'express';
import { auditLog, createAuditMiddleware } from '../middlewares/audit.middleware';
import { AuditAction, AuditResource } from '../models/AuditLog';

/**
 * Apply audit logging to all routes in a router based on HTTP method
 * @param router Express router to apply audit logging to
 * @param resource The resource type being audited
 */
export const applyAuditLogging = (router: Router, resource: AuditResource): Router => {
  // Store original router methods to wrap them
  const originalGet = router.get.bind(router);
  const originalPost = router.post.bind(router);
  const originalPut = router.put.bind(router);
  const originalPatch = router.patch.bind(router);
  const originalDelete = router.delete.bind(router);

  // Override GET method for READ auditing
  router.get = function(path: any, ...handlers: any[]): Router {
    // If the path has an ID parameter, it's likely a single resource
    const hasIdParam = typeof path === 'string' && (path.includes(':id') || path.includes('/:'));
    const readMiddleware = createAuditMiddleware.read(
      resource, 
      hasIdParam ? (req) => req.params.id : undefined
    );
    return originalGet(path, readMiddleware, ...handlers);
  };

  // Override POST method for CREATE auditing
  router.post = function(path: any, ...handlers: any[]): Router {
    // Special case for uploads and other non-standard actions
    if (typeof path === 'string' && path.includes('upload')) {
      const uploadMiddleware = createAuditMiddleware.upload(
        resource, 
        (req) => req.params.id
      );
      return originalPost(path, uploadMiddleware, ...handlers);
    }
    
    const createMiddleware = createAuditMiddleware.create(
      resource, 
      (req) => req.body.id // Often the newly created ID is returned in the response, not available here
    );
    return originalPost(path, createMiddleware, ...handlers);
  };

  // Override PUT method for UPDATE auditing
  router.put = function(path: any, ...handlers: any[]): Router {
    const updateMiddleware = createAuditMiddleware.update(
      resource, 
      (req) => req.params.id
    );
    return originalPut(path, updateMiddleware, ...handlers);
  };

  // Override PATCH method for UPDATE auditing
  router.patch = function(path: any, ...handlers: any[]): Router {
    // Special cases for approve/reject actions
    if (typeof path === 'string' && path.includes('approve')) {
      const approveMiddleware = createAuditMiddleware.approve(
        resource, 
        (req) => req.params.id
      );
      return originalPatch(path, approveMiddleware, ...handlers);
    }
    
    if (typeof path === 'string' && path.includes('reject')) {
      const rejectMiddleware = createAuditMiddleware.reject(
        resource, 
        (req) => req.params.id
      );
      return originalPatch(path, rejectMiddleware, ...handlers);
    }
    
    if (typeof path === 'string' && path.includes('status')) {
      const statusMiddleware = auditLog({
        action: AuditAction.UPDATE,
        resource,
        getResourceId: (req) => req.params.id,
        getDescription: (req) => `${resource} status updated to ${req.body.status || 'new status'}`
      });
      return originalPatch(path, statusMiddleware, ...handlers);
    }
    
    const updateMiddleware = createAuditMiddleware.update(
      resource, 
      (req) => req.params.id
    );
    return originalPatch(path, updateMiddleware, ...handlers);
  };

  // Override DELETE method for DELETE auditing
  router.delete = function(path: any, ...handlers: any[]): Router {
    const deleteMiddleware = createAuditMiddleware.delete(
      resource, 
      (req) => req.params.id
    );
    return originalDelete(path, deleteMiddleware, ...handlers);
  };

  return router;
};

/**
 * Create a new router with audit logging enabled
 * @param resource The resource type being audited
 */
export const createAuditedRouter = (resource: AuditResource): Router => {
  const router = Router();
  return applyAuditLogging(router, resource);
};