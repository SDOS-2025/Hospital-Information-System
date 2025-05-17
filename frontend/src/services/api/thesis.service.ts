import { Thesis } from '../../types/api.types';

// Enhanced thesis interface for our UI needs
export type ThesisStatus = 
  | 'draft' 
  | 'submitted' 
  | 'under_review' 
  | 'revision_needed' 
  | 'approved' 
  | 'rejected' 
  | 'published';

export interface ThesisDetails extends Omit<Thesis, 'status' | 'document'> {
  status: ThesisStatus;
  documentUrl?: string;
  abstract?: string;
  keywords?: string[];
  reviewFeedback?: string;
  comments?: string;
}

export interface ThesisFilterOptions {
  status?: ThesisStatus;
  studentId?: number;
  supervisorId?: number;
  keyword?: string;
}

export interface ThesisCreateDto {
  title: string;
  abstract?: string;
  studentId: number;
  supervisorId: number;
  keywords?: string[];
}

export interface ThesisUpdateDto {
  title?: string;
  abstract?: string;
  keywords?: string[];
  supervisorId?: number;
}

class ThesisService {
  private apiUrl = '/api/theses';

  // Get all theses with optional filters
  async getAllTheses(filters?: ThesisFilterOptions): Promise<ThesisDetails[]> {
    // This would be a real API call in a production app
    // For now we'll use mock data
    return this.getMockTheses().filter(thesis => {
      if (!filters) return true;
      
      if (filters.status && thesis.status !== filters.status) return false;
      if (filters.studentId && thesis.student.id !== filters.studentId) return false;
      if (filters.supervisorId && thesis.supervisor.id !== filters.supervisorId) return false;
      if (filters.keyword && 
          thesis.keywords && 
          !thesis.keywords.some(k => k.toLowerCase().includes(filters.keyword!.toLowerCase()))) {
        return false;
      }
      
      return true;
    });
  }

  // Get thesis by ID
  async getThesisById(id: number): Promise<ThesisDetails> {
    const thesis = this.getMockTheses().find(t => t.id === id);
    
    if (!thesis) {
      throw new Error('Thesis not found');
    }
    
    return thesis;
  }

