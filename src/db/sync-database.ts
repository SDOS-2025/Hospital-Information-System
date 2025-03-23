import { AppDataSource } from './data-source';

async function syncDatabase() {
    try {
        // Initialize the data source
        await AppDataSource.initialize();
        
        // Synchronize database schema
        await AppDataSource.synchronize();
        
        console.log('Database synchronization complete');
        process.exit(0);
    } catch (error) {
        console.error('Error synchronizing database:', error);
        process.exit(1);
    }
}

syncDatabase();