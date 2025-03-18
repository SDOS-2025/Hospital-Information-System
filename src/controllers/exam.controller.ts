import { Request, Response } from 'express';
import { ExamService } from '../services/exam.service';
import { ExamType, ExamStatus } from '../models/Exam';
import { AuthRequest } from '../types/auth.types';
import multer from 'multer';

const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
}).array('materials', 5);

export class ExamController {
  private examService: ExamService;

  constructor() {
    this.examService = new ExamService();
  }

  createExam = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { 
        title, 
        courseCode, 
        type, 
        startTime, 
        endTime, 
        venue,
        maxMarks,
        passingMarks,
        facultyInChargeId,
        semester,
        instructions 
      } = req.body;

      if (!title || !courseCode || !type || !startTime || !endTime || !venue || !facultyInChargeId || !semester) {
        return res.status(400).json({
          status: 'error',
          message: 'Please provide all required fields'
        });
      }

      const exam = await this.examService.createExam({
        title,
        courseCode,
        type: type as ExamType,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        venue,
        maxMarks: maxMarks ? Number(maxMarks) : undefined,
        passingMarks: passingMarks ? Number(passingMarks) : undefined,
        facultyInChargeId,
        semester: Number(semester),
        instructions
      });

      return res.status(201).json({
        status: 'success',
        message: 'Exam created successfully',
        data: exam
      });
    } catch (error) {
      return res.status(400).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to create exam'
      });
    }
  };

  uploadMaterials = async (req: Request, res: Response): Promise<Response> => {
    return new Promise((resolve) => {
      upload(req, res, async (err) => {
        if (err) {
          resolve(res.status(400).json({
            status: 'error',
            message: 'Material upload failed: ' + err.message
          }));
          return;
        }

        try {
          const { id } = req.params;
          const files = req.files as Express.Multer.File[];

          if (!files || files.length === 0) {
            resolve(res.status(400).json({
              status: 'error',
              message: 'Please upload at least one file'
            }));
            return;
          }

          const exam = await this.examService.uploadMaterials(
            id,
            files.map(file => ({
              buffer: file.buffer,
              originalname: file.originalname
            }))
          );

          resolve(res.status(200).json({
            status: 'success',
            message: 'Exam materials uploaded successfully',
            data: exam
          }));
        } catch (error) {
          resolve(res.status(400).json({
            status: 'error',
            message: error instanceof Error ? error.message : 'Failed to upload exam materials'
          }));
        }
      });
    });
  };

  getAllExams = async (req: Request, res: Response): Promise<Response> => {
    try {
      const {
        type,
        status,
        courseCode,
        semester,
        facultyInChargeId,
        startDate,
        endDate
      } = req.query;

      const filters: any = {};
      
      if (type) filters.type = type as ExamType;
      if (status) filters.status = status as ExamStatus;
      if (courseCode) filters.courseCode = courseCode as string;
      if (semester) filters.semester = Number(semester);
      if (facultyInChargeId) filters.facultyInChargeId = facultyInChargeId as string;
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);

      const exams = await this.examService.getAllExams(filters);

      return res.status(200).json({
        status: 'success',
        message: 'Exams retrieved successfully',
        results: exams.length,
        data: exams
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to retrieve exams'
      });
    }
  };

  getExamById = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const exam = await this.examService.getExamById(id);

      return res.status(200).json({
        status: 'success',
        message: 'Exam retrieved successfully',
        data: exam
      });
    } catch (error) {
      return res.status(404).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Exam not found'
      });
    }
  };

  updateExam = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const {
        title,
        startTime,
        endTime,
        venue,
        maxMarks,
        passingMarks,
        status,
        instructions,
        proctors,
        remarks
      } = req.body;

      const updateData: any = {};
      
      if (title) updateData.title = title;
      if (startTime) updateData.startTime = new Date(startTime);
      if (endTime) updateData.endTime = new Date(endTime);
      if (venue) updateData.venue = venue;
      if (maxMarks) updateData.maxMarks = Number(maxMarks);
      if (passingMarks) updateData.passingMarks = Number(passingMarks);
      if (status && Object.values(ExamStatus).includes(status as ExamStatus)) {
        updateData.status = status;
      }
      if (instructions) updateData.instructions = instructions;
      if (proctors) updateData.proctors = proctors;
      if (remarks) updateData.remarks = remarks;

      const exam = await this.examService.updateExam(id, updateData);

      return res.status(200).json({
        status: 'success',
        message: 'Exam updated successfully',
        data: exam
      });
    } catch (error) {
      return res.status(400).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to update exam'
      });
    }
  };

  deleteExam = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      await this.examService.deleteExam(id);

      return res.status(200).json({
        status: 'success',
        message: 'Exam deleted successfully'
      });
    } catch (error) {
      return res.status(400).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to delete exam'
      });
    }
  };
}
