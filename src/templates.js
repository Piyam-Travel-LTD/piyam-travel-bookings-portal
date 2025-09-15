// This file stores shared template documents for the "Quick Add" feature.

// IMPORTANT: Replace this with your actual R2 Public URL from your Vercel Environment Variables.
const R2_PUBLIC_URL = "https://pub-cf96e4b7c0424b8b9b1040a20acf06d3.r2.dev";

// --- CONFIGURE YOUR TEMPLATE DOCUMENTS HERE ---
// Edit this list to match the files you uploaded to your `_templates` folder in R2.
export const templateDocuments = [
    { 
      name: "Umrah Guide.pdf", // How the button and filename will appear
      fileKey: "_templates/umrah_guide.pdf", // The exact path in your R2 bucket
      category: "Others", // Which category it should be added to
      url: `${R2_PUBLIC_URL}/_templates/umrah_guide.pdf`
    },
    { 
      name: "Ziyarat Seminar Notes.pdf", 
      fileKey: "_templates/ziyarat_seminar_notes.pdf", 
      category: "Others",
      url: `${R2_PUBLIC_URL}/_templates/ziyarat_seminar_notes.pdf`
    },
    { 
      name: "Terms and Conditions.pdf", 
      fileKey: "_templates/terms_and_conditions.pdf", 
      category: "Others",
      url: `${R2_PUBLIC_URL}/_templates/terms_and_conditions.pdf`
    },
    // Add more of your template files here following the same format
];
