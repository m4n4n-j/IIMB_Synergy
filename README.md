# IIMB Synergy

A Progressive Web App for IIM Bangalore students to automate networking through algorithmic matching.

## 🚀 Quick Start

### Prerequisites
- Node.js & npm

**Windows PowerShell Note:** To run npm scripts on Windows, you may need to set the execution policy. Open PowerShell as Administrator and run:

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

After this, you can run `npm run dev` normally.
- Python 3.8+
- Supabase Account

### Local Development

1. **Backend Setup**
   ```bash
   cd backend
   pip install -r requirements.txt
   # Create .env with your Supabase credentials (see env.example)
   uvicorn main:app --reload
   ```

2. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   # Create .env.local with your Supabase credentials (see env.example)
   npm run dev
   ```

3. **Database Setup**
   - Go to your Supabase project
   - Run the SQL from `database/schema.sql` in the SQL Editor

### Deployment

See [deployment_guide.md](./.gemini/antigravity/brain/904831a3-ef76-4306-a062-47bd8089b78a/deployment_guide.md) for detailed instructions on deploying to Vercel (Frontend) and Railway (Backend).

### Environment Variables

**Backend (.env)**
```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
```

**Frontend (.env.local)**
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📚 Features

- Email Magic Link Authentication (@iimb.ac.in only)
- Profile Creation (Signal Profile)
- Weekly Availability Setting (Weekly Pulse)
- Algorithmic Matching based on Diversity, Interests, and History
- Match Reveal UI

## 🛠️ Tech Stack

- **Frontend**: Next.js, Tailwind CSS, Lucide React
- **Backend**: FastAPI, NetworkX
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth

## 📝 License

MIT
