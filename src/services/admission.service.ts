import { Repository } from 'typeorm';
import { AppDataSource } from '../db/data-source';
import { Admission, AdmissionStatus } from '../models/Admission';
import { Student } from '../models/Student';
import { User } from '../models/User';
import { UserRole } from '../types/auth.types';
import { uploadFileToS3, getPresignedUrl } from '../utils/s3.util';
import { sendWelcomeEmail, sendAdmissionStatusUpdateEmail } from '../utils/email.util';
import crypto from 'crypto';

export class AdmissionService {
  private admissionRepository: Repository<Admission>;
  private studentRepository: Repository<Student>;
  private userRepository: Repository<User>;

  constructor() {
    this.admissionRepository = AppDataSource.getRepository(Admission);
    this.studentRepository = AppDataSource.getRepository(Student);
    this.userRepository = AppDataSource.getRepository(User);
  }

  /**
   * Submit new admission application
   */
  async submitApplication(applicationData: {
    program: string;
    department: string;
    personalDetails: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      dateOfBirth: Date;
      gender: string;
      address: {
        street: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
      };
    };
    educationHistory: {
      institution: string;
      degree: string;
      field: string;
      startDate: Date;
      endDate: Date;
      percentage: number;
    }[];
    entranceExamScore?: number;
  }): Promise<Admission> {
    // Generate unique application number
    const applicationNumber = `APP-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    const admission = this.admissionRepository.create({
      ...applicationData,
      applicationNumber,
      status: AdmissionStatus.APPLIED
    });

    await this.admissionRepository.save(admission);
    return admission;
  }

  /**
   * Upload admission documents
   */
  async uploadDocuments(
    admissionId: string,
    files: Array<{ buffer: Buffer; originalname: string }>
  ): Promise<Admission> {
    const admission = await this.admissionRepository.findOne({
      where: { id: admissionId }
    });

    if (!admission) {
      throw new Error('Admission application not found');
    }

    const uploadPromises = files.map(file =>
      uploadFileToS3(file.buffer, file.originalname, 'admission-documents')
    );

    const documentKeys = await Promise.all(uploadPromises);
    
    admission.documents = admission.documents 
      ? [...admission.documents, ...documentKeys]
      : documentKeys;

    // Update status if this is the first document upload
    if (admission.status === AdmissionStatus.APPLIED) {
      admission.status = AdmissionStatus.DOCUMENT_VERIFICATION;
    }

    await this.admissionRepository.save(admission);
    return admission;
  }

  /**
   * Schedule admission interview
   */
  async scheduleInterview(
    admissionId: string,
    interviewDate: Date,
    interviewPanel: string[]
  ): Promise<Admission> {
    const admission = await this.admissionRepository.findOne({
      where: { id: admissionId }
    });

    if (!admission) {
      throw new Error('Admission application not found');
    }

    if (admission.status !== AdmissionStatus.DOCUMENT_VERIFICATION) {
      throw new Error('Documents must be verified before scheduling interview');
    }

    admission.status = AdmissionStatus.INTERVIEW_SCHEDULED;
    admission.interviewDate = interviewDate;
    admission.interviewPanel = interviewPanel;

    await this.admissionRepository.save(admission);
    return admission;
  }

  /**
   * Record interview results
   */
  async recordInterviewResults(
    admissionId: string,
    notes: string,
    status: AdmissionStatus.APPROVED | AdmissionStatus.REJECTED,
    remarks?: string
  ): Promise<Admission> {
    const admission = await this.admissionRepository.findOne({
      where: { id: admissionId }
    });

    if (!admission) {
      throw new Error('Admission application not found');
    }

    if (admission.status !== AdmissionStatus.INTERVIEW_SCHEDULED) {
      throw new Error('Interview must be scheduled first');
    }

    admission.status = status;
    admission.interviewNotes = notes;
    admission.remarks = remarks;

    if (status === AdmissionStatus.APPROVED) {
      admission.approvalDate = new Date();
    }

    await this.admissionRepository.save(admission);
    return admission;
  }

  /**
   * Complete enrollment
   */
  async completeEnrollment(admissionId: string): Promise<{ admission: Admission; student: Student }> {
    const admission = await this.admissionRepository.findOne({
      where: { id: admissionId }
    });

    if (!admission) {
      throw new Error('Admission application not found');
    }

    if (admission.status !== AdmissionStatus.APPROVED) {
      throw new Error('Admission must be approved before enrollment');
    }

    // Generate registration number
    const year = new Date().getFullYear();
    const random = crypto.randomBytes(2).toString('hex').toUpperCase();
    const registrationNumber = `${year}${admission.department.substring(0, 3).toUpperCase()}${random}`;

    // Create user account
    const user = this.userRepository.create({
      firstName: admission.personalDetails.firstName,
      lastName: admission.personalDetails.lastName,
      email: admission.personalDetails.email,
      password: crypto.randomBytes(8).toString('hex'), // Generate temporary password
      role: UserRole.STUDENT,
      contactNumber: admission.personalDetails.phone,
      isActive: true
    });

    await this.userRepository.save(user);

    // Create student profile
    const student = this.studentRepository.create({
      registrationNumber,
      batch: year.toString(),
      program: admission.program,
      department: admission.department,
      semester: 1,
      enrollmentDate: new Date(),
      academicStatus: 'active',
      userId: user.id
    });

    await this.studentRepository.save(student);

    // Update admission status
    admission.status = AdmissionStatus.ENROLLED;
    admission.studentId = student.id;
    await this.admissionRepository.save(admission);

    // Send welcome email with credentials
    await sendWelcomeEmail(
      `${user.firstName} ${user.lastName}`,
      user.email,
      'Student'
    );

    return { admission, student };
  }

  /**
   * Get admission by ID
   */
  async getAdmissionById(admissionId: string): Promise<Admission> {
    const admission = await this.admissionRepository.findOne({
      where: { id: admissionId }
    });

    if (!admission) {
      throw new Error('Admission application not found');
    }

    // Generate presigned URLs for documents
    if (admission.documents && admission.documents.length > 0) {
      const presignedUrls = await Promise.all(
        admission.documents.map(doc => getPresignedUrl(doc))
      );
      admission.documents = presignedUrls;
    }

    return admission;
  }

  /**
   * Get all admissions with optional filters
   */
  async getAllAdmissions(filters?: {
    status?: AdmissionStatus;
    program?: string;
    department?: string;
    fromDate?: Date;
    toDate?: Date;
  }): Promise<Admission[]> {
    const query = this.admissionRepository.createQueryBuilder('admission');

    if (filters) {
      if (filters.status) {
        query.andWhere('admission.status = :status', { status: filters.status });
      }
      if (filters.program) {
        query.andWhere('admission.program = :program', { program: filters.program });
      }
      if (filters.department) {
        query.andWhere('admission.department = :department', { department: filters.department });
      }
      if (filters.fromDate) {
        query.andWhere('admission.createdAt >= :fromDate', { fromDate: filters.fromDate });
      }
      if (filters.toDate) {
        query.andWhere('admission.createdAt <= :toDate', { toDate: filters.toDate });
      }
    }

    const admissions = await query.getMany();

    // Generate presigned URLs for documents
    for (const admission of admissions) {
      if (admission.documents && admission.documents.length > 0) {
        const presignedUrls = await Promise.all(
          admission.documents.map(doc => getPresignedUrl(doc))
        );
        admission.documents = presignedUrls;
      }
    }

    return admissions;
  }

  /**
   * Update admission application
   */
  async updateAdmission(
    admissionId: string,
    updateData: {
      program?: string;
      department?: string;
      entranceExamScore?: number;
      previousEducationPercentage?: number;
      personalDetails?: any;
      educationHistory?: any[];
      remarks?: string;
    }
  ): Promise<Admission> {
    const admission = await this.admissionRepository.findOne({
      where: { id: admissionId }
    });

    if (!admission) {
      throw new Error('Admission application not found');
    }

    // Only allow updates for certain statuses
    if (![AdmissionStatus.APPLIED, AdmissionStatus.DOCUMENT_VERIFICATION].includes(admission.status)) {
      throw new Error(`Cannot update admission in ${admission.status} status`);
    }

    Object.assign(admission, updateData);
    await this.admissionRepository.save(admission);

    return this.getAdmissionById(admissionId);
  }

  /**
   * Cancel admission application
   */
  async cancelAdmission(admissionId: string): Promise<void> {
    const admission = await this.admissionRepository.findOne({
      where: { id: admissionId }
    });

    if (!admission) {
      throw new Error('Admission application not found');
    }

    // Don't allow cancellation of enrolled admissions
    if (admission.status === AdmissionStatus.ENROLLED) {
      throw new Error('Cannot cancel enrolled admission');
    }

    admission.status = AdmissionStatus.CANCELLED;
    await this.admissionRepository.save(admission);
  }

  /**
   * Bulk submit admission applications
   */
  async bulkSubmitApplications(applications: Array<{
    program: string;
    department: string;
    personalDetails: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      dateOfBirth: Date;
      gender: string;
      address: {
        street: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
      };
    };
    educationHistory: {
      institution: string;
      degree: string;
      field: string;
      startDate: Date;
      endDate: Date;
      percentage: number;
    }[];
    entranceExamScore?: number;
  }>): Promise<Admission[]> {
    const admissions: Admission[] = [];

    // Process applications in chunks to avoid memory issues
    const chunkSize = 50;
    for (let i = 0; i < applications.length; i += chunkSize) {
      const chunk = applications.slice(i, i + chunkSize);
      const admissionPromises = chunk.map(async (application) => {
        const applicationNumber = `APP-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
        
        const admission = this.admissionRepository.create({
          ...application,
          applicationNumber,
          status: AdmissionStatus.APPLIED
        });

        await this.admissionRepository.save(admission);

        // Send confirmation email
        try {
          await sendAdmissionStatusUpdateEmail(
            `${application.personalDetails.firstName} ${application.personalDetails.lastName}`,
            application.personalDetails.email,
            applicationNumber,
            AdmissionStatus.APPLIED
          );
        } catch (error) {
          console.error(`Failed to send admission confirmation email to ${application.personalDetails.email}:`, error);
        }

        return admission;
      });

      const results = await Promise.all(admissionPromises);
      admissions.push(...results);
    }

    return admissions;
  }

  /**
   * Bulk update admission status
   */
  async bulkUpdateStatus(
    admissionIds: string[],
    status: AdmissionStatus,
    remarks?: string
  ): Promise<Admission[]> {
    const admissions: Admission[] = [];
    
    // Process updates in chunks
    const chunkSize = 50;
    for (let i = 0; i < admissionIds.length; i += chunkSize) {
      const chunk = admissionIds.slice(i, i + chunkSize);
      const updatePromises = chunk.map(async (id) => {
        const admission = await this.admissionRepository.findOne({
          where: { id }
        });

        if (!admission) {
          throw new Error(`Admission with ID ${id} not found`);
        }

        admission.status = status;
        if (remarks) {
          admission.remarks = remarks;
        }

        await this.admissionRepository.save(admission);

        // Send status update email
        try {
          await sendAdmissionStatusUpdateEmail(
            `${admission.personalDetails.firstName} ${admission.personalDetails.lastName}`,
            admission.personalDetails.email,
            admission.applicationNumber,
            status,
            remarks
          );
        } catch (error) {
          console.error(`Failed to send status update email to ${admission.personalDetails.email}:`, error);
        }

        return admission;
      });

      const results = await Promise.all(updatePromises);
      admissions.push(...results);
    }

    return admissions;
  }
}