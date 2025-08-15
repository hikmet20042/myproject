import mongoose, { Schema, Document } from 'mongoose';

export interface INewsArticle extends Document {
  title: string;
  summary?: string;
  content: string;
  source: string; // apa.az, qafqazinfo.az, oxu.az
  sourceUrl: string;
  date: Date;
  scrapedAt: Date;
  contentLength: number;
  tags: string[];
  isPublished: boolean;
  category?: string[]; // Array of categories to support multiple classifications
}

const NewsArticleSchema: Schema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  summary: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  content: {
    type: String,
    required: true
  },
  source: {
    type: String,
    required: true,
    enum: ['apa.az', 'qafqazinfo.az', 'oxu.az']
  },
  sourceUrl: {
    type: String,
    required: true,
    unique: true // Prevent duplicate articles
  },
  date: {
    type: Date,
    required: true // Original publication date
  },
  scrapedAt: {
    type: Date,
    default: Date.now // When we scraped it
  },
  contentLength: {
    type: Number,
    required: true
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  isPublished: {
    type: Boolean,
    default: true
  },
  category: {
    type: [String], // Array to support multiple categories
    enum: [
      'femicide',               // killing of women because of their gender
      'domestic_violence',      // violence within the home/family
      'sexual_violence',        // sexual assault, rape, abuse
      'harassment',             // unwanted behavior, sexual or otherwise
      'intimate_partner_violence', // violence by a partner/spouse
      'psychological_violence', // emotional abuse, coercion, intimidation
      'economic_violence',      // financial control or abuse within relationships
      'stalking',               // unwanted following or surveillance
      'trafficking',            // human trafficking related to exploitation
      'child_abuse',            // violence against children in gender context
      'honor_killings',         // killings to defend 'family honor'
      'forced_marriage',        // marriage without consent, often gendered
      'female_genital_mutilation', // cultural violence against girls/women
      'sexual_exploitation',    // abuse for sexual gain
      'gender_based_hate_crime', // violence motivated by gender identity/orientation
      'bullying',               // includes gender-based bullying, especially in schools/workplaces
      'discrimination'          // systemic or individual bias based on gender
    ]
  }
}, {
  timestamps: true // Adds createdAt and updatedAt
});

// Indexes for better performance
NewsArticleSchema.index({ date: -1 });
NewsArticleSchema.index({ source: 1 });
NewsArticleSchema.index({ tags: 1 });
NewsArticleSchema.index({ isPublished: 1 });
NewsArticleSchema.index({ title: 'text', summary: 'text', content: 'text' });

export default mongoose.models.NewsArticle || mongoose.model<INewsArticle>('NewsArticle', NewsArticleSchema);
