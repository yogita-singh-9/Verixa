# Navitra: Intelligent End-to-End Travel Planning & Hospitality Management Platform

Navitra is a comprehensive ecosystem designed for modern travel management, catering to Travelers, Tour Guides, and Hotel Managers. Built with Next.js and Supabase, it provides a seamless and responsive platform for planning, booking, and managing every aspect of the travel experience.

## ✨ Features

### For Travelers
*   **Intuitive Search & Booking:** Easily search for flights, hotels, and tours.
*   **Trip Management:** Interactive dashboard to manage upcoming and past trips.
*   **Interactive Maps:** Visual exploration of destinations and itineraries using Leaflet.

### For Hotel Managers
*   **Property Dashboard:** Comprehensive view of hotel occupancy, bookings, and revenue metrics.
*   **Analytics:** Detailed operational analytics including REVPAR, ADR, and Competitor Pricing.
*   **Room Management:** Tools to manage inventory and pricing dynamically.

### For Tour Guides
*   **Tour Dashboard:** Specialized view for managing tour schedules and participant lists.
*   **Itinerary Building:** Create and refine complex multi-day tours.

## 🛠️ Tech Stack

*   **Frontend:** [Next.js 15+](https://nextjs.org/) (React 19), [Tailwind CSS v4](https://tailwindcss.com/), [Lucide React](https://lucide.dev/) for elegant icons.
*   **Backend / Database / Auth:** [Supabase](https://supabase.com/).
*   **Maps:** [Leaflet](https://leafletjs.com/) with React-Leaflet.
*   **Language:** TypeScript.
*   **Package Manager:** npm.

## 🚀 Getting Started

Follow these steps to set up the project locally.

### Prerequisites
*   Node.js (v20+)
*   npm
*   A Supabase project (for Authentication & Database)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yogita-singh-9/Navitra.git
    cd Navitra/intelligent-travel-platform
    ```

2.  **Install dependencies:**
    This project uses a workspace setup. The main web application is located in `apps/web`.
    ```bash
    npm install
    # or install specifically on the web app:
    # cd apps/web && npm install
    ```

3.  **Environment Variables:**
    Create a `.env` file in the root of the project (or inside `apps/web`) based on `.env.example`.
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    # This will start the Next.js app on http://localhost:3000
    ```

## 📁 Project Structure

The project follows a monorepo-style setup:

*   `apps/web/`: The main Next.js application containing all user interfaces.
    *   `src/app/`: The Next.js App Router, with grouped routes for `(auth)`, `(traveler)`, `(tour-guide)`, and `(hotel-manager)`.
    *   `src/components/`: Reusable React components.
    *   `src/lib/`: Utility functions, including Supabase client configurations.
