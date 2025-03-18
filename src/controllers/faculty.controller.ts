import { Request, Response } from 'express';
import { FacultyService } from '../services/faculty.service';
import { AuthRequest } from '../types/auth.types';

export class FacultyController {
  private facultyService: FacultyService;

  constructor() {
    this.facultyService = new FacultyService();
  }

  /**
   * Register a new faculty member
   */
  registerFaculty = async (req: Request, res: Response): Promise<Response> => {
    try {
      const {
        firstName,
        lastName,
        email,
        password,
        employeeId,
        department,
        designation,
        specialization,
        qualifications,
        joiningDate,
        experience,
        contactNumber
      } = req.body;

      // Validate required fields
      if (!firstName || !lastName || !email || !password || !employeeId || !department || !designation || !specialization) {
        return res.status(400).json({
          status: 'error',
          message: 'Please provide all required fields'
        });
      }

      const faculty = await this.facultyService.registerFaculty({
        firstName,
        lastName,
        email,
        password,
        employeeId,
        department,
        designation,
        specialization,
        qualifications,
        joiningDate: joiningDate ? new Date(joiningDate) : undefined,
        experience: experience ? Number(experience) : undefined,
        contactNumber
      });

      return res.status(201).json({
        status: 'success',
        message: 'Faculty registered successfully',
        data: faculty
      });
    } catch (error) {
      return res.status(400).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to register faculty'
      });
    }
  };

  /**
   * Get all faculty members
   */
  getAllFaculty = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { department, designation, specialization } = req.query;

      const filters: any = {};
      if (department) filters.department = department as string;
      if (designation) filters.designation = designation as string;
      if (specialization) filters.specialization = specialization as string;

      const faculty = await this.facultyService.getAllFaculty(filters);

      return res.status(200).json({
        status: 'success',
        message: 'Faculty members retrieved successfully',
        results: faculty.length,
        data: faculty
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to retrieve faculty members'
      });
    }
  };

  /**
   * Get faculty by ID
   */
  getFacultyById = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const faculty = await this.facultyService.getFacultyById(id);

      return res.status(200).json({
        status: 'success',
        message: 'Faculty retrieved successfully',
        data: faculty
      });
    } catch (error) {
      return res.status(404).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Faculty not found'
      });
    }
  };

  /**
   * Get faculty by employee ID
   */
  getFacultyByEmployeeId = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { employeeId } = req.params;
      const faculty = await this.facultyService.getFacultyByEmployeeId(employeeId);

      return res.status(200).json({
        status: 'success',
        message: 'Faculty retrieved successfully',
        data: faculty
      });
    } catch (error) {
      return res.status(404).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Faculty not found'
      });
    }
  };

  /**
   * Get faculty profile (for current logged-in faculty)
   */
  getMyProfile = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required'
        });
      }

      // Find faculty record associated with the logged-in user
      const facultyMembers = await this.facultyService.getAllFaculty();
      const myProfile = facultyMembers.find(faculty => faculty.userId === req.user!.id);
      
      if (!myProfile) {
        return res.status(404).json({
          status: 'error',
          message: 'Faculty profile not found'
        });
      }

      return res.status(200).json({
        status: 'success',
        message: 'Profile retrieved successfully',
        data: myProfile
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to retrieve profile'
      });
    }
  };

  /**
   * Update faculty information
   */
  updateFaculty = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const {
        department,
        designation,
        specialization,
        qualifications,
        experience,
        firstName,
        lastName,
        contactNumber,
        profilePicture
      } = req.body;

      const updateData: any = {};
      
      if (department) updateData.department = department;
      if (designation) updateData.designation = designation;
      if (specialization) updateData.specialization = specialization;
      if (qualifications) updateData.qualifications = qualifications;
      if (experience) updateData.experience = Number(experience);
      if (firstName) updateData.firstName = firstName;
      if (lastName) updateData.lastName = lastName;
      if (contactNumber) updateData.contactNumber = contactNumber;
      if (profilePicture) updateData.profilePicture = profilePicture;

      const faculty = await this.facultyService.updateFaculty(id, updateData);

      return res.status(200).json({
        status: 'success',
        message: 'Faculty updated successfully',
        data: faculty
      });
    } catch (error) {
      return res.status(400).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to update faculty'
      });
    }
  };

  /**
   * Delete faculty
   */
  deleteFaculty = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      await this.facultyService.deleteFaculty(id);

      return res.status(200).json({
        status: 'success',
        message: 'Faculty deleted successfully'
      });
    } catch (error) {
      return res.status(400).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to delete faculty'
      });
    }
  };

  /**
   * Get faculty teaching load
   */
  getTeachingLoad = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const load = await this.facultyService.getFacultyTeachingLoad(id);

      return res.status(200).json({
        status: 'success',
        message: 'Teaching load retrieved successfully',
        data: { load }
      });
    } catch (error) {
      return res.status(404).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to retrieve teaching load'
      });
    }
  };
}