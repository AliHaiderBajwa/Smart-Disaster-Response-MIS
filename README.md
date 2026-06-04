# Smart Disaster Response Management Information System (MIS)
**Live Demo:** [https://disaster-mis.vercel.app](https://disaster-mis.vercel.app)

![Project Status](https://img.shields.io/badge/Status-Complete-success.svg)
![React](https://img.shields.io/badge/Frontend-React.js-blue.svg)
![Node.js](https://img.shields.io/badge/Backend-Node.js_&_Express-green.svg)
![Azure SQL](https://img.shields.io/badge/Database-Azure_SQL_Server-blue.svg?logo=microsoftazure)

## Overview
The **Smart Disaster Response MIS** is a comprehensive full-stack web application designed to manage, coordinate, and respond to disaster events efficiently. The system facilitates real-time data tracking, resource management, and communication between administrators and responders to ensure a swift and coordinated disaster response.

## Key Features
- **Real-time Analytics**: Built-in dashboard with interactive charts and metrics (powered by Recharts).
- **User Authentication**: Secure login and registration using JWT and Bcrypt.
- **Resource Management**: Track and allocate relief resources effectively.
- **Incident Reporting**: Formulate and submit detailed incident reports.
- **RESTful API**: Robust Express backend serving a seamlessly integrated React front end.

## Tech Stack
### Frontend
- **React.js** (via Vite for lightning-fast HMR)
- **Recharts** (Data visualization)

### Backend
- **Node.js & Express.js**
- **JSON Web Tokens (JWT)** for Authentication
- **Bcrypt.js** for password hashing

### Database
- **Microsoft SQL Server (MSSQL)** hosted on **Microsoft Azure**


## Project Structure
```text
├── api/                  # Backend API controllers
├── config/               # Configuration files
├── middleware/           # Express middlewares (e.g., Auth)
├── routes/               # Express route definitions
├── utils/                # Utility and helper functions
├── server.js             # Entry point for the backend server
├── react ui/             # React Frontend codebase
│   └── smart-disaster-mis/
├── Final_DB_Updated.sql  # SQL Script for setting up the database
└── Database Project-1.pdf# Project documentation
```

## Getting Started

### Prerequisites
- Node.js (v16+)
- Microsoft SQL Server
- Git

### Database Setup
1. Open Microsoft SQL Server Management Studio (SSMS).
2. Execute the `Final_DB_Updated.sql` script to create the database schema and populate initial data.
3. Update the `.env` file in the root directory with your SQL Server credentials.

### Installation & Running Locally

1. **Clone the repository** (if not already local):
   ```bash
   git clone https://github.com/your-username/smart-disaster-response-mis.git
   cd smart-disaster-response-mis
   ```

2. **Install Backend Dependencies**:
   ```bash
   npm install
   ```

3. **Install Frontend Dependencies**:
   ```bash
   cd "react ui/smart-disaster-mis"
   npm install
   cd ../..
   ```

4. **Run the Application (Development Mode)**:
   - **Start the Backend**:
     ```bash
     npm run dev
     ```
   - **Start the Frontend**:
     Open a new terminal, navigate to the frontend directory, and run:
     ```bash
     cd "react ui/smart-disaster-mis"
     npm start
     ```
   The backend will run on port `5000` (or as defined in `.env`), and the frontend will be available at `http://localhost:3000`.

## License
This project is licensed under the ISC License.
