import { Repository } from 'typeorm';
import { AppDataSource } from '../db/data-source';
import { Grievance, GrievanceStatus, GrievanceCategory, GrievancePriority } from '../models/Grievance';
import { User } from '../models/User';
import { uploadFileToS3, getPresignedUrl } from '../utils/s3.util';

// Interface for grievance data with attachmentUrls
interface GrievanceWithUrls extends Grievance {
  attachmentUrls?: string[];
}

// Interface for anonymized grievance data
interface AnonymizedGrievance extends Omit<Grievance, 'submitter' | 'submitterId'> {
  submitter?: null;
  submitterId?: null;
  attachmentUrls?: string[];
}

export class GrievanceService {
  private grievanceRepository: Repository<Grievance>;
  private userRepository: Repository<User>;

  constructor() {
    this.grievanceRepository = AppDataSource.getRepository(Grievance);
    this.userRepository = AppDataSource.getRepository(User);
  }

  /**
   * Submit a new grievance
   */
  async submitGrievance(grievanceData: {
    subject: string;
    description: string;
    category: GrievanceCategory;
    submitterId: string;
    attachments?: string[];
    priority?: GrievancePriority;
    isAnonymous?: boolean;
  }): Promise<Grievance> {
    // Check if submitter exists
    const submitter = await this.userRepository.findOne({
      where: { id: grievanceData.submitterId }
    });

    if (!submitter) {
      throw new Error('Submitter not found');
    }

    const grievance = this.grievanceRepository.create({
      ...grievanceData,
      status: GrievanceStatus.SUBMITTED,
      priority: grievanceData.priority || GrievancePriority.MEDIUM,
      isAnonymous: grievanceData.isAnonymous || false
    });

    await this.grievanceRepository.save(grievance);
    return grievance;
  }

  /**
   * Upload attachments for a grievance
   */
  async uploadAttachments(
    grievanceId: string,
    files: Array<{ buffer: Buffer; originalname: string }>
  ): Promise<Grievance> {
    const grievance = await this.grievanceRepository.findOne({
      where: { id: grievanceId }
    });

    if (!grievance) {
      throw new Error('Grievance not found');
    }

    const attachmentPromises = files.map(file => 
      uploadFileToS3(file.buffer, file.originalname, 'grievances')
    );
    
    const attachmentKeys = await Promise.all(attachmentPromises);
    
    grievance.attachments = grievance.attachments 
      ? [...grievance.attachments, ...attachmentKeys]
      : attachmentKeys;

    await this.grievanceRepository.save(grievance);
    return grievance;
  }

  /**
   * Update grievance status
   */
  async updateGrievanceStatus(
    grievanceId: string,
    status: GrievanceStatus,
    comments?: string,
    assignedTo?: string
  ): Promise<Grievance> {
    const grievance = await this.grievanceRepository.findOne({
      where: { id: grievanceId }
    });

    if (!grievance) {
      throw new Error('Grievance not found');
    }

    grievance.status = status;

    if (comments) {
      const existingComments = grievance.comments || '';
      const timestamp = new Date().toISOString();
      grievance.comments = `${existingComments}\n\n[${timestamp}] ${comments}`;
    }

    if (assignedTo) {
      // Verify if assigned user exists
      const assignedUser = await this.userRepository.findOne({
        where: { id: assignedTo }
      });

      if (!assignedUser) {
        throw new Error('Assigned user not found');
      }

      grievance.assignedTo = assignedTo;
    }

    if (status === GrievanceStatus.RESOLVED) {
      grievance.resolutionDate = new Date();
    }

    await this.grievanceRepository.save(grievance);
    return grievance;
  }

  /**
   * Add resolution to a grievance
   */
  async addResolution(
    grievanceId: string,
    resolution: string
  ): Promise<Grievance> {
    const grievance = await this.grievanceRepository.findOne({
      where: { id: grievanceId }
    });

    if (!grievance) {
      throw new Error('Grievance not found');
    }

    grievance.resolution = resolution;
    grievance.status = GrievanceStatus.RESOLVED;
    grievance.resolutionDate = new Date();

    await this.grievanceRepository.save(grievance);
    return grievance;
  }

  /**
   * Get grievance by ID
   */
  async getGrievanceById(
    grievanceId: string,
    userId?: string
  ): Promise<GrievanceWithUrls | AnonymizedGrievance> {
    const grievance = await this.grievanceRepository.findOne({
      where: { id: grievanceId },
      relations: ['submitter']
    });

    if (!grievance) {
      throw new Error('Grievance not found');
    }

    // Check if user has access to this grievance
    if (
      userId && 
      userId !== grievance.submitterId && 
      userId !== grievance.assignedTo && 
      !(await this.isUserCommitteeMember(userId))
    ) {
      throw new Error('You do not have permission to access this grievance');
    }

    // Convert to GrievanceWithUrls type
    const result = grievance as GrievanceWithUrls;

    // Generate presigned URLs for attachments
    if (grievance.attachments && grievance.attachments.length > 0) {
      try {
        result.attachmentUrls = await Promise.all(
          grievance.attachments.map(attachment => getPresignedUrl(attachment))
        );
      } catch (error) {
        console.error('Error generating presigned URLs:', error);
        result.attachmentUrls = [];
      }
    }

    // Hide submitter details if anonymous
    if (grievance.isAnonymous && userId !== grievance.submitterId) {
      return this.anonymizeGrievance(grievance, result.attachmentUrls);
    }

    return result;
  }

