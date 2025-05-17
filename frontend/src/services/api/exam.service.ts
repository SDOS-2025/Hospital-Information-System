import { Exam } from '../../types/api.types';

// Enhanced exam types for our UI needs
export type ExamType = 'internal' | 'midterm' | 'fat' | 'practical' | 'viva';
export type ExamStatus = 'scheduled' | 'ongoing' | 'completed' | 'cancelled' | 'postponed';

export interface ExamDetails extends Omit<Exam, 'type'> {
  type: ExamType;
  status: ExamStatus;
  courseCode: string;
  semester: number;
  venue: string;
  startTime: Date;
  endTime: Date;
  facultyInCharge: {
    id: number;
    name: string;
    department: string;
    email: string;
  };
  maxMarks?: number;
  passingMarks?: number;
  instructions?: string;
  proctors?: string[];
  attachments?: string[];
  remarks?: string;
}

export interface ExamFilterOptions {
  type?: ExamType;
  status?: ExamStatus;
  courseCode?: string;
  semester?: number;
  facultyInChargeId?: number;
  startDate?: Date;
  endDate?: Date;
}

export interface ExamCreateDto {
  title: string;
  courseCode: string;
  type: ExamType;
  startTime: Date;
  endTime: Date;
  venue: string;
  semester: number;
  facultyInChargeId: number;
  maxMarks?: number;
  passingMarks?: number;
  instructions?: string;
}

export interface ExamUpdateDto {
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

class ExamService {
  private apiUrl = '/api/exams';

  // Get all exams with optional filters
  async getAllExams(filters?: ExamFilterOptions): Promise<ExamDetails[]> {
    // This would be a real API call in a production app
    // For now we'll use mock data
    return this.getMockExams().filter(exam => {
      if (!filters) return true;
      
      if (filters.type && exam.type !== filters.type) return false;
      if (filters.status && exam.status !== filters.status) return false;
      if (filters.courseCode && exam.courseCode !== filters.courseCode) return false;
      if (filters.semester && exam.semester !== filters.semester) return false;
      if (filters.facultyInChargeId && exam.facultyInCharge.id !== filters.facultyInChargeId) return false;
      
      if (filters.startDate && new Date(exam.startTime) < new Date(filters.startDate)) return false;
      if (filters.endDate && new Date(exam.endTime) > new Date(filters.endDate)) return false;
      
      return true;
    });
  }

  // Get exam by ID
  async getExamById(id: number): Promise<ExamDetails> {
    const exam = this.getMockExams().find(e => e.id === id);
    
    if (!exam) {
      throw new Error('Exam not found');
    }
    
    return exam;
  }

