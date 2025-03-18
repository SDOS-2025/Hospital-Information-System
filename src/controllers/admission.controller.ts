import { Request, Response } from 'express';
import { AdmissionService } from '../services/admission.service';
import { AdmissionStatus } from '../models/Admission';
import multer from 'multer';

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
}).array('documents', 5);

export class AdmissionController {
  private admissionService: AdmissionService;

  constructor() {
    this.admissionService = new AdmissionService();
  }

  /**
   * Submit new admission application
   */
  submitApplication = async (req: Request, res: Response): Promise<Response> => {
    try {
      const {
        program,
        department,
        personalDetails,
        educationHistory,
        entranceExamScore
      } = req.body;

      // Validate required fields
      if (!program || !department || !personalDetails || !educationHistory) {
        return res.status(400).json({
          status: 'error',
          message: 'Please provide all required fields'
        });
      }

      // Validate personal details
      if (!this.validatePersonalDetails(personalDetails)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid or incomplete personal details'
        });
      }

      const admission = await this.admissionService.submitApplication({
        program,
        department,
        personalDetails,
        educationHistory,
        entranceExamScore: entranceExamScore ? Number(entranceExamScore) : undefined
      });

      return res.status(201).json({
        status: 'success',
        message: 'Admission application submitted successfully',
        data: admission
      });
    } catch (error) {
      return res.status(400).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to submit application'
      });
    }
  };

  /**
   * Upload admission documents
   */
  uploadDocuments = async (req: Request, res: Response): Promise<Response> => {
    return new Promise((resolve) => {
      upload(req, res, async (err) => {
        if (err) {
          resolve(res.status(400).json({
            status: 'error',
            message: 'Document upload failed: ' + err.message
          }));
          return;
        }

        try {
          const { id } = req.params;
          const files = req.files as Express.Multer.File[];

          if (!files || files.length === 0) {
            resolve(res.status(400).json({
              status: 'error',
              message: 'Please upload at least one document'
            }));
            return;
          }

          const admission = await this.admissionService.uploadDocuments(
            id,
            files.map(file => ({
              buffer: file.buffer,
              originalname: file.originalname
            }))
          );

          resolve(res.status(200).json({
            status: 'success',
            message: 'Documents uploaded successfully',
            data: admission
          }));
        } catch (error) {
          resolve(res.status(400).json({
            status: 'error',
            message: error instanceof Error ? error.message : 'Failed to upload documents'
          }));
        }
      });
    });
  };

  /**
   * Schedule interview
   */
  scheduleInterview = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const { interviewDate, interviewPanel } = req.body;

      if (!interviewDate || !interviewPanel || !Array.isArray(interviewPanel)) {
        return res.status(400).json({
          status: 'error',
          message: 'Please provide interview date and panel members'
        });
      }

      const admission = await this.admissionService.scheduleInterview(
        id,
        new Date(interviewDate),
        interviewPanel
      );

      return res.status(200).json({
        status: 'success',
        message: 'Interview scheduled successfully',
        data: admission
      });
    } catch (error) {
      return res.status(400).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to schedule interview'
      });
    }
  };

  /**
   * Record interview results
   */
  recordInterviewResults = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const { notes, status, remarks } = req.body;

      if (!notes || !status || ![AdmissionStatus.APPROVED, AdmissionStatus.REJECTED].includes(status)) {
        return res.status(400).json({
          status: 'error',
          message: 'Please provide interview notes and valid status (approved/rejected)'
        });
      }

      const admission = await this.admissionService.recordInterviewResults(
        id,
        notes,
        status,
        remarks
      );

      return res.status(200).json({
        status: 'success',
        message: 'Interview results recorded successfully',
        data: admission
      });
    } catch (error) {
      return res.status(400).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to record interview results'
      });
    }
  };

  /**
   * Complete enrollment
   */
  completeEnrollment = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const result = await this.admissionService.completeEnrollment(id);

      return res.status(200).json({
        status: 'success',
        message: 'Enrollment completed successfully',
        data: result
      });
    } catch (error) {
      return res.status(400).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to complete enrollment'
      });
    }
  };

  /**
   * Get all admissions
   */
  getAllAdmissions = async (req: Request, res: Response): Promise<Response> => {
    try {
      const {
        status,
        program,
        department,
        fromDate,
        toDate
      } = req.query;

      const filters: any = {};
      
      if (status) filters.status = status as AdmissionStatus;
      if (program) filters.program = program as string;
      if (department) filters.department = department as string;
      if (fromDate) filters.fromDate = new Date(fromDate as string);
      if (toDate) filters.toDate = new Date(toDate as string);

      const admissions = await this.admissionService.getAllAdmissions(filters);

      return res.status(200).json({
        status: 'success',
        message: 'Admissions retrieved successfully',
        results: admissions.length,
        data: admissions
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to retrieve admissions'
      });
    }
  };

  /**
   * Get admission by ID
   */
  getAdmissionById = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const admission = await this.admissionService.getAdmissionById(id);

      return res.status(200).json({
        status: 'success',
        message: 'Admission retrieved successfully',
        data: admission
      });
    } catch (error) {
      return res.status(404).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Admission not found'
      });
    }
  };

  /**
   * Update admission
   */
  updateAdmission = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const {
        program,
        department,
        entranceExamScore,
        previousEducationPercentage,
        personalDetails,
        educationHistory,
        remarks
      } = req.body;

      const updateData: any = {};
      
      if (program) updateData.program = program;
      if (department) updateData.department = department;
      if (entranceExamScore) updateData.entranceExamScore = Number(entranceExamScore);
      if (previousEducationPercentage) updateData.previousEducationPercentage = Number(previousEducationPercentage);
      if (personalDetails) updateData.personalDetails = personalDetails;
      if (educationHistory) updateData.educationHistory = educationHistory;
      if (remarks) updateData.remarks = remarks;

      const admission = await this.admissionService.updateAdmission(id, updateData);

      return res.status(200).json({
        status: 'success',
        message: 'Admission updated successfully',
        data: admission
      });
    } catch (error) {
      return res.status(400).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to update admission'
      });
    }
  };

  /**
   * Cancel admission
   */
  cancelAdmission = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      await this.admissionService.cancelAdmission(id);

      return res.status(200).json({
        status: 'success',
        message: 'Admission cancelled successfully'
      });
    } catch (error) {
      return res.status(400).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to cancel admission'
      });
    }
  };

  /**
   * Bulk submit admission applications
   */
  bulkSubmitApplications = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { applications } = req.body;

      if (!applications || !Array.isArray(applications)) {
        return res.status(400).json({
          status: 'error',
          message: 'Please provide an array of applications'
        });
      }

      // Validate each application
      for (const app of applications) {
        if (!app.program || !app.department || !app.personalDetails || !app.educationHistory) {
          return res.status(400).json({
            status: 'error',
            message: 'Each application must include program, department, personalDetails, and educationHistory'
          });
        }

        if (!this.validatePersonalDetails(app.personalDetails)) {
          return res.status(400).json({
            status: 'error',
            message: 'Invalid or incomplete personal details in one or more applications'
          });
        }
      }

      const admissions = await this.admissionService.bulkSubmitApplications(applications);

      return res.status(201).json({
        status: 'success',
        message: `Successfully submitted ${admissions.length} applications`,
        data: admissions
      });
    } catch (error) {
      return res.status(400).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to submit applications'
      });
    }
  };

  /**
   * Bulk update admission status
   */
  bulkUpdateStatus = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { admissionIds, status, remarks } = req.body;

      if (!admissionIds || !Array.isArray(admissionIds) || !status) {
        return res.status(400).json({
          status: 'error',
          message: 'Please provide admissionIds array and status'
        });
      }

      if (!Object.values(AdmissionStatus).includes(status)) {
        return res.status(400).json({
          status: 'error',
          message: `Invalid status. Must be one of: ${Object.values(AdmissionStatus).join(', ')}`
        });
      }

      const admissions = await this.admissionService.bulkUpdateStatus(
        admissionIds,
        status,
        remarks
      );

      return res.status(200).json({
        status: 'success',
        message: `Successfully updated ${admissions.length} admissions`,
        data: admissions
      });
    } catch (error) {
      return res.status(400).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to update admissions'
      });
    }
  };

  /**
   * Validate personal details
   */
  private validatePersonalDetails(details: any): boolean {
    return !!(
      details &&
      details.firstName &&
      details.lastName &&
      details.email &&
      details.phone &&
      details.dateOfBirth &&
      details.gender &&
      details.address &&
      details.address.street &&
      details.address.city &&
      details.address.state &&
      details.address.postalCode &&
      details.address.country
    );
  }
}