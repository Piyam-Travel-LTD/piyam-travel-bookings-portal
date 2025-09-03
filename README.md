Piyam Travel PortalA secure, web-based portal for Piyam Travel agents to manage customer travel packages and for customers to securely access their documents.This project consists of two main parts: a secure Agent Dashboard for managing client data and a simple Client Portal for viewing and downloading documents.FeaturesAgent DashboardCreate unique, reference-numbered folders for each customer.Search and filter customer folders by name or reference number.Upload and manage documents (.pdf, .jpg) across multiple categories (Flights, Hotels, Visa, etc.).Delete documents from a customer's folder.Generate a shareable Access Voucher with a QR code for easy client access.Client PortalSecure login using a unique Reference Number and the customer's Last Name.A clean, read-only dashboard displaying all relevant travel documents.Categories are dynamically hidden if they contain no documents."Download" button for each file.An automated 10-month access expiry notification for security.Technology StackThis project is built with a modern, serverless architecture to keep costs at a minimum while ensuring high performance and security.Frontend: React, Vite, Tailwind CSSDatabase: Google FirestoreFile Storage: Cloudflare R2 (10GB Free Tier)Hosting & Backend Functions: VercelAuthentication: Google Firebase AuthenticationSetup and InstallationFollow these steps to get the project running on your local machine for development and testing.PrerequisitesNode.js (version 18.x or higher)GitA code editor like Visual Studio Code1. Clone the RepositoryFirst, clone the code from your GitHub repository to your local machine.git clone [https://github.com/YOUR_USERNAME/piyam-travel-portal.git](https://github.com/YOUR_USERNAME/piyam-travel-portal.git)
cd piyam-travel-portal
2. Install DependenciesInstall all the necessary project libraries using npm.npm install
3. Set Up Environment VariablesFor the application to connect to your backend services, you need to provide your secret keys in a local environment file.In the root of your piyam-travel-portal folder, create a new file named .env.Copy the content below into the .env file and replace the placeholder values with your actual credentials..env file contents:# Firebase Configuration
VITE_FIREBASE_API_KEY="AIzaSyA..._w"
VITE_FIREBASE_AUTH_DOMAIN="piyam-travel-portal.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="piyam-travel-portal"
VITE_FIREBASE_STORAGE_BUCKET="piyam-travel-portal.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="123456789012"
VITE_FIREBASE_APP_ID="1:123456789012:web:abcdef1234567890"

# Cloudflare R2 Configuration (These are used by your Vercel functions)
CLOUDFLARE_ACCOUNT_ID="YOUR_CLOUDFLARE_ACCOUNT_ID"
R2_ACCESS_KEY_ID="YOUR_R2_ACCESS_KEY_ID"
R2_SECRET_ACCESS_KEY="YOUR_R2_SECRET_ACCESS_KEY"
R2_BUCKET_NAME="piyam-travel-documents"
R2_PUBLIC_URL="YOUR_R2_PUBLIC_URL"
Note: The VITE_ prefix is important. It tells Vite to make these variables securely available to your front-end code.Running the ApplicationOnce the setup is complete, you can start the local development server.npm run dev
This will launch the application, and you can view it in your web browser at http://localhost:5173 (or a similar address).DeploymentThis project is configured for easy deployment on Vercel.Push your code to your GitHub repository.Follow the steps we previously discussed to import and configure the project in your Vercel dashboard.Ensure you have added the same Environment Variables from your .env file into your Vercel project settings.Vercel will automatically build and deploy your application every time you push a new change to your GitHub repository.
