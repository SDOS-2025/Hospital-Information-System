import { Repository } from 'typeorm';
import { AppDataSource } from '../db/data-source';
import { Fee, PaymentStatus, PaymentMethod } from '../models/Fee';
import { Student } from '../models/Student';
import { User } from '../models/User';
import { sendFeePaymentConfirmationEmail } from '../utils/email.util';
import { uploadFileToS3, getPresignedUrl } from '../utils/s3.util';
import crypto from 'crypto';

export class FeeService {
  private feeRepository: Repository<Fee>;
  private studentRepository: Repository<Student>;
  private userRepository: Repository<User>;

  constructor() {
    this.feeRepository = AppDataSource.getRepository(Fee);
    this.studentRepository = AppDataSource.getRepository(Student);
    this.userRepository = AppDataSource.getRepository(User);
  }

  /**
   * Create a new fee record
   */
  async createFeeRecord(feeData: {
    studentId: string;
    semester: number;
    amount: number;
    dueDate: Date;
    feeType: string;
    discount?: number;
  }): Promise<Fee> {
    // Check if student exists
    const student = await this.studentRepository.findOne({
      where: { id: feeData.studentId },
      relations: ['user']
    });

    if (!student) {
      throw new Error('Student not found');
    }

    const fee = this.feeRepository.create({
      ...feeData,
      status: PaymentStatus.PENDING,
      discount: feeData.discount || 0,
      lateFee: 0
    });

    await this.feeRepository.save(fee);
    return fee;
  }

  /**
   * Generate bulk fee records for multiple students
   */
  async generateBulkFees(feeData: {
    studentIds: string[];
    semester: number;
    amount: number;
    dueDate: Date;
    feeType: string;
    discounts?: Record<string, number>; // studentId -> discount amount
  }): Promise<{ created: number; failed: number }> {
    const { studentIds, semester, amount, dueDate, feeType, discounts } = feeData;
    let created = 0;
    let failed = 0;

    for (const studentId of studentIds) {
      try {
        await this.createFeeRecord({
          studentId,
          semester,
          amount,
          dueDate,
          feeType,
          discount: discounts?.[studentId] || 0
        });
        created++;
      } catch (error) {
        failed++;
        console.error(`Failed to create fee for student ${studentId}:`, error);
      }
    }

    return { created, failed };
  }

