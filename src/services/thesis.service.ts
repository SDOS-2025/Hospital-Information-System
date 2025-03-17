import { Repository } from 'typeorm';
import { AppDataSource } from '../db/data-source';
import { Thesis, ThesisStatus } from '../models/Thesis';
import { Student } from '../models/Student';
import { Faculty } from '../models/Faculty';
import { User } from '../models/User';
import { sendThesisStatusUpdateEmail } from '../utils/email.util';
import { uploadFileToS3, getPresignedUrl } from '../utils/s3.util';

export class ThesisService {
  private thesisRepository: Repository<Thesis>;
  private studentRepository: Repository<Student>;
  private facultyRepository: Repository<Faculty>;
  private userRepository: Repository<User>;

  constructor() {
    this.thesisRepository = AppDataSource.getRepository(Thesis);
    this.studentRepository = AppDataSource.getRepository(Student);
    this.facultyRepository = AppDataSource.getRepository(Faculty);
    this.userRepository = AppDataSource.getRepository(User);
  }

  /**
   * Create a new thesis
   */
  async createThesis(thesisData: {
    title: string;
    abstract?: string;
    studentId: string;
    supervisorId: string;
    keywords?: string[];
  }): Promise<Thesis> {
    // Check if student exists
    const student = await this.studentRepository.findOne({
      where: { id: thesisData.studentId }
    });

    if (!student) {
      throw new Error('Student not found');
    }

    // Check if supervisor exists
    const supervisor = await this.facultyRepository.findOne({
      where: { id: thesisData.supervisorId }
    });

    if (!supervisor) {
      throw new Error('Supervisor not found');
    }

    const thesis = this.thesisRepository.create({
      ...thesisData,
      status: ThesisStatus.DRAFT
    });

    await this.thesisRepository.save(thesis);
    return thesis;
  }

  /**
   * Upload thesis document
   */
  async uploadThesisDocument(
    thesisId: string,
    file: Buffer,
    fileName: string
  ): Promise<Thesis> {
    const thesis = await this.thesisRepository.findOne({
      where: { id: thesisId },
      relations: ['student', 'student.user', 'supervisor']
    });

    if (!thesis) {
      throw new Error('Thesis not found');
    }

    // Upload document to S3
    const documentKey = await uploadFileToS3(file, fileName, 'thesis');
    thesis.documentUrl = documentKey;

    // If thesis is in DRAFT status, update it to SUBMITTED
    if (thesis.status === ThesisStatus.DRAFT) {
      thesis.status = ThesisStatus.SUBMITTED;
      thesis.submissionDate = new Date();
    }

    await this.thesisRepository.save(thesis);
    return thesis;
  }

  /**
   * Update thesis status
   */
  async updateThesisStatus(
    thesisId: string,
    status: ThesisStatus,
    comments?: string
  ): Promise<Thesis> {
    const thesis = await this.thesisRepository.findOne({
      where: { id: thesisId },
      relations: ['student', 'student.user', 'supervisor']
    });

    if (!thesis) {
      throw new Error('Thesis not found');
    }

    thesis.status = status;

    if (comments) {
      thesis.reviewFeedback = comments;
    }

    if (status === ThesisStatus.APPROVED) {
      thesis.approvalDate = new Date();
    }

    await this.thesisRepository.save(thesis);

    // Send email notification to student
    if (thesis.student && thesis.student.user) {
      const studentUser = thesis.student.user;
      await sendThesisStatusUpdateEmail(
        `${studentUser.firstName} ${studentUser.lastName}`,
        studentUser.email,
        thesis.title,
        status,
        comments
      );
    }

    return thesis;
  }

  /**
   * Get thesis by ID
   */
  async getThesisById(thesisId: string): Promise<Thesis> {
    const thesis = await this.thesisRepository.findOne({
      where: { id: thesisId },
      relations: ['student', 'student.user', 'supervisor', 'supervisor.user']
    });

    if (!thesis) {
      throw new Error('Thesis not found');
    }

    // Generate presigned URL for document if it exists
    if (thesis.documentUrl) {
      try {
        const presignedUrl = await getPresignedUrl(thesis.documentUrl);
        thesis.documentUrl = presignedUrl;
      } catch (error) {
        console.error('Error generating presigned URL:', error);
      }
    }

    return thesis;
  }

  /**
   * Get all theses
   */
  async getAllTheses(filters?: {
    status?: ThesisStatus;
    studentId?: string;
    supervisorId?: string;
    keyword?: string;
  }): Promise<Thesis[]> {
    const query = this.thesisRepository.createQueryBuilder('thesis')
      .leftJoinAndSelect('thesis.student', 'student')
      .leftJoinAndSelect('student.user', 'studentUser')
      .leftJoinAndSelect('thesis.supervisor', 'supervisor')
      .leftJoinAndSelect('supervisor.user', 'supervisorUser');

    if (filters) {
      if (filters.status) {
        query.andWhere('thesis.status = :status', { status: filters.status });
      }
      if (filters.studentId) {
        query.andWhere('thesis.studentId = :studentId', { studentId: filters.studentId });
      }
      if (filters.supervisorId) {
        query.andWhere('thesis.supervisorId = :supervisorId', { supervisorId: filters.supervisorId });
      }
      if (filters.keyword) {
        query.andWhere('thesis.keywords LIKE :keyword', { keyword: `%${filters.keyword}%` });
      }
    }

    const theses = await query.getMany();

    // Generate presigned URLs for documents
    for (const thesis of theses) {
      if (thesis.documentUrl) {
        try {
          const presignedUrl = await getPresignedUrl(thesis.documentUrl);
          thesis.documentUrl = presignedUrl;
        } catch (error) {
          console.error('Error generating presigned URL:', error);
        }
      }
    }

    return theses;
  }

  /**
   * Update thesis details
   */
  async updateThesis(
    thesisId: string,
    updateData: {
      title?: string;
      abstract?: string;
      keywords?: string[];
      supervisorId?: string;
    }
  ): Promise<Thesis> {
    const thesis = await this.thesisRepository.findOne({
      where: { id: thesisId },
      relations: ['student', 'student.user', 'supervisor']
    });

    if (!thesis) {
      throw new Error('Thesis not found');
    }

    // Check if the thesis can be edited
    if (![ThesisStatus.DRAFT, ThesisStatus.REVISION_NEEDED].includes(thesis.status)) {
      throw new Error(`Thesis cannot be edited in the ${thesis.status} status`);
    }

    // If supervisor is being updated, verify the new supervisor exists
    if (updateData.supervisorId) {
      const supervisor = await this.facultyRepository.findOne({
        where: { id: updateData.supervisorId }
      });

      if (!supervisor) {
        throw new Error('Supervisor not found');
      }
    }

    Object.assign(thesis, updateData);
    await this.thesisRepository.save(thesis);

    return this.getThesisById(thesisId);
  }

  /**
   * Delete thesis
   */
  async deleteThesis(thesisId: string): Promise<void> {
    const thesis = await this.thesisRepository.findOne({
      where: { id: thesisId }
    });

    if (!thesis) {
      throw new Error('Thesis not found');
    }

    // Only DRAFT theses can be deleted
    if (thesis.status !== ThesisStatus.DRAFT) {
      throw new Error('Only draft theses can be deleted');
    }

    await this.thesisRepository.remove(thesis);
  }
}