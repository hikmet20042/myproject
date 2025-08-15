/**
 * Central Gender Violence Category Management for Frontend
 * 
 * This file is auto-generated from the Python configuration.
 * Do not edit manually - update config/gender_violence_categories.py instead.
 */

export enum GenderViolenceCategory {
  FEMICIDE = "femicide",
  DOMESTIC_VIOLENCE = "domestic_violence",
  SEXUAL_VIOLENCE = "sexual_violence",
  HARASSMENT = "harassment",
  INTIMATE_PARTNER_VIOLENCE = "intimate_partner_violence",
  PSYCHOLOGICAL_VIOLENCE = "psychological_violence",
  ECONOMIC_VIOLENCE = "economic_violence",
  STALKING = "stalking",
  TRAFFICKING = "trafficking",
  CHILD_ABUSE = "child_abuse",
  HONOR_KILLINGS = "honor_killings",
  FORCED_MARRIAGE = "forced_marriage",
  FEMALE_GENITAL_MUTILATION = "female_genital_mutilation",
  SEXUAL_EXPLOITATION = "sexual_exploitation",
  GENDER_BASED_HATE_CRIME = "gender_based_hate_crime",
  BULLYING = "bullying",
  DISCRIMINATION = "discrimination",
  MISSING = "missing",
  PHYSICAL_VIOLENCE = "physical_violence",
  ONLINE_VIOLENCE = "online_violence",
  WORKPLACE_VIOLENCE = "workplace_violence",
  REPRODUCTIVE_VIOLENCE = "reproductive_violence",
  EDUCATIONAL_VIOLENCE = "educational_violence",
  INSTITUTIONAL_VIOLENCE = "institutional_violence",
  ELDER_ABUSE = "elder_abuse",
  CULTURAL_VIOLENCE = "cultural_violence",
  LEGAL_VIOLENCE = "legal_violence",
  MEDICAL_VIOLENCE = "medical_violence",
  POLITICAL_VIOLENCE = "political_violence",
  TECHNOLOGY_FACILITATED_VIOLENCE = "technology_facilitated_violence"
}

export interface GenderViolenceCategoryDetails {
  name: string;
  description: string;
  examples: string[];
  color: string;
}

