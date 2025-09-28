# 🚀 Chabaqa Backend API

A comprehensive, production-ready backend API for the Chabaqa platform built with NestJS, MongoDB, and TypeScript.

## ✨ Features

### 🔐 Authentication & Authorization
- JWT-based authentication
- Role-based access control (User, Creator, Admin)
- Two-factor authentication (2FA)
- Password reset functionality
- Email verification
- Social login support (Google, Facebook)

### 🏘️ Community Management
- Create and manage communities
- Community categories and tags
- Member management
- Community analytics
- Search and discovery

### 📚 Course System
- Course creation and management
- Sequential progression system
- Section and chapter organization
- Video content support
- Progress tracking
- Enrollment management

### 🎯 Session Booking
- 1-on-1 session booking
- Available hours management
- Calendar integration
- Payment processing
- Session analytics

### 📅 Event Management
- Event creation and management
- Ticket sales and management
- Attendee tracking
- Event analytics
- Location and online support

### 🏆 Challenge System
- Challenge creation and management
- Submission tracking
- Scoring and leaderboards
- Community challenges

### 📝 Content Management
- Post creation and sharing
- Resource library
- File upload system
- Content categorization
- Search functionality

### 💰 Payment Integration
- Flouci payment gateway
- Subscription management
- Revenue tracking
- Payment analytics

### 📊 Analytics & Reporting
- User analytics
- Community insights
- Revenue reports
- Performance metrics
- Custom dashboards

## 🛠️ Tech Stack

- **Framework**: NestJS
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT
- **File Upload**: Multer
- **Email**: Nodemailer
- **Payment**: Flouci API
- **Documentation**: Swagger
- **Process Manager**: PM2
- **Reverse Proxy**: Nginx
- **Containerization**: Docker

## 🚀 Quick Start

### Prerequisites

- Node.js 18.x or higher
- MongoDB 6.0 or higher
- npm or yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Louay0007/chabaqa-backend.git
   cd chabaqa-backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment setup:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the application:**
   ```bash
   # Development
   npm run start:dev
   
   # Production
   npm run build
   npm run start:prod
   ```

## 📋 API Documentation

Once the server is running, visit:
- **Swagger UI**: `http://localhost:3000/api`
- **Health Check**: `http://localhost:3000/health`

## 🔧 Environment Variables

```env
# Server Configuration
NODE_ENV=development
PORT=3000
HOST=0.0.0.0

# Database
MONGO_URI=mongodb://localhost:27017/chabaqa

# JWT Configuration
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Payment Gateway
FLOUCI_PUBLIC_KEY=your-flouci-public-key
FLOUCI_SECRET_KEY=your-flouci-secret-key

# File Upload
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760

# CORS
CORS_ORIGIN=http://localhost:3000
```

## 🏗️ Project Structure

```
backend/
├── src/
│   ├── auth/                 # Authentication module
│   ├── community/            # Community management
│   ├── cours/               # Course system
│   ├── session/             # Session booking
│   ├── event/               # Event management
│   ├── challenge/           # Challenge system
│   ├── post/                # Post management
│   ├── resource/            # Resource management
│   ├── product/             # Product management
│   ├── analytics/           # Analytics & reporting
│   ├── upload/              # File upload
│   ├── schema/              # Database schemas
│   ├── common/              # Shared utilities
│   └── main.ts              # Application entry point
├── deploy/                  # Deployment scripts
├── uploads/                 # File uploads directory
└── package.json
```

## 🧪 Testing

The project includes a comprehensive test suite:

```bash
# Run all tests
npm run test

# Run tests with coverage
npm run test:cov

# Run e2e tests
npm run test:e2e
```

## 🚀 Deployment

### VPS Deployment

1. **Setup VPS environment:**
   ```bash
   ./deploy/setup-vps.sh
   ```

2. **Deploy application:**
   ```bash
   ./deploy/deploy-app.sh
   ```

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d
```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - User logout
- `POST /api/auth/forgot-password` - Password reset

### Communities
- `GET /api/communities` - Get all communities
- `POST /api/communities` - Create community
- `GET /api/communities/:id` - Get community details
- `PUT /api/communities/:id` - Update community
- `DELETE /api/communities/:id` - Delete community

### Courses
- `GET /api/cours` - Get all courses
- `POST /api/cours` - Create course
- `GET /api/cours/:id` - Get course details
- `POST /api/cours/:id/enroll` - Enroll in course

### Sessions
- `GET /api/sessions` - Get all sessions
- `POST /api/sessions` - Create session
- `POST /api/sessions/:id/book` - Book session
- `GET /api/sessions/available-hours` - Get available hours

### Events
- `GET /api/events` - Get all events
- `POST /api/events` - Create event
- `POST /api/events/:id/register` - Register for event

### And many more...

## 🔒 Security Features

- JWT authentication
- Role-based access control
- Rate limiting
- CORS protection
- Input validation
- SQL injection prevention
- XSS protection
- CSRF protection
- Secure headers

## 📈 Performance

- Database indexing
- Query optimization
- Caching strategies
- Compression
- Connection pooling
- Load balancing ready

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**Louay Rjili**
- GitHub: [@Louay0007](https://github.com/Louay0007)
- LinkedIn: [Louay Rjili](https://linkedin.com/in/louay-rjili)
- Email: louay.rjili@example.com

## 🙏 Acknowledgments

- NestJS team for the amazing framework
- MongoDB team for the database
- All contributors and testers

---

**🚀 Ready for Production!**

This backend is 100% production-ready with comprehensive testing, security hardening, and deployment scripts.