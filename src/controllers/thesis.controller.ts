import { Request, Response } from 'express';
import { ThesisService } from '../services/thesis.service';
import { ThesisStatus } from '../models/Thesis';
import { AuthRequest } from '../types/auth.types';
import multer from 'multer';

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
}).single('document');

export class ThesisController {
  private thesisService: ThesisService;

  constructor() {
    this.thesisService = new ThesisService();
  }

  /**
   * Create a new thesis
   */
  createThesis = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { title, abstract, studentId, supervisorId, keywords } = req.body;

      // Validate required fields
      if (!title || !studentId || !supervisorId) {
        return res.status(400).json({
          status: 'error',
          message: 'Please provide title, studentId, and supervisorId'
        });
      }

      const thesis = await this.thesisService.createThesis({
        title,
        abstract,
        studentId,
        supervisorId,
        keywords: keywords ? keywords.split(',').map((k: string) => k.trim()) : undefined
      });

      return res.status(201).json({
        status: 'success',
        message: 'Thesis created successfully',
        data: thesis
      });
    } catch (error) {
      return res.status(400).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to create thesis'
      });
    }
  };

  /**
   * Upload thesis document
   */
  uploadThesisDocument = async (req: Request, res: Response): Promise<Response> => {
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
          const file = req.file;

          if (!file) {
            resolve(res.status(400).json({
              status: 'error',
              message: 'Please upload a document file'
            }));
            return;
          }

          const thesis = await this.thesisService.uploadThesisDocument(
            id,
            file.buffer,
            file.originalname
          );

          resolve(res.status(200).json({
            status: 'success',
            message: 'Thesis document uploaded successfully',
            data: thesis
          }));
        } catch (error) {
          resolve(res.status(400).json({
            status: 'error',
            message: error instanceof Error ? error.message : 'Failed to upload thesis document'
          }));
        }
      });
    });
  };

  /**
   * Update thesis status
   */
  updateThesisStatus = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const { status, comments } = req.body;

      if (!status || !Object.values(ThesisStatus).includes(status as ThesisStatus)) {
        return res.status(400).json({
          status: 'error',
          message: `Invalid status. Must be one of: ${Object.values(ThesisStatus).join(', ')}`
        });
      }

      const thesis = await this.thesisService.updateThesisStatus(
        id,
        status as ThesisStatus,
        comments
      );

      return res.status(200).json({
        status: 'success',
        message: 'Thesis status updated successfully',
        data: thesis
      });
    } catch (error) {
      return res.status(400).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to update thesis status'
      });
    }
  };

  /**
   * Get all theses
   */
  getAllTheses = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { status, studentId, supervisorId, keyword } = req.query;

      const filters = {
        status: status as ThesisStatus,
        studentId: studentId as string,
        supervisorId: supervisorId as string,
        keyword: keyword as string
      };

      const theses = await this.thesisService.getAllTheses(filters);

      return res.status(200).json({
        status: 'success',
        message: 'Theses retrieved successfully',
        results: theses.length,
        data: theses
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to retrieve theses'
      });
    }
  };

  /**
   * Get thesis by ID
   */
  getThesisById = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const thesis = await this.thesisService.getThesisById(id);

      return res.status(200).json({
        status: 'success',
        message: 'Thesis retrieved successfully',
        data: thesis
      });
    } catch (error) {
      return res.status(404).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Thesis not found'
      });
    }
  };

  /**
   * Get theses for current student
   */
  getMyTheses = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required'
        });
      }

      // Only fetch theses for the logged-in student
      const theses = await this.thesisService.getAllTheses({
        studentId: req.user.id
      });

      return res.status(200).json({
        status: 'success',
        message: 'Your theses retrieved successfully',
        results: theses.length,
        data: theses
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to retrieve theses'
      });
    }
  };

  /**
   * Update thesis
   */
  updateThesis = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const { title, abstract, supervisorId, keywords } = req.body;

      const updateData: any = {};
      if (title) updateData.title = title;
      if (abstract) updateData.abstract = abstract;
      if (supervisorId) updateData.supervisorId = supervisorId;
      if (keywords) updateData.keywords = keywords.split(',').map((k: string) => k.trim());

      const thesis = await this.thesisService.updateThesis(id, updateData);

      return res.status(200).json({
        status: 'success',
        message: 'Thesis updated successfully',
        data: thesis
      });
    } catch (error) {
      return res.status(400).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to update thesis'
      });
    }
  };

  /**
   * Delete thesis
   */
  deleteThesis = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      await this.thesisService.deleteThesis(id);

      return res.status(200).json({
        status: 'success',
        message: 'Thesis deleted successfully'
      });
    } catch (error) {
      return res.status(400).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to delete thesis'
      });
    }
  };
}