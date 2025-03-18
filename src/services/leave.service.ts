import { Repository } from 'typeorm';
import { AppDataSource } from '../db/data-source';
import { Leave, LeaveStatus, LeaveType } from '../models/Leave';
import { User } from '../models/User';
import { uploadFileToS3, getPresignedUrl } from '../utils/s3.util';

export class LeaveService {
  private leaveRepository: Repository<Leave>;
  private userRepository: Repository<User>;

  constructor() {
    this.leaveRepository = AppDataSource.getRepository(Leave);
    this.userRepository = AppDataSource.getRepository(User);
  }

  /**
   * Apply for leave
   */
  async applyLeave(leaveData: {
    type: LeaveType;
    startDate: Date;
    endDate: Date;
    reason: string;
    applicantId: string;
    isEmergency?: boolean;
  }): Promise<Leave> {
    // Validate user exists
    const applicant = await this.userRepository.findOne({
      where: { id: leaveData.applicantId }
    });

    if (!applicant) {
      throw new Error('Applicant not found');
    }

    // Validate leave dates
    if (leaveData.startDate >= leaveData.endDate) {
      throw new Error('Leave end date must be after start date');
    }

    // Check for overlapping leaves
    const existingLeave = await this.leaveRepository.findOne({
      where: [
        {
          applicantId: leaveData.applicantId,
          startDate: leaveData.startDate,
          endDate: leaveData.endDate
        },
        {
          applicantId: leaveData.applicantId,
          startDate: leaveData.startDate,
          endDate: leaveData.endDate,
          status: LeaveStatus.APPROVED
        }
      ]
    });

    if (existingLeave) {
      throw new Error('Leave application already exists for these dates');
    }

    const leave = this.leaveRepository.create({
      ...leaveData,
      status: LeaveStatus.PENDING
    });

    await this.leaveRepository.save(leave);
    return leave;
  }

  /**
   * Upload supporting documents
   */
  async uploadDocuments(
    leaveId: string,
    files: Array<{ buffer: Buffer; originalname: string }>
  ): Promise<Leave> {
    const leave = await this.leaveRepository.findOne({
      where: { id: leaveId }
    });

    if (!leave) {
      throw new Error('Leave application not found');
    }

    if (leave.status !== LeaveStatus.PENDING) {
      throw new Error('Documents can only be uploaded for pending leave applications');
    }

    const uploadPromises = files.map(file =>
      uploadFileToS3(file.buffer, file.originalname, 'leave-documents')
    );

    const fileKeys = await Promise.all(uploadPromises);
    
    leave.attachments = leave.attachments 
      ? [...leave.attachments, ...fileKeys]
      : fileKeys;

    await this.leaveRepository.save(leave);
    return leave;
  }

  /**
   * Update leave status
   */
  async updateLeaveStatus(
    leaveId: string,
    status: LeaveStatus,
    approvedById: string,
    comments?: string
  ): Promise<Leave> {
    const leave = await this.leaveRepository.findOne({
      where: { id: leaveId }
    });

    if (!leave) {
      throw new Error('Leave application not found');
    }

    // Validate approver exists
    const approver = await this.userRepository.findOne({
      where: { id: approvedById }
    });

    if (!approver) {
      throw new Error('Approver not found');
    }

    leave.status = status;
    leave.approvedById = approvedById;
    leave.approvalDate = new Date();
    if (comments) {
      leave.comments = comments;
    }

    await this.leaveRepository.save(leave);
    return leave;
  }

  /**
   * Get leave by ID
   */
  async getLeaveById(leaveId: string): Promise<Leave> {
    const leave = await this.leaveRepository.findOne({
      where: { id: leaveId },
      relations: ['applicant', 'approvedBy']
    });

    if (!leave) {
      throw new Error('Leave application not found');
    }

    // Generate presigned URLs for attachments
    if (leave.attachments && leave.attachments.length > 0) {
      const presignedUrls = await Promise.all(
        leave.attachments.map(attachment => getPresignedUrl(attachment))
      );
      leave.attachments = presignedUrls;
    }

    return leave;
  }

  /**
   * Get all leaves with optional filters
   */
  async getAllLeaves(filters?: {
    type?: LeaveType;
    status?: LeaveStatus;
    applicantId?: string;
    approvedById?: string;
    fromDate?: Date;
    toDate?: Date;
  }): Promise<Leave[]> {
    const query = this.leaveRepository.createQueryBuilder('leave')
      .leftJoinAndSelect('leave.applicant', 'applicant')
      .leftJoinAndSelect('leave.approvedBy', 'approvedBy');

    if (filters) {
      if (filters.type) {
        query.andWhere('leave.type = :type', { type: filters.type });
      }
      if (filters.status) {
        query.andWhere('leave.status = :status', { status: filters.status });
      }
      if (filters.applicantId) {
        query.andWhere('leave.applicantId = :applicantId', { applicantId: filters.applicantId });
      }
      if (filters.approvedById) {
        query.andWhere('leave.approvedById = :approvedById', { approvedById: filters.approvedById });
      }
      if (filters.fromDate) {
        query.andWhere('leave.startDate >= :fromDate', { fromDate: filters.fromDate });
      }
      if (filters.toDate) {
        query.andWhere('leave.endDate <= :toDate', { toDate: filters.toDate });
      }
    }

    const leaves = await query.getMany();

    // Generate presigned URLs for attachments
    for (const leave of leaves) {
      if (leave.attachments && leave.attachments.length > 0) {
        const presignedUrls = await Promise.all(
          leave.attachments.map(attachment => getPresignedUrl(attachment))
        );
        leave.attachments = presignedUrls;
      }
    }

    return leaves;
  }

  /**
   * Cancel leave
   */
  async cancelLeave(leaveId: string, applicantId: string): Promise<void> {
    const leave = await this.leaveRepository.findOne({
      where: { id: leaveId, applicantId }
    });

    if (!leave) {
      throw new Error('Leave application not found');
    }

    if (leave.status !== LeaveStatus.PENDING) {
      throw new Error(`Cannot cancel leave in ${leave.status} status`);
    }

    leave.status = LeaveStatus.CANCELLED;
    await this.leaveRepository.save(leave);
  }

  /**
   * Get leave statistics for a user
   */
  async getLeaveStatistics(userId: string): Promise<{
    total: number;
    approved: number;
    pending: number;
    rejected: number;
    cancelled: number;
  }> {
    const leaves = await this.leaveRepository.find({
      where: { applicantId: userId }
    });

    return {
      total: leaves.length,
      approved: leaves.filter(l => l.status === LeaveStatus.APPROVED).length,
      pending: leaves.filter(l => l.status === LeaveStatus.PENDING).length,
      rejected: leaves.filter(l => l.status === LeaveStatus.REJECTED).length,
      cancelled: leaves.filter(l => l.status === LeaveStatus.CANCELLED).length
    };
  }
}