export const GENDER_VIOLENCE_CATEGORIES: Record<GenderViolenceCategory, GenderViolenceCategoryDetails> = {
  [GenderViolenceCategory.FEMICIDE]: {
    name: "Femicide",
    description: "Murder of women and girls because of their gender",
    examples: ["honor killings targeting women", "intimate partner murder", "gender-motivated killing"],
    color: "#8b0000"
  },
  [GenderViolenceCategory.DOMESTIC_VIOLENCE]: {
    name: "Domestic Violence",
    description: "Violence between family members or intimate partners",
    examples: ["spousal abuse", "intimate partner violence", "family violence"],
    color: "#b22222"
  },
  [GenderViolenceCategory.SEXUAL_VIOLENCE]: {
    name: "Sexual Violence",
    description: "Sexual assault, rape, and sexual coercion",
    examples: ["rape", "sexual assault", "sexual coercion", "marital rape"],
    color: "#dc143c"
  },
  [GenderViolenceCategory.HARASSMENT]: {
    name: "Harassment",
    description: "Sexual harassment, stalking, and unwanted attention",
    examples: ["workplace sexual harassment", "street harassment", "online harassment"],
    color: "#cd5c5c"
  },
  [GenderViolenceCategory.INTIMATE_PARTNER_VIOLENCE]: {
    name: "Intimate Partner Violence",
    description: "Violence between current or former intimate partners",
    examples: ["dating violence", "ex-partner abuse", "relationship violence"],
    color: "#a0522d"
  },
  [GenderViolenceCategory.PSYCHOLOGICAL_VIOLENCE]: {
    name: "Psychological Violence",
    description: "Emotional abuse, threats, and psychological manipulation",
    examples: ["emotional abuse", "threats", "intimidation", "psychological control"],
    color: "#8b4513"
  },
  [GenderViolenceCategory.ECONOMIC_VIOLENCE]: {
    name: "Economic Violence",
    description: "Financial control and economic abuse",
    examples: ["financial control", "preventing work", "economic dependency abuse"],
    color: "#daa520"
  },
  [GenderViolenceCategory.STALKING]: {
    name: "Stalking",
    description: "Persistent following, monitoring, or harassment",
    examples: ["following", "surveillance", "unwanted contact", "cyberstalking"],
    color: "#b8860b"
  },
  [GenderViolenceCategory.TRAFFICKING]: {
    name: "Human Trafficking",
    description: "Sex trafficking and forced labor targeting women and girls",
    examples: ["sex trafficking", "forced prostitution", "labor trafficking"],
    color: "#800080"
  },
  [GenderViolenceCategory.CHILD_ABUSE]: {
    name: "Child Abuse",
    description: "Violence against children with gender-based elements",
    examples: ["child sexual abuse", "gender-based child violence", "abuse of girl children"],
    color: "#4b0082"
  },
  [GenderViolenceCategory.HONOR_KILLINGS]: {
    name: "Honor Killings",
    description: "Violence justified by perceived honor violations",
    examples: ["honor-based violence", "family honor killings", "cultural honor violence"],
    color: "#483d8b"
  },
  [GenderViolenceCategory.FORCED_MARRIAGE]: {
    name: "Forced Marriage",
    description: "Marriage without free consent, often involving minors",
    examples: ["child marriage", "arranged marriage abuse", "marriage coercion"],
    color: "#2f4f4f"
  },
  [GenderViolenceCategory.FEMALE_GENITAL_MUTILATION]: {
    name: "Female Genital Mutilation",
    description: "Harmful traditional practices targeting girls and women",
    examples: ["FGM", "circumcision of girls", "genital cutting"],
    color: "#696969"
  },
  [GenderViolenceCategory.SEXUAL_EXPLOITATION]: {
    name: "Sexual Exploitation",
    description: "Commercial sexual exploitation and abuse of power",
    examples: ["prostitution exploitation", "sexual abuse of power", "commercial sexual abuse"],
    color: "#708090"
  },
  [GenderViolenceCategory.GENDER_BASED_HATE_CRIME]: {
    name: "Gender-Based Hate Crime",
    description: "Crimes motivated by gender identity or sexual orientation",
    examples: ["anti-LGBTQ+ violence", "transgender violence", "gender identity hate crimes"],
    color: "#2e8b57"
  },
  [GenderViolenceCategory.BULLYING]: {
    name: "Gender-Based Bullying",
    description: "Bullying that targets gender identity or expression",
    examples: ["gender-based school bullying", "workplace gender bullying", "cyberbullying"],
    color: "#3cb371"
  },
  [GenderViolenceCategory.DISCRIMINATION]: {
    name: "Gender Discrimination",
    description: "Systematic discrimination based on gender",
    examples: ["workplace discrimination", "educational discrimination", "legal discrimination"],
    color: "#20b2aa"
  },
  [GenderViolenceCategory.MISSING]: {
    name: "Missing Persons",
    description: "Missing women and girls, often linked to trafficking or violence",
    examples: ["missing girls", "disappeared women", "abducted females", "runaway girls at risk"],
    color: "#ff6347"
  },
  [GenderViolenceCategory.PHYSICAL_VIOLENCE]: {
    name: "Physical Violence",
    description: "Physical assault and battery against women and girls",
    examples: ["beating", "physical assault", "bodily harm", "physical abuse"],
    color: "#dc2626"
  },
  [GenderViolenceCategory.ONLINE_VIOLENCE]: {
    name: "Online/Digital Violence",
    description: "Digital harassment, cyber abuse, and online gender-based violence",
    examples: ["revenge porn", "online stalking", "digital harassment", "cyber abuse", "doxxing"],
    color: "#7c3aed"
  },
  [GenderViolenceCategory.WORKPLACE_VIOLENCE]: {
    name: "Workplace Violence",
    description: "Gender-based violence and harassment in professional settings",
    examples: ["workplace sexual assault", "professional harassment", "job-related violence"],
    color: "#059669"
  },
  [GenderViolenceCategory.REPRODUCTIVE_VIOLENCE]: {
    name: "Reproductive Violence",
    description: "Violence related to reproductive rights and reproductive health",
    examples: ["forced sterilization", "reproductive coercion", "forced pregnancy", "denial of reproductive healthcare"],
    color: "#ea580c"
  },
  [GenderViolenceCategory.EDUCATIONAL_VIOLENCE]: {
    name: "Educational Violence",
    description: "Gender-based violence in educational settings",
    examples: ["school harassment", "academic sexual violence", "educational discrimination", "student abuse"],
    color: "#0891b2"
  },
  [GenderViolenceCategory.INSTITUTIONAL_VIOLENCE]: {
    name: "Institutional Violence",
    description: "Violence perpetrated by institutions against women and girls",
    examples: ["police violence against women", "institutional abuse", "systematic mistreatment"],
    color: "#7c2d12"
  },
  [GenderViolenceCategory.ELDER_ABUSE]: {
    name: "Elder Abuse",
    description: "Gender-based abuse of elderly women",
    examples: ["abuse of elderly women", "neglect of older females", "financial abuse of elderly women"],
    color: "#a21caf"
  },
  [GenderViolenceCategory.CULTURAL_VIOLENCE]: {
    name: "Cultural Violence",
    description: "Harmful cultural practices targeting women and girls",
    examples: ["cultural restrictions on women", "traditional harmful practices", "cultural oppression"],
    color: "#166534"
  },
  [GenderViolenceCategory.LEGAL_VIOLENCE]: {
    name: "Legal/Judicial Violence",
    description: "Violence through legal system discrimination and bias",
    examples: ["legal discrimination", "judicial bias", "legal system abuse", "court harassment"],
    color: "#991b1b"
  },
  [GenderViolenceCategory.MEDICAL_VIOLENCE]: {
    name: "Medical Violence",
    description: "Violence in healthcare settings against women",
    examples: ["medical abuse", "healthcare discrimination", "obstetric violence", "medical neglect"],
    color: "#0c4a6e"
  },
  [GenderViolenceCategory.POLITICAL_VIOLENCE]: {
    name: "Political Violence",
    description: "Violence targeting women in political participation",
    examples: ["political harassment of women", "violence against female politicians", "electoral violence"],
    color: "#581c87"
  },
  [GenderViolenceCategory.TECHNOLOGY_FACILITATED_VIOLENCE]: {
    name: "Technology-Facilitated Violence",
    description: "Violence enabled or amplified by technology platforms",
    examples: ["app-based harassment", "GPS stalking", "tech-enabled abuse", "AI-generated abuse content"],
    color: "#374151"
  }
};