  /**
   * Get all grievances with optional filters
   */
  async getAllGrievances(filters?: {
    status?: GrievanceStatus;
    category?: GrievanceCategory;
    priority?: GrievancePriority;
    submitterId?: string;
    assignedTo?: string;
  }): Promise<(GrievanceWithUrls | AnonymizedGrievance)[]> {
    const query = this.grievanceRepository.createQueryBuilder('grievance')
      .leftJoinAndSelect('grievance.submitter', 'submitter');

    if (filters) {
      if (filters.status) {
        query.andWhere('grievance.status = :status', { status: filters.status });
      }
      if (filters.category) {
        query.andWhere('grievance.category = :category', { category: filters.category });
      }
      if (filters.priority) {
        query.andWhere('grievance.priority = :priority', { priority: filters.priority });
      }
      if (filters.submitterId) {
        query.andWhere('grievance.submitterId = :submitterId', { submitterId: filters.submitterId });
      }
      if (filters.assignedTo) {
        query.andWhere('grievance.assignedTo = :assignedTo', { assignedTo: filters.assignedTo });
      }
    }

    const grievances = await query.getMany();
    const result: (GrievanceWithUrls | AnonymizedGrievance)[] = [];

    // Process attachments and handle anonymous submissions
    for (const grievance of grievances) {
      const grievanceWithUrls = grievance as GrievanceWithUrls;
      
      // Generate presigned URLs for attachments
      if (grievance.attachments && grievance.attachments.length > 0) {
        try {
          grievanceWithUrls.attachmentUrls = await Promise.all(
            grievance.attachments.map(attachment => getPresignedUrl(attachment))
          );
        } catch (error) {
          console.error('Error generating presigned URLs:', error);
          grievanceWithUrls.attachmentUrls = [];
        }
      }

      // Hide submitter details for anonymous grievances
      // Only hide if the current user is not the submitter of this grievance
      if (grievance.isAnonymous && 
          filters?.submitterId && 
          filters.submitterId !== grievance.submitterId) {
        result.push(this.anonymizeGrievance(grievance, grievanceWithUrls.attachmentUrls));
      } else {
        result.push(grievanceWithUrls);
      }
    }

    return result;
  }

  /**
   * Update grievance details
   */
  async updateGrievance(
    grievanceId: string,
    userId: string,
    updateData: {
      subject?: string;
      description?: string;
      category?: GrievanceCategory;
      priority?: GrievancePriority;
      isAnonymous?: boolean;
    }
  ): Promise<Grievance | AnonymizedGrievance> {
    const grievance = await this.grievanceRepository.findOne({
      where: { id: grievanceId },
      relations: ['submitter']
    });

    if (!grievance) {
      throw new Error('Grievance not found');
    }

    // Only allow updates if user is the submitter or a committee member
    if (
      userId !== grievance.submitterId && 
      !(await this.isUserCommitteeMember(userId))
    ) {
      throw new Error('You do not have permission to update this grievance');
    }

    // Only allow updates for certain statuses
    if (![GrievanceStatus.SUBMITTED, GrievanceStatus.UNDER_REVIEW].includes(grievance.status)) {
      throw new Error(`Grievance in ${grievance.status} status cannot be updated`);
    }

    // Update grievance details
    Object.assign(grievance, updateData);
    
    // Save the updated grievance
    await this.grievanceRepository.save(grievance);
    
    // Hide submitter information if grievance is anonymous and viewed by someone else
    if (grievance.isAnonymous && userId !== grievance.submitterId) {
      return this.anonymizeGrievance(grievance);
    }
    
    return grievance;
  }

  /**
   * Delete grievance
   */
  async deleteGrievance(
    grievanceId: string,
    userId: string
  ): Promise<void> {
    const grievance = await this.grievanceRepository.findOne({
      where: { id: grievanceId }
    });

    if (!grievance) {
      throw new Error('Grievance not found');
    }

    // Only allow deletion if user is the submitter or a committee member
    if (
      userId !== grievance.submitterId && 
      !(await this.isUserCommitteeMember(userId))
    ) {
      throw new Error('You do not have permission to delete this grievance');
    }

    // Only allow deletion for certain statuses
    if (![GrievanceStatus.SUBMITTED, GrievanceStatus.RESOLVED, GrievanceStatus.REJECTED].includes(grievance.status)) {
      throw new Error(`Grievance in ${grievance.status} status cannot be deleted`);
    }

    await this.grievanceRepository.remove(grievance);
  }

  /**
   * Check if user is a grievance committee member
   */
  private async isUserCommitteeMember(userId: string): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { id: userId }
    });

    return user?.role === 'grievance_committee' || user?.role === 'admin';
  }

  /**
   * Helper method to anonymize grievance data
   */
  private anonymizeGrievance(grievance: Grievance, attachmentUrls?: string[]): AnonymizedGrievance {
    // Create a new object without submitter information
    const { submitter, submitterId, ...anonymousData } = grievance;
    
    const anonymizedGrievance = anonymousData as AnonymizedGrievance;
    anonymizedGrievance.submitter = null;
    anonymizedGrievance.submitterId = null;
    
    if (attachmentUrls) {
      anonymizedGrievance.attachmentUrls = attachmentUrls;
    }
    
    return anonymizedGrievance;
  }
}