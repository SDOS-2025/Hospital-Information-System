import { Repository } from 'typeorm';
import { AppDataSource } from '../db/data-source';
import { AuditLog, AuditAction, AuditResource } from '../models/AuditLog';
import { User } from '../models/User';

export interface AuditLogData {
  action: AuditAction;
  resource: AuditResource;
  resourceId?: string;
  description?: string;
  details?: object;
  userId?: string;
  ipAddress: string;
  userAgent?: string;
}

export class AuditService {
  private auditLogRepository: Repository<AuditLog>;
  private userRepository: Repository<User>;

  constructor() {
    this.auditLogRepository = AppDataSource.getRepository(AuditLog);
    this.userRepository = AppDataSource.getRepository(User);
  }

  /**
   * Create a new audit log entry
   */
  async createLog(data: AuditLogData): Promise<AuditLog> {
    const log = this.auditLogRepository.create({
      ...data
    });

    await this.auditLogRepository.save(log);
    return log;
  }

  /**
   * Get all audit logs with optional filtering
   */
  async getAllLogs(filters?: {
    action?: AuditAction;
    resource?: AuditResource;
    resourceId?: string;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
    ipAddress?: string;
  }): Promise<AuditLog[]> {
    const query = this.auditLogRepository.createQueryBuilder('audit_log')
      .leftJoinAndSelect('audit_log.user', 'user')
      .orderBy('audit_log.createdAt', 'DESC');

    if (filters) {
      if (filters.action) {
        query.andWhere('audit_log.action = :action', { action: filters.action });
      }
      if (filters.resource) {
        query.andWhere('audit_log.resource = :resource', { resource: filters.resource });
      }
      if (filters.resourceId) {
        query.andWhere('audit_log.resourceId = :resourceId', { resourceId: filters.resourceId });
      }
      if (filters.userId) {
        query.andWhere('audit_log.userId = :userId', { userId: filters.userId });
      }
      if (filters.ipAddress) {
        query.andWhere('audit_log.ipAddress = :ipAddress', { ipAddress: filters.ipAddress });
      }
      if (filters.startDate) {
        query.andWhere('audit_log.createdAt >= :startDate', { startDate: filters.startDate });
      }
      if (filters.endDate) {
        query.andWhere('audit_log.createdAt <= :endDate', { endDate: filters.endDate });
      }
    }

    return query.getMany();
  }

  /**
   * Get audit logs by resource
   */
  async getLogsByResource(resource: AuditResource, resourceId?: string): Promise<AuditLog[]> {
    const query = this.auditLogRepository.createQueryBuilder('audit_log')
      .leftJoinAndSelect('audit_log.user', 'user')
      .where('audit_log.resource = :resource', { resource })
      .orderBy('audit_log.createdAt', 'DESC');

    if (resourceId) {
      query.andWhere('audit_log.resourceId = :resourceId', { resourceId });
    }

    return query.getMany();
  }

  /**
   * Get audit logs by user
   */
  async getLogsByUser(userId: string): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { userId },
      relations: ['user'],
      order: { createdAt: 'DESC' }
    });
  }
}