export const CATEGORY_LIST = Object.values(GenderViolenceCategory);
export const CATEGORY_COUNT = CATEGORY_LIST.length;

// Special category groups for analysis
export const HIGH_SEVERITY_CATEGORIES = [
  GenderViolenceCategory.FEMICIDE,
  GenderViolenceCategory.SEXUAL_VIOLENCE,
  GenderViolenceCategory.TRAFFICKING,
  GenderViolenceCategory.HONOR_KILLINGS,
  GenderViolenceCategory.CHILD_ABUSE,
  GenderViolenceCategory.MISSING,
  GenderViolenceCategory.PHYSICAL_VIOLENCE,
  GenderViolenceCategory.FORCED_MARRIAGE,
  GenderViolenceCategory.FEMALE_GENITAL_MUTILATION,
  GenderViolenceCategory.ELDER_ABUSE
];

export const VIOLENCE_CATEGORIES = [
  GenderViolenceCategory.FEMICIDE,
  GenderViolenceCategory.DOMESTIC_VIOLENCE,
  GenderViolenceCategory.SEXUAL_VIOLENCE,
  GenderViolenceCategory.INTIMATE_PARTNER_VIOLENCE,
  GenderViolenceCategory.PHYSICAL_VIOLENCE,
  GenderViolenceCategory.HONOR_KILLINGS,
  GenderViolenceCategory.CHILD_ABUSE,
  GenderViolenceCategory.WORKPLACE_VIOLENCE,
  GenderViolenceCategory.EDUCATIONAL_VIOLENCE,
  GenderViolenceCategory.INSTITUTIONAL_VIOLENCE,
  GenderViolenceCategory.ELDER_ABUSE,
  GenderViolenceCategory.MEDICAL_VIOLENCE,
  GenderViolenceCategory.POLITICAL_VIOLENCE
];

export const NON_PHYSICAL_CATEGORIES = [
  GenderViolenceCategory.HARASSMENT,
  GenderViolenceCategory.PSYCHOLOGICAL_VIOLENCE,
  GenderViolenceCategory.ECONOMIC_VIOLENCE,
  GenderViolenceCategory.STALKING,
  GenderViolenceCategory.DISCRIMINATION,
  GenderViolenceCategory.BULLYING,
  GenderViolenceCategory.ONLINE_VIOLENCE,
  GenderViolenceCategory.REPRODUCTIVE_VIOLENCE,
  GenderViolenceCategory.CULTURAL_VIOLENCE,
  GenderViolenceCategory.LEGAL_VIOLENCE,
  GenderViolenceCategory.TECHNOLOGY_FACILITATED_VIOLENCE
];

export const DIGITAL_CATEGORIES = [
  GenderViolenceCategory.ONLINE_VIOLENCE,
  GenderViolenceCategory.TECHNOLOGY_FACILITATED_VIOLENCE,
  GenderViolenceCategory.STALKING  // stalking often includes cyberstalking
];

export const INSTITUTIONAL_CATEGORIES = [
  GenderViolenceCategory.INSTITUTIONAL_VIOLENCE,
  GenderViolenceCategory.LEGAL_VIOLENCE,
  GenderViolenceCategory.MEDICAL_VIOLENCE,
  GenderViolenceCategory.EDUCATIONAL_VIOLENCE,
  GenderViolenceCategory.WORKPLACE_VIOLENCE,
  GenderViolenceCategory.POLITICAL_VIOLENCE
];

export const TRADITIONAL_HARMFUL_PRACTICES = [
  GenderViolenceCategory.HONOR_KILLINGS,
  GenderViolenceCategory.FORCED_MARRIAGE,
  GenderViolenceCategory.FEMALE_GENITAL_MUTILATION,
  GenderViolenceCategory.CULTURAL_VIOLENCE
];

/**
 * Get category details by key
 */
export function getCategoryDetails(category: GenderViolenceCategory): GenderViolenceCategoryDetails {
  return GENDER_VIOLENCE_CATEGORIES[category];
}

/**
 * Get category color
 */
export function getCategoryColor(category: GenderViolenceCategory): string {
  return GENDER_VIOLENCE_CATEGORIES[category]?.color || "#666666";
}

/**
 * Check if category is high severity
 */
export function isHighSeverityCategory(category: GenderViolenceCategory): boolean {
  return HIGH_SEVERITY_CATEGORIES.includes(category);
}

/**
 * Format category name for display
 */
export function formatCategoryName(category: GenderViolenceCategory): string {
  return GENDER_VIOLENCE_CATEGORIES[category]?.name || category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}
