import { ExamService } from '../services/exam.service';
import { AppDataSource } from '../db/data-source';
import { Exam, ExamType, ExamStatus } from '../models/Exam';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('File Upload Tests', () => {
  let examService: ExamService;
  let testExamId: string;
  
  beforeAll(async () => {
    await AppDataSource.initialize();
    examService = new ExamService();
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  beforeEach(async () => {
    // Create a test exam
    const exam = await examService.createExam({
      title: 'Test Exam',
      courseCode: 'TEST101',
      type: ExamType.MIDTERM,
      startTime: new Date('2025-04-01T10:00:00Z'),
      endTime: new Date('2025-04-01T12:00:00Z'),
      venue: 'Test Hall',
      maxMarks: 100,
      facultyInChargeId: 'test-faculty-id',
      semester: 1,
      instructions: 'Test instructions'
    });
    testExamId = exam.id;
  });

  afterEach(async () => {
    // Clean up test exam
    const examRepo = AppDataSource.getRepository(Exam);
    await examRepo.delete({ id: testExamId });
  });

  it('should upload exam materials', async () => {
    // Create a test file buffer
    const testBuffer = Buffer.from('Test file content');
    
    const result = await examService.uploadMaterials(
      testExamId,
      [{
        buffer: testBuffer,
        originalname: 'test.pdf'
      }]
    );

    expect(result).toBeDefined();
    expect(result.attachments).toBeDefined();
    expect(result.attachments.length).toBe(1);
    expect(result.attachments[0]).toMatch(/test\.pdf$/);
  });

  it('should handle multiple file uploads', async () => {
    const files = [
      { buffer: Buffer.from('Test file 1'), originalname: 'test1.pdf' },
      { buffer: Buffer.from('Test file 2'), originalname: 'test2.pdf' }
    ];
    
    const result = await examService.uploadMaterials(testExamId, files);

    expect(result.attachments.length).toBe(2);
    expect(result.attachments[0]).toMatch(/test1\.pdf$/);
    expect(result.attachments[1]).toMatch(/test2\.pdf$/);
  });

  it('should fail with invalid exam id', async () => {
    const testBuffer = Buffer.from('Test file content');
    
    await expect(
      examService.uploadMaterials(
        'invalid-id',
        [{
          buffer: testBuffer,
          originalname: 'test.pdf'
        }]
      )
    ).rejects.toThrow('Exam not found');
  });
});