# MEXO Forms — Create. Collect. Understand.

![MEXO Forms](https://raw.githubusercontent.com/cmmanikandan/mexo-forms/main/public/logo.png)

**MEXO Forms** is a production-quality form builder, survey tool, quiz generator, and response management web application designed for the **MEXO Ecosystem**. It seamlessly integrates with **MEXO Mail**, using a shared Supabase database schema and unified authentication profiles.

---

## ✨ Features

- 🎨 **MEXO Ecosystem Aesthetic**: Clean white canvas, soft purple/blue gradients, navy typography, Lucide icons, and responsive cards.
- ⚡ **13 Smart Question Types**: Short Text, Long Text, Email, Phone, Number, Multiple Choice, Checkbox, Dropdown, Yes/No, Rating, Linear Scale, Date, and Time.
- 🔄 **800ms Debounced Autosave**: Real-time background autosave to Supabase with visual status indicators.
- 📊 **Automated Response Analytics**: Recharts trend graphs, device breakdown pie charts (Desktop, Mobile, Tablet), average completion duration metrics, individual respondent viewer, spreadsheet table, and CSV export.
- 🌐 **Public Form Sharing**: Distraction-free public respondent route (`/f/:slug`), SVG QR Code generator, iframe embed code, and direct MEXO Mail invite launcher.
- 📱 **PWA Support**: Progressive Web App ready with offline app shell caching and install prompts.
- 🔒 **Unified MEXO Identity**: Shared Supabase authentication (`public.profiles` table) connecting MEXO Mail and MEXO Forms.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite, React Router v6 (v7 flags enabled)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Charts**: Recharts
- **Backend & Auth**: Supabase (PostgreSQL, Row Level Security)
- **File Storage**: Cloudinary

---

## 🚀 Getting Started

```bash
# Clone the repository
git clone https://github.com/cmmanikandan/mexo-forms.git

# Navigate to project directory
cd mexo-forms

# Install dependencies
npm install

# Start development server
npm run dev
```

---

## 📁 Environment Variables (`.env`)

```env
VITE_SUPABASE_URL=https://vnbixduiwsvepvtybygy.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
VITE_MEXO_MAIL_URL=https://mexo-mail.vercel.app
```

---

## 📄 License

Part of the **MEXO Ecosystem**. All rights reserved.