  // Create a new thesis
  async createThesis(thesisData: ThesisCreateDto): Promise<ThesisDetails> {
    // In a real app, this would submit to your API
    console.log('Creating thesis:', thesisData);
    
    const mockThesis: ThesisDetails = {
      id: Math.floor(Math.random() * 1000) + 10, // Random ID
      title: thesisData.title,
      abstract: thesisData.abstract,
      status: 'draft',
      student: { id: thesisData.studentId } as any,
      supervisor: { id: thesisData.supervisorId } as any,
      keywords: thesisData.keywords || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    return mockThesis;
  }

  // Update thesis details
  async updateThesis(id: number, updateData: ThesisUpdateDto): Promise<ThesisDetails> {
    // In a real app, this would submit to your API
    console.log('Updating thesis:', id, updateData);
    
    const thesis = await this.getThesisById(id);
    
    // In a real app, this would be handled by the backend
    const updatedThesis: ThesisDetails = {
      ...thesis,
      ...updateData,
      updatedAt: new Date()
    };
    
    return updatedThesis;
  }

  // Upload thesis document
  async uploadDocument(id: number, file: File): Promise<ThesisDetails> {
    // In a real app, this would upload the file to your API
    console.log('Uploading document for thesis:', id, file.name);
    
    const thesis = await this.getThesisById(id);
    
    if (thesis.status === 'draft') {
      thesis.status = 'submitted';
      thesis.submissionDate = new Date();
    }
    
    thesis.documentUrl = URL.createObjectURL(file); // Mock URL
    
    return thesis;
  }

  // Update thesis status
  async updateStatus(id: number, status: ThesisStatus, comments?: string): Promise<ThesisDetails> {
    // In a real app, this would submit to your API
    console.log('Updating thesis status:', id, status, comments);
    
    const thesis = await this.getThesisById(id);
    
    thesis.status = status;
    
    if (comments) {
      thesis.reviewFeedback = comments;
    }
    
    if (status === 'approved') {
      thesis.approvalDate = new Date();
    }
    
    return thesis;
  }

  // Delete a thesis
  async deleteThesis(id: number): Promise<void> {
    // In a real app, this would submit to your API
    console.log('Deleting thesis:', id);
    
    const thesis = await this.getThesisById(id);
    
    if (thesis.status !== 'draft') {
      throw new Error('Only draft theses can be deleted');
    }
    
    // Would delete the thesis in a real API
  }

  // Helper method to generate mock data
  private getMockTheses(): ThesisDetails[] {
    return [
      {
        id: 1,
        title: "Novel Approach to Treating Cardiovascular Diseases",
        abstract: "This thesis explores innovative treatments for cardiovascular diseases using a combination of traditional medicine and modern technology.",
        status: "approved",
        submissionDate: new Date("2025-01-15"),
        approvalDate: new Date("2025-03-10"),
        student: {
          id: 1,
          name: "John Smith",
          email: "john.smith@example.com",
          enrollmentNumber: "EN2022001",
          department: "Cardiology",
          semester: 6,
          program: "MD"
        } as any,
        supervisor: {
          id: 1,
          name: "Dr. Robert Chen",
          email: "r.chen@example.com",
          employeeId: "FAC2019001",
          department: "Cardiology",
          designation: "Professor",
          specialization: "Interventional Cardiology"
        } as any,
        documentUrl: "https://example.com/thesis/1.pdf",
        keywords: ["Cardiovascular", "Treatment", "Innovation"],
        reviewFeedback: "Excellent research with significant clinical implications.",
        createdAt: new Date("2024-10-05"),
        updatedAt: new Date("2025-03-10")
      },
      {
        id: 2,
        title: "Genetic Factors in Autoimmune Disorders",
        abstract: "A comprehensive study on the genetic markers associated with various autoimmune disorders.",
        status: "submitted",
        submissionDate: new Date("2025-04-20"),
        student: {
          id: 2,
          name: "Emily Johnson",
          email: "emily.johnson@example.com",
          enrollmentNumber: "EN2022002",
          department: "Immunology",
          semester: 5,
          program: "MD"
        } as any,
        supervisor: {
          id: 2,
          name: "Dr. Sarah Lee",
          email: "s.lee@example.com",
          employeeId: "FAC2018005",
          department: "Immunology",
          designation: "Associate Professor",
          specialization: "Autoimmune Diseases"
        } as any,
        documentUrl: "https://example.com/thesis/2.pdf",
        keywords: ["Genetics", "Autoimmune", "Immunology"],
        createdAt: new Date("2024-11-30"),
        updatedAt: new Date("2025-04-20")
      },
      {
        id: 3,
        title: "Impact of Telemedicine on Rural Healthcare Access",
        abstract: "This study assesses how telemedicine implementation has affected healthcare accessibility in rural communities.",
        status: "revision_needed",
        submissionDate: new Date("2025-03-05"),
        student: {
          id: 3,
          name: "Michael Davis",
          email: "michael.davis@example.com",
          enrollmentNumber: "EN2022003",
          department: "Public Health",
          semester: 6,
          program: "MPH"
        } as any,
        supervisor: {
          id: 3,
          name: "Dr. James Wilson",
          email: "j.wilson@example.com",
          employeeId: "FAC2017003",
          department: "Public Health",
          designation: "Professor",
          specialization: "Healthcare Systems"
        } as any,
        documentUrl: "https://example.com/thesis/3.pdf",
        keywords: ["Telemedicine", "Rural Healthcare", "Access"],
        reviewFeedback: "Need more quantitative data and statistical analysis.",
        createdAt: new Date("2024-12-10"),
        updatedAt: new Date("2025-03-15")
      },
      {
        id: 4,
        title: "Surgical Techniques in Pediatric Orthopedics",
        abstract: "An analysis of modern surgical techniques used in pediatric orthopedic procedures.",
        status: "draft",
        student: {
          id: 4,
          name: "Jessica Brown",
          email: "jessica.brown@example.com",
          enrollmentNumber: "EN2022004",
          department: "Orthopedics",
          semester: 4,
          program: "MS"
        } as any,
        supervisor: {
          id: 4,
          name: "Dr. David Garcia",
          email: "d.garcia@example.com",
          employeeId: "FAC2020002",
          department: "Orthopedics",
          designation: "Assistant Professor",
          specialization: "Pediatric Orthopedics"
        } as any,
        keywords: ["Pediatrics", "Orthopedics", "Surgery"],
        createdAt: new Date("2025-01-15"),
        updatedAt: new Date("2025-01-15")
      },
      {
        id: 5,
        title: "Mental Health Implications of COVID-19 on Healthcare Workers",
        abstract: "This thesis investigates the psychological impact of the COVID-19 pandemic on frontline healthcare professionals.",
        status: "under_review",
        submissionDate: new Date("2025-04-02"),
        student: {
          id: 5,
          name: "Daniel Kim",
          email: "daniel.kim@example.com",
          enrollmentNumber: "EN2022005",
          department: "Psychiatry",
          semester: 6,
          program: "MD"
        } as any,
        supervisor: {
          id: 5,
          name: "Dr. Lisa Patel",
          email: "l.patel@example.com",
          employeeId: "FAC2016001",
          department: "Psychiatry",
          designation: "Professor",
          specialization: "Occupational Psychiatry"
        } as any,
        documentUrl: "https://example.com/thesis/5.pdf",
        keywords: ["Mental Health", "COVID-19", "Healthcare Workers"],
        createdAt: new Date("2024-11-20"),
        updatedAt: new Date("2025-04-02")
      }
    ];
  }
}

export const thesisService = new ThesisService();