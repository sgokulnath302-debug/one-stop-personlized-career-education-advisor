export interface User {
  name: string;
  email: string;
  type: 'professional';
}

export interface AnalysisResult {
  core_metrics: {
    percentage: number;
    gpa: number;
    consistency_score: number;
  };
  strategic_profile: string;
  summary: string[];
  domains: {
    analytical: number;
    creative: number;
    technical: number;
  };
  recommendations: {
    courses: string[];
    internships: string[];
    extracurricular: string[];
  };
}
