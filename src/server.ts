import { config } from 'dotenv';
import app from './app';

// Load environment variables
config();

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('UNCAUGHT EXCEPTION! Shutting down...');
    console.error(error);
    process.exit(1);
});

// Handle unhandled rejections
process.on('unhandledRejection', (error) => {
    console.error('UNHANDLED REJECTION! Shutting down...');
    console.error(error);
    process.exit(1);
});