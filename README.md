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
- **User Authentication**: Secure login using JWT and Bcrypt.
- **Role-Based Access Control (RBAC)**: Different dashboards and permissions per user role.
- **Resource Management**: Track and allocate relief resources effectively.
- **Incident Reporting**: Formulate and submit detailed incident reports.
- **RESTful API**: Robust Express backend serving a seamlessly integrated React frontend.

## Tech Stack

### Frontend
- **React.js** (built with Vite)
- **Recharts** for data visualization

### Backend
- **Node.js & Express.js**
- **JSON Web Tokens (JWT)** for authentication
- **Bcrypt.js** for password hashing

### Database
- **Microsoft SQL Server (MSSQL)** hosted on **Microsoft Azure**

## Project Structure

```text
├── api/                    # Vercel serverless entry point
├── config/                 # Database configuration
├── middleware/             # Auth & RBAC middleware
├── routes/                 # Express route definitions
├── utils/                  # Utility/helper functions
├── server.js               # Backend entry point
├── vercel.json             # Vercel deployment config
├── react ui/               # React frontend source code
│   └── smart-disaster-mis/
├── Final_DB_Updated.sql    # SQL script for database setup
└── Database Project-1.pdf  # Project documentation
```

## Getting Started

### Using the App

The frontend is deployed on Vercel — no setup needed. Just visit:

**[https://disaster-mis.vercel.app](https://disaster-mis.vercel.app)**

---

### Running the Backend Locally

To use the full application locally (with a working API), you only need to set up and run the backend.

#### Prerequisites
- Node.js (v16+)
- Microsoft SQL Server / SSMS
- Git

#### 1. Clone the Repository

```bash
git clone https://github.com/AliHaiderBajwa/Smart-Disaster-Response-MIS.git
cd Smart-Disaster-Response-MIS
```

#### 2. Set Up the Database

1. Open **SQL Server Management Studio (SSMS)**.
2. Execute `Final_DB_Updated.sql` to create the schema and seed initial data.

#### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
DB_SERVER=your_server_address
DB_PORT=1433
DB_NAME=DisasterMIS
DB_USER=your_db_user
DB_PASSWORD=your_db_password
JWT_SECRET=your_jwt_secret
PORT=5000
```

#### 4. Install & Run

```bash
npm install
npm run dev
```

The backend will be available at `http://localhost:5000`.

> The frontend at `disaster-mis.vercel.app` will automatically point to your local backend if you configure the API base URL in the frontend's environment settings.

---

### Running the Frontend Locally (Optional)

Only needed if you want to modify the frontend source code.

```bash
cd "react ui/smart-disaster-mis"
npm install
npm run dev
```

The frontend dev server will start at `http://localhost:3000`.

## License

This project is licensed under the ISC License.
