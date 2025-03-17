import { Request, Response } from 'express';
import { FeeService } from '../services/fee.service';
import { PaymentStatus, PaymentMethod } from '../models/Fee';
import { AuthRequest } from '../types/auth.types';
import multer from 'multer';

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
}).single('receipt');

export class FeeController {
  private feeService: FeeService;

  constructor() {
    this.feeService = new FeeService();
  }

  /**
   * Create a new fee record
   */
  createFeeRecord = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { studentId, semester, amount, dueDate, feeType, discount } = req.body;

      // Validate required fields
      if (!studentId || !semester || !amount || !dueDate || !feeType) {
        return res.status(400).json({
          status: 'error',
          message: 'Please provide all required fields: studentId, semester, amount, dueDate, feeType'
        });
      }

      const fee = await this.feeService.createFeeRecord({
        studentId,
        semester: Number(semester),
        amount: parseFloat(amount),
        dueDate: new Date(dueDate),
        feeType,
        discount: discount ? parseFloat(discount) : undefined
      });

      return res.status(201).json({
        status: 'success',
        message: 'Fee record created successfully',
        data: fee
      });
    } catch (error) {
      return res.status(400).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to create fee record'
      });
    }
  };

  /**
   * Generate bulk fee records
   */
  generateBulkFees = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { studentIds, semester, amount, dueDate, feeType, discounts } = req.body;

      // Validate required fields
      if (!studentIds || !Array.isArray(studentIds) || !semester || !amount || !dueDate || !feeType) {
        return res.status(400).json({
          status: 'error',
          message: 'Please provide all required fields: studentIds (array), semester, amount, dueDate, feeType'
        });
      }

      const result = await this.feeService.generateBulkFees({
        studentIds,
        semester: Number(semester),
        amount: parseFloat(amount),
        dueDate: new Date(dueDate),
        feeType,
        discounts
      });

      return res.status(201).json({
        status: 'success',
        message: `Successfully created ${result.created} fee records, failed: ${result.failed}`,
        data: result
      });
    } catch (error) {
      return res.status(400).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to generate bulk fees'
      });
    }
  };

  /**
   * Record fee payment
   */
  recordPayment = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const { paymentMethod, transactionId, paymentDate, amount } = req.body;

      // Validate required fields
      if (!paymentMethod || !paymentDate) {
        return res.status(400).json({
          status: 'error',
          message: 'Please provide all required fields: paymentMethod, paymentDate'
        });
      }

      // Validate payment method
      if (!Object.values(PaymentMethod).includes(paymentMethod as PaymentMethod)) {
        return res.status(400).json({
          status: 'error',
          message: `Invalid payment method. Must be one of: ${Object.values(PaymentMethod).join(', ')}`
        });
      }

      const fee = await this.feeService.recordPayment(id, {
        paymentMethod: paymentMethod as PaymentMethod,
        transactionId,
        paymentDate: new Date(paymentDate),
        amount: amount ? parseFloat(amount) : undefined
      });

      return res.status(200).json({
        status: 'success',
        message: 'Payment recorded successfully',
        data: fee
      });
    } catch (error) {
      return res.status(400).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to record payment'
      });
    }
  };

  /**
   * Upload receipt
   */
  uploadReceipt = async (req: Request, res: Response): Promise<Response> => {
    return new Promise((resolve) => {
      upload(req, res, async (err) => {
        if (err) {
          resolve(res.status(400).json({
            status: 'error',
            message: 'Receipt upload failed: ' + err.message
          }));
          return;
        }

        try {
          const { id } = req.params;
          const file = req.file;

          if (!file) {
            resolve(res.status(400).json({
              status: 'error',
              message: 'Please upload a receipt file'
            }));
            return;
          }

          const fee = await this.feeService.uploadReceipt(
            id,
            file.buffer,
            file.originalname
          );

          resolve(res.status(200).json({
            status: 'success',
            message: 'Receipt uploaded successfully',
            data: fee
          }));
        } catch (error) {
          resolve(res.status(400).json({
            status: 'error',
            message: error instanceof Error ? error.message : 'Failed to upload receipt'
          }));
        }
      });
    });
  };

  /**
   * Get all fees
   */
  getAllFees = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { 
        studentId, 
        semester, 
        status, 
        feeType, 
        dueFrom,
        dueTo
      } = req.query;

      const filters: any = {};
      
      if (studentId) filters.studentId = studentId as string;
      if (semester) filters.semester = Number(semester);
      if (status) filters.status = status as PaymentStatus;
      if (feeType) filters.feeType = feeType as string;
      if (dueFrom) filters.dueFrom = new Date(dueFrom as string);
      if (dueTo) filters.dueTo = new Date(dueTo as string);

      const fees = await this.feeService.getAllFees(filters);

      return res.status(200).json({
        status: 'success',
        message: 'Fees retrieved successfully',
        results: fees.length,
        data: fees
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to retrieve fees'
      });
    }
  };

  /**
   * Get fee by ID
   */
  getFeeById = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const fee = await this.feeService.getFeeById(id);

      return res.status(200).json({
        status: 'success',
        message: 'Fee retrieved successfully',
        data: fee
      });
    } catch (error) {
      return res.status(404).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Fee record not found'
      });
    }
  };

  /**
   * Get fees for current student
   */
  getMyFees = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required'
        });
      }

      // Only fetch fees for the logged-in student
      const fees = await this.feeService.getAllFees({
        studentId: req.user.id
      });

      return res.status(200).json({
        status: 'success',
        message: 'Your fees retrieved successfully',
        results: fees.length,
        data: fees
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to retrieve fees'
      });
    }
  };

  /**
   * Update fee details
   */
  updateFee = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const { amount, dueDate, discount, lateFee, remarks, status, feeType } = req.body;

      const updateData: any = {};
      
      if (amount !== undefined) updateData.amount = parseFloat(amount);
      if (dueDate) updateData.dueDate = new Date(dueDate);
      if (discount !== undefined) updateData.discount = parseFloat(discount);
      if (lateFee !== undefined) updateData.lateFee = parseFloat(lateFee);
      if (remarks) updateData.remarks = remarks;
      if (status && Object.values(PaymentStatus).includes(status as PaymentStatus)) {
        updateData.status = status;
      }
      if (feeType) updateData.feeType = feeType;

      const fee = await this.feeService.updateFee(id, updateData);

      return res.status(200).json({
        status: 'success',
        message: 'Fee updated successfully',
        data: fee
      });
    } catch (error) {
      return res.status(400).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to update fee'
      });
    }
  };

  /**
   * Add late fee
   */
  addLateFee = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const { amount } = req.body;

      if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Please provide a valid late fee amount greater than 0'
        });
      }

      const fee = await this.feeService.addLateFee(id, parseFloat(amount));

      return res.status(200).json({
        status: 'success',
        message: 'Late fee added successfully',
        data: fee
      });
    } catch (error) {
      return res.status(400).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to add late fee'
      });
    }
  };

  /**
   * Delete fee record
   */
  deleteFee = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      await this.feeService.deleteFee(id);

      return res.status(200).json({
        status: 'success',
        message: 'Fee record deleted successfully'
      });
    } catch (error) {
      return res.status(400).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to delete fee record'
      });
    }
  };
}