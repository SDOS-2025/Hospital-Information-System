# Hospital Information System

A comprehensive backend system for managing hospital/educational institution operations including admissions, examinations, faculty management, fee processing, grievance handling, leave management, student records, and thesis tracking.

## Tech Stack

- Node.js/TypeScript
- PostgreSQL (Database)
- Redis (Caching)
- AWS S3 (File Storage)
- SendGrid (Email Service)
- Express.js (Web Framework)
- TypeORM (ORM)
- Handlebars (Email Templates)

## Prerequisites

Before setting up the project, ensure you have the following installed:

### Windows
1. **Node.js**
   - Download Node.js LTS from [nodejs.org](https://nodejs.org)
   - Install and verify with:
     ```
     node --version
     npm --version
     ```

2. **PostgreSQL**
   - Download from [postgresql.org](https://www.postgresql.org/download/windows/)
   - Run installer (remember your password)
   - Add PostgreSQL bin to PATH if not done automatically

3. **Redis**
   - Install Windows Subsystem for Linux (WSL2)
   - Open WSL terminal and run:
     ```
     sudo apt-get update
     sudo apt-get install redis-server
     sudo service redis-server start
     ```

4. **Git**
   - Download from [git-scm.com](https://git-scm.com/download/windows)
   - Run installer with default options

### Linux
1. **Node.js**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

2. **PostgreSQL**
   ```bash
   sudo apt-get install postgresql postgresql-contrib
   ```

3. **Redis**
   ```bash
   sudo apt-get install redis-server
   sudo systemctl enable redis-server.service
   ```

## Project Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Hospital-Information-System
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```
   PORT=3000
   NODE_ENV=development
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=your_username
   DB_PASSWORD=your_password
   DB_NAME=hospital_system
   REDIS_URL=redis://localhost:6379
   AWS_ACCESS_KEY_ID=your_aws_key
   AWS_SECRET_ACCESS_KEY=your_aws_secret
   AWS_REGION=your_region
   AWS_S3_BUCKET=your_bucket
   SENDGRID_API_KEY=your_sendgrid_key
   JWT_SECRET=your_jwt_secret
   ```

4. **Database Setup**
   ```sql
   CREATE DATABASE hospital_system;
   CREATE DATABASE hospital_system_test;
   ```

5. **Run Migrations**
   ```bash
   npm run migrate
   ```

## Testing

1. **Setup Test Environment**
   Create a `.env.test` file:
   ```
   PORT=3001
   NODE_ENV=test
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=your_username
   DB_PASSWORD=your_password
   DB_NAME=hospital_system_test
   REDIS_URL=redis://localhost:6379
   AWS_ACCESS_KEY_ID=your_aws_key
   AWS_SECRET_ACCESS_KEY=your_aws_secret
   AWS_REGION=your_region
   AWS_S3_BUCKET=your_test_bucket
   SENDGRID_API_KEY=your_sendgrid_key
   JWT_SECRET=test_secret
   ```

2. **Run Test Migrations**
   ```bash
   npm run migrate:test
   ```

3. **Execute Tests**
   ```bash
   npm test            # Run all tests
   npm run test:watch  # Run tests in watch mode
   ```

## Project Structure

```
src/
├── app.ts                 # Express app setup
├── server.ts             # Server entry point
├── config/              # Configuration files
├── controllers/         # Route controllers
├── db/                 # Database configuration
├── middlewares/        # Express middlewares
├── models/             # TypeORM entities
├── routes/             # API routes
├── services/           # Business logic
├── templates/          # Email templates
├── tests/              # Test files
├── types/              # TypeScript types
└── utils/              # Utility functions
```

## API Features

1. **Authentication**
   - User registration
   - Login
   - Password reset

2. **Student Management**
   - Student profiles
   - Academic records
   - Course enrollment

3. **Faculty Management**
   - Faculty profiles
   - Course assignments
   - Schedule management

4. **Examination System**
   - Exam scheduling
   - Result management
   - Grade processing

5. **Fee Management**
   - Fee structure
   - Payment processing
   - Payment history

6. **Grievance System**
   - Submit grievances
   - Track status
   - Resolution management

7. **Leave Management**
   - Apply for leave
   - Approval workflow
   - Leave balance tracking

8. **Thesis Management**
   - Thesis submission
   - Review process
   - Status tracking

9. **Admission Management**
   - Application processing
   - Document verification
   - Admission status

10. **Audit System**
    - Activity logging
    - User tracking
    - System monitoring

## Running the Application

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm run build
npm start
```

## Health Check

Verify system health:
```bash
curl http://localhost:3000/api/health
```

## Troubleshooting

1. **Database Connection Issues**
   - Verify PostgreSQL is running
   - Check database credentials
   - Ensure database exists

2. **Redis Connection Issues**
   - Verify Redis server is running
   - Check Redis connection URL
   - For Windows: Ensure WSL is running

3. **Email Service Issues**
   - Validate SendGrid API key
   - Check email templates
   - Verify sender email configuration

4. **File Upload Issues**
   - Check AWS credentials
   - Verify S3 bucket permissions
   - Ensure proper file size limits

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