  /**
   * Record fee payment
   */
  async recordPayment(
    feeId: string,
    paymentData: {
      paymentMethod: PaymentMethod;
      transactionId?: string;
      paymentDate: Date;
      amount?: number;
    }
  ): Promise<Fee> {
    const fee = await this.feeRepository.findOne({
      where: { id: feeId },
      relations: ['student', 'student.user']
    });

    if (!fee) {
      throw new Error('Fee record not found');
    }

    // Generate receipt number
    const receiptNumber = `RCP-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // Update fee status based on payment amount
    const paymentAmount = paymentData.amount || fee.amount;
    if (paymentAmount >= fee.amount + fee.lateFee) {
      fee.status = PaymentStatus.PAID;
    } else if (paymentAmount > 0) {
      fee.status = PaymentStatus.PARTIAL;
    }

    // Update fee with payment info
    fee.paymentDate = paymentData.paymentDate;
    fee.paymentMethod = paymentData.paymentMethod;
    if (paymentData.transactionId) {
      fee.transactionId = paymentData.transactionId;
    }

    await this.feeRepository.save(fee);

    // Send payment confirmation email to student
    if (fee.student?.user) {
      const { firstName, lastName, email } = fee.student.user;
      await sendFeePaymentConfirmationEmail(
        `${firstName} ${lastName}`,
        email,
        paymentAmount,
        receiptNumber,
        paymentData.paymentDate
      );
    }

    return fee;
  }

  /**
   * Upload payment receipt
   */
  async uploadReceipt(
    feeId: string,
    file: Buffer,
    fileName: string
  ): Promise<Fee> {
    const fee = await this.feeRepository.findOne({
      where: { id: feeId }
    });

    if (!fee) {
      throw new Error('Fee record not found');
    }

    // Upload receipt to S3
    const receiptKey = await uploadFileToS3(file, fileName, 'receipts');
    fee.receiptUrl = receiptKey;

    await this.feeRepository.save(fee);
    return fee;
  }

  /**
   * Get fee by ID
   */
  async getFeeById(feeId: string): Promise<Fee> {
    const fee = await this.feeRepository.findOne({
      where: { id: feeId },
      relations: ['student', 'student.user']
    });

    if (!fee) {
      throw new Error('Fee record not found');
    }

    // Generate presigned URL for receipt if it exists
    if (fee.receiptUrl) {
      try {
        fee.receiptUrl = await getPresignedUrl(fee.receiptUrl);
      } catch (error) {
        console.error('Error generating presigned URL:', error);
      }
    }

    return fee;
  }

  /**
   * Get all fees with optional filters
   */
  async getAllFees(filters?: {
    studentId?: string;
    semester?: number;
    status?: PaymentStatus;
    feeType?: string;
    dueFrom?: Date;
    dueTo?: Date;
  }): Promise<Fee[]> {
    const query = this.feeRepository.createQueryBuilder('fee')
      .leftJoinAndSelect('fee.student', 'student')
      .leftJoinAndSelect('student.user', 'user');

    if (filters) {
      if (filters.studentId) {
        query.andWhere('fee.studentId = :studentId', { studentId: filters.studentId });
      }
      if (filters.semester) {
        query.andWhere('fee.semester = :semester', { semester: filters.semester });
      }
      if (filters.status) {
        query.andWhere('fee.status = :status', { status: filters.status });
      }
      if (filters.feeType) {
        query.andWhere('fee.feeType = :feeType', { feeType: filters.feeType });
      }
      if (filters.dueFrom) {
        query.andWhere('fee.dueDate >= :dueFrom', { dueFrom: filters.dueFrom });
      }
      if (filters.dueTo) {
        query.andWhere('fee.dueDate <= :dueTo', { dueTo: filters.dueTo });
      }
    }

    const fees = await query.getMany();

    // Generate presigned URLs for receipts
    for (const fee of fees) {
      if (fee.receiptUrl) {
        try {
          fee.receiptUrl = await getPresignedUrl(fee.receiptUrl);
        } catch (error) {
          console.error('Error generating presigned URL:', error);
        }
      }
    }

    return fees;
  }

  /**
   * Update fee details
   */
  async updateFee(
    feeId: string,
    updateData: {
      amount?: number;
      dueDate?: Date;
      discount?: number;
      lateFee?: number;
      remarks?: string;
      status?: PaymentStatus;
      feeType?: string;
    }
  ): Promise<Fee> {
    const fee = await this.feeRepository.findOne({
      where: { id: feeId }
    });

    if (!fee) {
      throw new Error('Fee record not found');
    }

    // Update fee details
    Object.assign(fee, updateData);
    await this.feeRepository.save(fee);

    return this.getFeeById(feeId);
  }

  /**
   * Add late fee
   */
  async addLateFee(
    feeId: string,
    lateFeeAmount: number
  ): Promise<Fee> {
    const fee = await this.feeRepository.findOne({
      where: { id: feeId }
    });

    if (!fee) {
      throw new Error('Fee record not found');
    }

    if (fee.status !== PaymentStatus.PENDING) {
      throw new Error('Late fee can only be added to pending payments');
    }

    fee.lateFee += lateFeeAmount;
    await this.feeRepository.save(fee);

    return this.getFeeById(feeId);
  }

  /**
   * Delete fee record
   */
  async deleteFee(feeId: string): Promise<void> {
    const fee = await this.feeRepository.findOne({
      where: { id: feeId }
    });

    if (!fee) {
      throw new Error('Fee record not found');
    }

    // Only unpaid fees can be deleted
    if (fee.status !== PaymentStatus.PENDING) {
      throw new Error('Only pending fee records can be deleted');
    }

    await this.feeRepository.remove(fee);
  }
}