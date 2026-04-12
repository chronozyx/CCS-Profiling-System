# CCS - Comprehensive Profiling System (Frontend)

Enhanced Academic & Resource Management System for the College of Computing Studies

## 📋 System Overview

A web-based comprehensive profiling system that centralizes student, faculty, scheduling, instructional, research, and event records with secure role-based access.

## 🎯 Features

### Core Modules

1. **Dashboard** - Main control center with analytics and quick access
2. **Student Profile Module** - Personal info, academic records, achievements
3. **Faculty Profile Module** - Professional info, teaching load, research
4. **Scheduling Module** - Class schedules with automatic credit unit computation
5. **Events Module** - Event creation and management
6. **Research Module** - Research repository with ranking system
7. **Instructional Management** - Syllabus, curriculum, course materials
8. **Room Management** - Room capacity tracking and utilization

## 📁 Project Structure

```
frontend/
├── src/
│   ├── modules/
│   │   ├── Dashboard/
│   │   │   ├── Dashboard.jsx
│   │   │   └── Dashboard.css
│   │   ├── StudentProfile/
│   │   │   ├── StudentProfile.jsx
│   │   │   └── StudentProfile.css
│   │   ├── FacultyProfile/
│   │   │   ├── FacultyProfile.jsx
│   │   │   └── FacultyProfile.css
│   │   ├── Scheduling/
│   │   │   ├── Scheduling.jsx
│   │   │   └── Scheduling.css
│   │   ├── Events/
│   │   │   ├── Events.jsx
│   │   │   └── Events.css
│   │   ├── Research/
│   │   │   ├── Research.jsx
│   │   │   └── Research.css
│   │   ├── Instructional/
│   │   │   ├── Instructional.jsx
│   │   │   └── Instructional.css
│   │   └── RoomManagement/
│   │       ├── RoomManagement.jsx
│   │       └── RoomManagement.css
│   ├── App.jsx
│   ├── App.css
│   ├── main.jsx
│   └── index.css
├── package.json
└── vite.config.js
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

```bash
cd frontend
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

## 📊 Module Features

### Credit Unit Computation Rules

- **Lecture**: 2 hours = 2 units
- **Laboratory**: 3 hours = 1 unit
- **Pure Lecture**: 3 hours = 3 units

### Faculty Load Management

- Automatic computation of teaching hours and units
- Overload/Underload detection
- Load distribution visualization

### Room Capacity Tracking

- Real-time capacity utilization
- Alerts for near-full or overcapacity rooms
- Prevents scheduling conflicts

## 🎨 Design Features

- Responsive UI design
- Modern gradient color schemes
- Interactive dashboards
- Real-time data visualization
- Intuitive navigation

## 🔐 Role-Based Access (To be implemented with backend)

- Admin
- Dean
- Chairperson
- Faculty
- Student

## 📝 Notes

This is the frontend implementation. Backend integration required for:
- Authentication
- Database operations
- File uploads
- Report generation
- Audit trails
