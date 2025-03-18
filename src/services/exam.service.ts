import { Repository } from 'typeorm';
import { AppDataSource } from '../db/data-source';
import { Exam, ExamType, ExamStatus } from '../models/Exam';
import { Faculty } from '../models/Faculty';
import { uploadFileToS3, getPresignedUrl } from '../utils/s3.util';

export class ExamService {
  private examRepository: Repository<Exam>;
  private facultyRepository: Repository<Faculty>;

  constructor() {
    this.examRepository = AppDataSource.getRepository(Exam);
    this.facultyRepository = AppDataSource.getRepository(Faculty);
  }

  /**
   * Create a new exam
   */
  async createExam(examData: {
    title: string;
    courseCode: string;
    type: ExamType;
    startTime: Date;
    endTime: Date;
    venue: string;
    maxMarks?: number;
    passingMarks?: number;
    facultyInChargeId: string;
    semester: number;
    instructions?: string;
  }): Promise<Exam> {
    // Check if faculty exists
    const faculty = await this.facultyRepository.findOne({
      where: { id: examData.facultyInChargeId }
    });

    if (!faculty) {
      throw new Error('Faculty in charge not found');
    }

    // Validate exam timing
    if (examData.startTime >= examData.endTime) {
      throw new Error('Exam end time must be after start time');
    }

    const exam = this.examRepository.create({
      ...examData,
      status: ExamStatus.SCHEDULED
    });

    await this.examRepository.save(exam);
    return exam;
  }

  /**
   * Upload exam materials
   */
  async uploadMaterials(
    examId: string,
    files: Array<{ buffer: Buffer; originalname: string }>
  ): Promise<Exam> {
    const exam = await this.examRepository.findOne({
      where: { id: examId }
    });

    if (!exam) {
      throw new Error('Exam not found');
    }

    // Upload files to S3
    const uploadPromises = files.map(file =>
      uploadFileToS3(file.buffer, file.originalname, 'exam-materials')
    );

    const fileKeys = await Promise.all(uploadPromises);

    exam.attachments = exam.attachments 
      ? [...exam.attachments, ...fileKeys]
      : fileKeys;

    await this.examRepository.save(exam);
    return exam;
  }

  /**
   * Get exam by ID
   */
  async getExamById(examId: string): Promise<Exam> {
    const exam = await this.examRepository.findOne({
      where: { id: examId },
      relations: ['facultyInCharge', 'facultyInCharge.user']
    });

    if (!exam) {
      throw new Error('Exam not found');
    }

    // Generate presigned URLs for attachments
    if (exam.attachments && exam.attachments.length > 0) {
      const presignedUrls = await Promise.all(
        exam.attachments.map(attachment => getPresignedUrl(attachment))
      );
      exam.attachments = presignedUrls;
    }

    return exam;
  }

  /**
   * Get all exams with optional filters
   */
  async getAllExams(filters?: {
    type?: ExamType;
    status?: ExamStatus;
    courseCode?: string;
    semester?: number;
    facultyInChargeId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<Exam[]> {
    const query = this.examRepository.createQueryBuilder('exam')
      .leftJoinAndSelect('exam.facultyInCharge', 'facultyInCharge')
      .leftJoinAndSelect('facultyInCharge.user', 'user');

    if (filters) {
      if (filters.type) {
        query.andWhere('exam.type = :type', { type: filters.type });
      }
      if (filters.status) {
        query.andWhere('exam.status = :status', { status: filters.status });
      }
      if (filters.courseCode) {
        query.andWhere('exam.courseCode = :courseCode', { courseCode: filters.courseCode });
      }
      if (filters.semester) {
        query.andWhere('exam.semester = :semester', { semester: filters.semester });
      }
      if (filters.facultyInChargeId) {
        query.andWhere('exam.facultyInChargeId = :facultyInChargeId', { facultyInChargeId: filters.facultyInChargeId });
      }
      if (filters.startDate) {
        query.andWhere('exam.startTime >= :startDate', { startDate: filters.startDate });
      }
      if (filters.endDate) {
        query.andWhere('exam.endTime <= :endDate', { endDate: filters.endDate });
      }
    }

    const exams = await query.getMany();

    // Generate presigned URLs for attachments
    for (const exam of exams) {
      if (exam.attachments && exam.attachments.length > 0) {
        const presignedUrls = await Promise.all(
          exam.attachments.map(attachment => getPresignedUrl(attachment))
        );
        exam.attachments = presignedUrls;
      }
    }

    return exams;
  }

  /**
   * Update exam details
   */
  async updateExam(
    examId: string,
    updateData: {
      title?: string;
      startTime?: Date;
      endTime?: Date;
      venue?: string;
      maxMarks?: number;
      passingMarks?: number;
      status?: ExamStatus;
      instructions?: string;
      proctors?: string[];
      remarks?: string;
    }
  ): Promise<Exam> {
    const exam = await this.examRepository.findOne({
      where: { id: examId }
    });

    if (!exam) {
      throw new Error('Exam not found');
    }

    // Validate exam timing if being updated
    if (updateData.startTime && updateData.endTime) {
      if (updateData.startTime >= updateData.endTime) {
        throw new Error('Exam end time must be after start time');
      }
    } else if (updateData.startTime && updateData.startTime >= exam.endTime) {
      throw new Error('Exam end time must be after start time');
    } else if (updateData.endTime && exam.startTime >= updateData.endTime) {
      throw new Error('Exam end time must be after start time');
    }

    // Update exam details
    Object.assign(exam, updateData);
    await this.examRepository.save(exam);

    return this.getExamById(examId);
  }

  /**
   * Delete exam
   */
  async deleteExam(examId: string): Promise<void> {
    const exam = await this.examRepository.findOne({
      where: { id: examId }
    });

    if (!exam) {
      throw new Error('Exam not found');
    }

    // Only allow deletion of scheduled or cancelled exams
    if (![ExamStatus.SCHEDULED, ExamStatus.CANCELLED].includes(exam.status)) {
      throw new Error(`Exam in ${exam.status} status cannot be deleted`);
    }

    await this.examRepository.remove(exam);
  }
}