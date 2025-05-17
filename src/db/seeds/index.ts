import { AppDataSource } from '../data-source';
import { User } from '../../models/User';
import { UserRole } from '../../types/auth.types';
import bcrypt from 'bcrypt';

/**
 * Seed the database with initial data
 */
export const seedDatabase = async () => {
  try {
    // Initialize the database connection
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('Database connection initialized');
    }

    // Synchronize schema to create missing tables
    await AppDataSource.synchronize();
    console.log('Database schema synchronized');

    // Create repositories
    const userRepository = AppDataSource.getRepository(User);

    // Check if the student user already exists
    const existingStudent = await userRepository.findOne({
      where: { email: 'gsidhartha53@gmail.com' }
    });

    if (!existingStudent) {
      // Create a new student user
      const student = new User();
      student.firstName = 'Sarthak';
      student.lastName = 'Gupta';
      student.email = 'gsidhartha53@gmail.com';
      student.password = 'sid1234'; // Will be hashed by the @BeforeInsert hook
      student.role = UserRole.STUDENT;
      student.isActive = true;
      student.contactNumber = '9876543210';

      await userRepository.save(student);
      console.log('Student user created successfully');
    } else {
      console.log('Student user already exists');
    }

    // Add more seed data here if needed

    console.log('Database seeding completed successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
};

// Run the seed function if this file is executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}