  // Create a new exam
  async createExam(examData: ExamCreateDto): Promise<ExamDetails> {
    // In a real app, this would submit to your API
    console.log('Creating exam:', examData);
    
    const mockExam: ExamDetails = {
      id: Math.floor(Math.random() * 1000) + 10, // Random ID
      title: examData.title,
      courseCode: examData.courseCode,
      type: examData.type,
      status: 'scheduled',
      startTime: examData.startTime,
      endTime: examData.endTime,
      venue: examData.venue,
      semester: examData.semester,
      facultyInCharge: {
        id: examData.facultyInChargeId,
        name: "Dr. John Smith", // Would come from the API in a real app
        department: "Cardiology",
        email: "john.smith@example.com"
      },
      maxMarks: examData.maxMarks,
      passingMarks: examData.passingMarks,
      instructions: examData.instructions,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    return mockExam;
  }

  // Update exam details
  async updateExam(id: number, updateData: ExamUpdateDto): Promise<ExamDetails> {
    // In a real app, this would submit to your API
    console.log('Updating exam:', id, updateData);
    
    const exam = await this.getExamById(id);
    
    // In a real app, this would be handled by the backend
    const updatedExam: ExamDetails = {
      ...exam,
      ...updateData,
      updatedAt: new Date()
    };
    
    return updatedExam;
  }

  // Upload exam materials
  async uploadMaterials(id: number, files: File[]): Promise<ExamDetails> {
    // In a real app, this would upload the files to your API
    console.log('Uploading materials for exam:', id, files.map(f => f.name));
    
    const exam = await this.getExamById(id);
    
    // Mock attaching URLs
    const mockUrls = files.map(file => URL.createObjectURL(file));
    
    const updatedExam: ExamDetails = {
      ...exam,
      attachments: [...(exam.attachments || []), ...mockUrls],
      updatedAt: new Date()
    };
    
    return updatedExam;
  }

  // Delete an exam
  async deleteExam(id: number): Promise<void> {
    // In a real app, this would submit to your API
    console.log('Deleting exam:', id);
    
    const exam = await this.getExamById(id);
    
    if (!['scheduled', 'cancelled'].includes(exam.status)) {
      throw new Error(`Exam in ${exam.status} status cannot be deleted`);
    }
    
    // Would delete the exam in a real API
  }

  // Helper method to generate mock data
  private getMockExams(): ExamDetails[] {
    return [
      {
        id: 1,
        title: "Cardiac Physiology Midterm",
        courseCode: "CAR201",
        type: "midterm",
        status: "completed",
        startTime: new Date("2025-04-15T10:00:00"),
        endTime: new Date("2025-04-15T12:00:00"),
        venue: "Main Auditorium",
        semester: 4,
        facultyInCharge: {
          id: 1,
          name: "Dr. Robert Chen",
          department: "Cardiology",
          email: "r.chen@example.com"
        },
        maxMarks: 100,
        passingMarks: 50,
        instructions: "No electronic devices allowed. Answer all sections.",
        proctors: ["Dr. James Wilson", "Dr. Sarah Lee"],
        attachments: ["https://example.com/exams/cardiac_physiology_midterm.pdf"],
        remarks: "Exam completed successfully. Papers sent for evaluation.",
        createdAt: new Date("2025-03-01"),
        updatedAt: new Date("2025-04-16")
      },
      {
        id: 2,
        title: "Immunology Final Assessment",
        courseCode: "IMM302",
        type: "fat",
        status: "scheduled",
        startTime: new Date("2025-05-20T14:00:00"),
        endTime: new Date("2025-05-20T17:00:00"),
        venue: "Lecture Hall B",
        semester: 5,
        facultyInCharge: {
          id: 2,
          name: "Dr. Sarah Lee",
          department: "Immunology",
          email: "s.lee@example.com"
        },
        maxMarks: 150,
        passingMarks: 75,
        instructions: "Comprehensive exam covering all semester topics. Section A is MCQs and Section B is short answers.",
        attachments: [],
        createdAt: new Date("2025-04-01"),
        updatedAt: new Date("2025-04-10")
      },
      {
        id: 3,
        title: "Surgical Techniques Practical",
        courseCode: "SUR401",
        type: "practical",
        status: "ongoing",
        startTime: new Date("2025-05-04T09:00:00"),
        endTime: new Date("2025-05-04T16:00:00"),
        venue: "Simulation Lab",
        semester: 6,
        facultyInCharge: {
          id: 4,
          name: "Dr. David Garcia",
          department: "Surgery",
          email: "d.garcia@example.com"
        },
        maxMarks: 100,
        passingMarks: 60,
        instructions: "Bring lab coat and sterile gloves. Report to lab 15 minutes prior to start time.",
        proctors: ["Dr. Lisa Patel", "Dr. James Wilson"],
        attachments: ["https://example.com/exams/surgical_techniques_guide.pdf"],
        createdAt: new Date("2025-04-15"),
        updatedAt: new Date("2025-05-02")
      },
      {
        id: 4,
        title: "Public Health Internal Assessment",
        courseCode: "PH303",
        type: "internal",
        status: "scheduled",
        startTime: new Date("2025-05-10T11:00:00"),
        endTime: new Date("2025-05-10T12:30:00"),
        venue: "Room 303",
        semester: 5,
        facultyInCharge: {
          id: 3,
          name: "Dr. James Wilson",
          department: "Public Health",
          email: "j.wilson@example.com"
        },
        maxMarks: 50,
        passingMarks: 25,
        instructions: "Short answer questions based on lectures 1-8.",
        createdAt: new Date("2025-04-20"),
        updatedAt: new Date("2025-04-20")
      },
      {
        id: 5,
        title: "Psychiatric Assessment Viva",
        courseCode: "PSY401",
        type: "viva",
        status: "postponed",
        startTime: new Date("2025-05-05T13:00:00"),
        endTime: new Date("2025-05-05T17:00:00"),
        venue: "Faculty Building, Room 405",
        semester: 7,
        facultyInCharge: {
          id: 5,
          name: "Dr. Lisa Patel",
          department: "Psychiatry",
          email: "l.patel@example.com"
        },
        maxMarks: 100,
        passingMarks: 50,
        instructions: "Prepare case studies from the semester. Individual time slots will be emailed.",
        remarks: "Postponed due to faculty conference. New date to be announced.",
        createdAt: new Date("2025-04-10"),
        updatedAt: new Date("2025-05-01")
      }
    ];
  }
}

export const examService = new ExamService();