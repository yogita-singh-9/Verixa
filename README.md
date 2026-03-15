# VERIXA - Secure Attendance System

VERIXA is a comprehensive, role-based, secure attendance management system built with React Native (Expo) and Supabase. It offers a seamless experience for students, faculty, management, and controllers to manage and track attendance effectively using modern web and mobile capabilities.

## Features

- **Role-Based Access Control:** Dedicated dashboards for Students, Faculty, Management, and Controllers.
- **Secure Authentication:** Integrated with Supabase Auth for robust user management.
- **Location-Based Attendance:** Verifies student attendance using geolocation tracking (`expo-location`).
- **QR Code Integration:** Easily mark and verify attendance using QR codes (`react-native-qrcode-svg`).
- **Real-time Database:** Powered by Supabase PostgreSQL with Row Level Security (RLS) ensuring data privacy.
- **Cross-Platform:** Built with Expo, supporting both iOS and Android platforms seamlessly.

## Tech Stack

- **Frontend:** React Native, Expo, React Navigation, Expo Router
- **Backend & Database:** Supabase (PostgreSQL, Auth, RLS)
- **Styling:** Custom theming with React Native StyleSheet
- **Icons:** Expo Vector Icons

## Project Structure

- `app/`: Expo Router file-based routing containing screens like `login`, `signup`, and role dashboards inside `(tabs)`.
- `components/`: Reusable UI components including specific dashboards (`StudentDashboard`, `FacultyDashboard`, etc.), `Button`, `Input`, and more.
- `context/`: React Context providers (e.g., `AuthContext`).
- `database_setup.sql`: Complete PostgreSQL schema with RLS policies and triggers.

## Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn
- Expo CLI
- Supabase account (for backend setup)

## Getting Started

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yogita-singh-9/Verixa.git
   cd verixa
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Database Setup:**
   - Create a new project in Supabase.
   - Run the SQL script located in `database_setup.sql` in your Supabase SQL Editor to spin up all necessary tables, types, and RLS policies.
   - Configure your Supabase URL and Anon Key in your environment variables.

4. **Start the application:**
   ```bash
   npx expo start
   ```
    *   `src/lib/`: Utility functions, including Supabase client configurations.
