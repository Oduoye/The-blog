# Nonce Firewall Blogs

A modern, full-featured blogging platform built with React, TypeScript, and Supabase. This platform provides a comprehensive solution for tech-focused educational content with advanced features like analytics, promotional campaigns, and contact management.

## Features

### 🚀 Core Functionality
- **Modern Blog Platform**: Clean, responsive design with featured posts carousel
- **Admin Dashboard**: Complete content management system
- **Real-time Analytics**: Track post views, engagement, and user interactions
- **Promotional Campaigns**: Create and manage promotional popups with analytics
- **Contact Management**: Contact forms with submission tracking and management
- **Image Management**: Secure image uploads for blog posts and promotions

### 📊 Analytics & Tracking
- Post view tracking with unique visitor detection
- Engagement metrics (likes, shares, comments)
- Promotional campaign performance tracking
- Real-time analytics dashboard
- Visitor session management

### 🎨 Design & UX
- Responsive design optimized for all devices
- Modern UI with smooth animations and transitions
- Featured posts carousel with autoplay
- Interactive promotional popups
- Clean admin interface with tabbed navigation

### 🔐 Security & Authentication
- Supabase authentication with email/password
- Row Level Security (RLS) policies
- Admin role management
- Secure file uploads with type restrictions

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Components**: Radix UI, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Authentication, Storage)
- **State Management**: React Query (TanStack Query)
- **Routing**: React Router DOM
- **Forms**: React Hook Form with Zod validation
- **Analytics**: Custom analytics system with real-time tracking

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repository-url>
   cd nonce-firewall-blogs
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up Supabase**
   
   Run the database migrations:
   ```bash
   # If using Supabase CLI
   supabase db push
   
   # Or apply migrations manually through Supabase Dashboard
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:8080`

### Database Setup

The project includes comprehensive database migrations that set up:

- **User profiles** with admin role management
- **Blog posts** with categories, tags, and media support
- **Analytics tables** for tracking engagement
- **Promotional campaigns** with display rules
- **Contact management** system
- **Storage buckets** for images and media

### Admin Access

1. Create an account through database dashboard without sign up from the site.
2. Update the user's `is_admin` field to `true` in the Supabase dashboard
3. Access the admin panel at `/admin`

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── BlogHeader.tsx  # Navigation header
│   ├── BlogPostCard.tsx # Post preview cards
│   ├── ContactForm.tsx # Contact form component
│   └── ...
├── contexts/           # React contexts
│   └── AuthContext.tsx # Authentication context
├── hooks/              # Custom React hooks
│   ├── useBlogPosts.ts # Blog post management
│   ├── useAnalytics.ts # Analytics tracking
│   └── ...
├── lib/                # Utility libraries
│   ├── supabase.ts     # Supabase client
│   ├── imageUpload.ts  # Image upload utilities
│   └── ...
├── pages/              # Page components
│   ├── Index.tsx       # Homepage
│   ├── BlogPost.tsx    # Individual post view
│   ├── AdminDashboard.tsx # Admin panel
│   └── ...
└── integrations/       # External service integrations
    └── supabase/       # Supabase configuration
```

## Key Features Explained

### Analytics System
The platform includes a comprehensive analytics system that tracks:
- Page views and unique visitors
- User engagement (likes, shares, comments)
- Promotional campaign performance
- Real-time visitor sessions

### Promotional Campaigns
Create targeted promotional popups with:
- Custom display rules (pages, timing, frequency)
- A/B testing capabilities
- Performance analytics
- Image support

### Content Management
- Rich text editor with media support
- Image uploads with automatic optimization
- SEO-friendly URLs and meta tags
- Category and tag management
- Featured posts system

### Contact Management
- Public contact forms
- Admin dashboard for managing submissions
- Status tracking (unread, read, replied, archived)
- IP and user agent tracking for analytics

## Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Netlify

1. Connect your repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables in Netlify dashboard

### Deploy to Vercel

1. Connect your repository to Vercel
2. Set framework preset to "Vite"
3. Add environment variables in Vercel dashboard

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous key | Yes |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:
- Email: noncefirewall@gmail.com
- Website: https://noncefirewall.com

## Acknowledgments

- Built with [React](https://reactjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Backend powered by [Supabase](https://supabase.com/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)