import { AppDataSource } from './data-source';

async function setupTestDatabase() {
  try {
    // Initialize the data source
    await AppDataSource.initialize();
    
    // Drop all tables and recreate them
    await AppDataSource.synchronize(true);
    
    console.log('Test database setup complete');
    process.exit(0);
  } catch (error) {
    console.error('Error setting up test database:', error);
    process.exit(1);
  }
}

setupTestDatabase();