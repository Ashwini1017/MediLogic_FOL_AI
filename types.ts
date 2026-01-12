
export interface Symptom {
  id: string;
  name: string;
  category: string;
}

export interface Rule {
  id: string;
  conclusion: string; // Disease ID
  requirements: string[]; // List of Symptom IDs
  optional?: string[]; // Symptoms that increase confidence
  exclusions?: string[]; // Symptoms that, if present, invalidate this rule
  description: string;
}

export interface Disease {
  id: string;
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface KnowledgeBase {
  symptoms: Symptom[];
  diseases: Disease[];
  rules: Rule[];
}

export interface DiagnosticResult {
  diseaseId: string;
  diseaseName: string;
  confidence: number;
  matchCount: number;
  missingCount: number;
  satisfied: boolean;
  conflicting: string[]; // List of symptom names that trigger exclusions
  missingRequired: string[]; // List of required symptom names missing
  trace: string[]; // Logical steps taken
  reason: string;
}

export interface UncertaintyReport {
  incomplete: DiagnosticResult[];
  conflicting: DiagnosticResult[];
  ambiguous: DiagnosticResult[];
  noise: string[]; // Symptoms that didn't match anything
}
