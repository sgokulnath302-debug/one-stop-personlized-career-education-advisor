import { GoogleGenAI, ThinkingLevel, Modality, Type } from "@google/genai";
import { getNextKey } from "./keyManager";

const getAIInstance = () => {
  const envKey = process.env.GEMINI_API_KEY;
  const storedKey = getNextKey();
  const keyToUse = storedKey || envKey || "";
  return new GoogleGenAI({ apiKey: keyToUse });
};

const ai = {
  get models() { return getAIInstance().models; },
  get chats() { return getAIInstance().chats; },
  get operations() { return getAIInstance().operations; },
  get live() { return getAIInstance().live; }
};

const handleGeminiError = (error: any) => {
  console.error("Gemini API Error:", error);
  const errorMessage = error?.message || String(error);
  if (errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED") || errorMessage.toLowerCase().includes("quota")) {
    throw new Error("API Quota Exceeded: You've reached the limit for free AI requests. Please wait a few minutes or try again later.");
  }
  if (errorMessage.includes("500") || errorMessage.includes("INTERNAL")) {
    throw new Error("AI Service Error: The AI model is currently busy or experiencing issues. Please try again in a moment.");
  }
  throw error;
};

const withRetry = async <T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    const errorMessage = error?.message || String(error);
    const isRateLimit = errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED") || errorMessage.toLowerCase().includes("quota");
    
    if (isRateLimit && retries > 0) {
      console.warn(`Rate limit hit. Retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
};

export const analyzeStudentProfile = async (
  marks: Record<string, number>, 
  highThinking: boolean = false, 
  personality?: any,
  studentName?: string,
  institution?: string
) => {
  return withRetry(async () => {
    try {
      const prompt = `Act as an elite Academic Counselor and Career Strategist.
      Analyze the following academic marks with extreme precision and provide a comprehensive strategic profile.
      
      ${studentName ? `Student Name: ${studentName}` : ''}
      ${institution ? `Institution: ${institution}` : ''}
      Marks: ${JSON.stringify(marks)}
      ${personality ? `Personality Archetype: ${JSON.stringify(personality)}` : ""}
      ${highThinking ? "MODE: Deep Thinking / Nuanced Analysis. Provide highly detailed, strategic, and deeply reasoned insights. Look for subtle patterns in the marks that might indicate hidden strengths or cross-disciplinary potential. Consider the relative difficulty of subjects (e.g., STEM vs. Humanities) and how they complement each other." : "MODE: Standard Analysis."}
      
      Task:
      1. Extract/Confirm: Student Name and Institution.
      2. Calculate Core Metrics with mathematical precision: Total Percentage, GPA (4.0 scale), and a "Consistency Score" (0-100) based on standard deviation of marks.
      3. Assign a "Strategic Profile Persona" that captures the essence of their academic identity.
      4. Provide a 3-point Analysis Summary: Current Performance, Vocational Aptitude, and Strategic Recommendation.
      5. Evaluate performance in domains: Analytical, Creative, Technical, Stability, Growth, Innovation (0-100).
      6. Provide 3-4 specific, high-potential Career Suggestions.
      7. Provide 3-4 top-tier Recommended Institutions for higher studies.
      8. Provide specific, actionable recommendations for: Courses, Internships, Extracurriculars.
      
      Ensure the analysis is data-driven and provides exact, non-generic insights.
      Provide the response in JSON format with the following structure:
      {
        "student_name": "string",
        "institution": "string",
        "core_metrics": {
          "percentage": number,
          "gpa": number,
          "consistency_score": number
        },
        "strategic_profile": "string (Persona Title)",
        "summary": [
          "Current Performance point",
          "Vocational Aptitude point",
          "Strategic Recommendation point"
        ],
        "analysis_text": "A detailed summary paragraph",
        "suggestions": ["Career 1", "Career 2", "Career 3"],
        "institutions": ["Institution 1", "Institution 2"],
        "recommendations": {
          "courses": ["Course 1", "Course 2"],
          "internships": ["Internship 1", "Internship 2"],
          "extracurriculars": ["Activity 1", "Activity 2"]
        },
        "metrics": {
          "stability": number (0-100),
          "growth": number (0-100),
          "innovation": number (0-100),
          "analytical": number (0-100),
          "creative": number (0-100),
          "technical": number (0-100)
        }
      }`;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          thinkingConfig: { thinkingLevel: highThinking ? ThinkingLevel.HIGH : ThinkingLevel.LOW },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              student_name: { type: Type.STRING },
              institution: { type: Type.STRING },
              core_metrics: {
                type: Type.OBJECT,
                properties: {
                  percentage: { type: Type.NUMBER },
                  gpa: { type: Type.NUMBER },
                  consistency_score: { type: Type.NUMBER }
                }
              },
              strategic_profile: { type: Type.STRING },
              summary: { type: Type.ARRAY, items: { type: Type.STRING } },
              analysis_text: { type: Type.STRING },
              suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
              institutions: { type: Type.ARRAY, items: { type: Type.STRING } },
              recommendations: {
                type: Type.OBJECT,
                properties: {
                  courses: { type: Type.ARRAY, items: { type: Type.STRING } },
                  internships: { type: Type.ARRAY, items: { type: Type.STRING } },
                  extracurriculars: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
              },
              metrics: {
                type: Type.OBJECT,
                properties: {
                  stability: { type: Type.NUMBER },
                  growth: { type: Type.NUMBER },
                  innovation: { type: Type.NUMBER },
                  analytical: { type: Type.NUMBER },
                  creative: { type: Type.NUMBER },
                  technical: { type: Type.NUMBER }
                }
              }
            }
          }
        },
      });

      return JSON.parse(response.text || "{}");
    } catch (error) {
      return handleGeminiError(error);
    }
  });
};

export const getStudentGuidance = async (marks: Record<string, number>, highThinking: boolean = false) => {
  return withRetry(async () => {
    try {
      const prompt = `Act as an elite Academic Counselor and Career Strategist. 
      Analyze the following academic marks and provide personalized actionable guidance for the student's future.
      
      Marks: ${JSON.stringify(marks)}
      
      Provide the response in JSON format with the following structure:
      {
        "guidance_summary": "A high-level encouraging summary of the student's potential.",
        "action_items": [
          { "title": "Immediate Academic Focus", "description": "What subjects or skills to prioritize in the next 30 days." },
          { "title": "Skill Development", "description": "Specific technical or soft skills to acquire based on strengths." },
          { "title": "Competitive Edge", "description": "How to stand out in college applications or internships." },
          { "title": "Extracurricular Strategy", "description": "Specific activities that would complement their academic profile." }
        ],
        "academic_insights": "Specific trends in higher education or vocational fields relevant to their marks.",
        "recommended_resources": ["Resource 1", "Resource 2", "Resource 3"]
      }`;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          thinkingConfig: { thinkingLevel: highThinking ? ThinkingLevel.HIGH : ThinkingLevel.LOW },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              guidance_summary: { type: Type.STRING },
              action_items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING }
                  }
                }
              },
              academic_insights: { type: Type.STRING },
              recommended_resources: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          }
        },
      });

      return JSON.parse(response.text || "{}");
    } catch (error) {
      return handleGeminiError(error);
    }
  });
};

export interface CareerMatchResult {
  match_score: number;
  reasoning: string;
  pros: string[];
  cons: string[];
  salary_range: string;
  job_demand: 'High' | 'Medium' | 'Low';
}

export async function calculateCareerMatch(profile: any, careerName: string): Promise<CareerMatchResult> {
  return withRetry(async () => {
    try {
      const prompt = `Act as a Career Strategist and AI Matchmaker.
      Calculate the compatibility between this student profile and the target career: "${careerName}".

      Student Profile:
      ${JSON.stringify(profile, null, 2)}

      Return a JSON object with:
      - match_score: A percentage (0-100) based on skills, interests, and academic performance.
      - reasoning: A 2-sentence explanation of the score.
      - pros: Top 3 reasons why this is a good fit.
      - cons: Top 2 challenges or skill gaps.
      - salary_range: Typical annual salary range (e.g., "$60k - $120k").
      - job_demand: "High", "Medium", or "Low".`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              match_score: { type: Type.NUMBER },
              reasoning: { type: Type.STRING },
              pros: { type: Type.ARRAY, items: { type: Type.STRING } },
              cons: { type: Type.ARRAY, items: { type: Type.STRING } },
              salary_range: { type: Type.STRING },
              job_demand: { type: Type.STRING, enum: ["High", "Medium", "Low"] }
            },
            required: ["match_score", "reasoning", "pros", "cons", "salary_range", "job_demand"]
          }
        }
      });

      return JSON.parse(response.text || '{}');
    } catch (error) {
      return handleGeminiError(error);
    }
  });
}

export async function getTrendingCareers(): Promise<any[]> {
  return withRetry(async () => {
    try {
      const prompt = `Provide a list of 5 trending careers for 2026.
      For each career, provide:
      - title: Career title
      - growth: Expected growth percentage
      - demand: "High", "Medium", or "Low"
      - description: A brief 1-sentence description
      - skills: Top 3 skills needed
      - salary: Average starting salary range
      
      Return as a JSON array of objects.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                growth: { type: Type.STRING },
                demand: { type: Type.STRING },
                description: { type: Type.STRING },
                skills: { type: Type.ARRAY, items: { type: Type.STRING } },
                salary: { type: Type.STRING }
              }
            }
          }
        }
      });

      return JSON.parse(response.text || '[]');
    } catch (error) {
      return handleGeminiError(error);
    }
  });
}

export const performCareerGapAnalysis = async (data: {
  currentRole: string;
  experience: string;
  targetRole: string;
  skills: string;
}, highThinking: boolean = false) => {
  return withRetry(async () => {
    try {
    const prompt = `Perform a Career Gap Analysis for the following professional profile:
    Current Role: ${data.currentRole}
    Experience: ${data.experience} years
    Target Role: ${data.targetRole}
    Skills: ${data.skills}
    
    Provide the response in JSON format with the following structure:
    {
      "analysis": "A detailed gap analysis and leadership readiness assessment",
      "trajectories": [
        { 
          "title": "string", 
          "description": "string",
          "level": "Junior" | "Senior" | "Executive",
          "metrics": {
            "stability": number (0-100),
            "growth": number (0-100),
            "innovation": number (0-100)
          }
        }
      ],
      "metrics": {
        "stability": number (0-100),
        "growth": number (0-100),
        "innovation": number (0-100)
      }
    }`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        thinkingConfig: { thinkingLevel: highThinking ? ThinkingLevel.HIGH : ThinkingLevel.LOW },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            analysis: { type: Type.STRING },
            trajectories: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  level: { 
                    type: Type.STRING,
                    enum: ["Junior", "Senior", "Executive"]
                  },
                  metrics: {
                    type: Type.OBJECT,
                    properties: {
                      stability: { type: Type.NUMBER },
                      growth: { type: Type.NUMBER },
                      innovation: { type: Type.NUMBER }
                    }
                  }
                }
              }
            },
            metrics: {
              type: Type.OBJECT,
              properties: {
                stability: { type: Type.NUMBER },
                growth: { type: Type.NUMBER },
                innovation: { type: Type.NUMBER }
              }
            }
          }
        }
      },
    });

    return JSON.parse(response.text || "{}");
    } catch (error) {
      return handleGeminiError(error);
    }
  });
};

export const analyzeResume = async (base64Data: string, mimeType: string) => {
  return withRetry(async () => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: [
          {
            parts: [
              { inlineData: { data: base64Data.split(",")[1], mimeType } },
              { text: "Extract the following professional details from this resume: current job title/role, total years of professional experience (as a number), and a comma-separated list of key technical and soft skills. Return the data as a clean JSON object." }
            ]
          }
        ],
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              currentRole: { 
                type: Type.STRING,
                description: "The candidate's most recent or current job title."
              },
              experience: { 
                type: Type.NUMBER,
                description: "Total years of professional experience."
              },
              skills: { 
                type: Type.STRING,
                description: "A comma-separated list of key skills."
              }
            },
            required: ["currentRole", "experience", "skills"]
          }
        },
      });

      return JSON.parse(response.text || "{}");
    } catch (error) {
      return handleGeminiError(error);
    }
  });
};

export const getCareerCoaching = async (data: {
  currentRole: string;
  experience: string;
  targetRole: string;
  skills: string;
}, highThinking: boolean = false) => {
  return withRetry(async () => {
    try {
      const prompt = `Act as an elite Career Coach and Executive Mentor. 
      Analyze the following professional profile and provide personalized actionable advice for career advancement towards the target role.
      
      Current Role: ${data.currentRole}
      Experience: ${data.experience} years
      Target Role: ${data.targetRole}
      Skills: ${data.skills}
      
      Provide the response in JSON format with the following structure:
      {
        "coaching_summary": "A high-level encouraging summary of the career path.",
        "action_items": [
          { "title": "Immediate Action", "description": "What to do in the next 30 days." },
          { "title": "Skill Acquisition", "description": "Specific skills or certifications to pursue." },
          { "title": "Networking Strategy", "description": "How to connect with the right people for the target role." },
          { "title": "Portfolio/Resume Tip", "description": "How to position current experience for the target role." }
        ],
        "market_insights": "Specific trends in the industry for the target role.",
        "recommended_resources": ["Resource 1", "Resource 2", "Resource 3"]
      }`;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          thinkingConfig: { thinkingLevel: highThinking ? ThinkingLevel.HIGH : ThinkingLevel.LOW },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              coaching_summary: { type: Type.STRING },
              action_items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING }
                  }
                }
              },
              market_insights: { type: Type.STRING },
              recommended_resources: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          }
        },
      });

      return JSON.parse(response.text || "{}");
    } catch (error) {
      return handleGeminiError(error);
    }
  });
};

export const getChatResponse = async (message: string, context: any, highThinking: boolean = false, image?: string) => {
  return withRetry(async () => {
    try {
      const parts: any[] = [{ text: message }];
      
      if (image) {
        parts.unshift({
          inlineData: {
            data: image.split(",")[1],
            mimeType: "image/png"
          }
        });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: [{ parts }],
        config: {
          thinkingConfig: { thinkingLevel: highThinking ? ThinkingLevel.HIGH : ThinkingLevel.LOW },
          systemInstruction: `You are the CareerPath AI Assistant, an intelligent conversational counselor. 
          You have access to the user's current profile context: ${JSON.stringify(context)}.
          Provide professional, encouraging, and data-driven advice. 
          Suggest specific institutions (e.g., IIT Madras, Anna University) and market trends.
          If asked for a roadmap, provide a structured multi-step action plan.`,
        },
      });

      return response.text;
    } catch (error) {
      return handleGeminiError(error);
    }
  });
};

export const generateCareerRoadmap = async (context: any, highThinking: boolean = false) => {
  return withRetry(async () => {
    try {
      const prompt = `Act as an elite Career Strategist and Future Architect. 
      Based on the user's profile context, generate a detailed, multi-step career roadmap.
      
      Context: ${JSON.stringify(context)}
      
      The roadmap should include:
      1. A clear career objective.
      2. 4-5 specific, time-bound phases (e.g., Phase 1: Foundation, Phase 2: Specialization, etc.).
      3. For each phase, list:
         - Key skills to acquire.
         - Recommended certifications or courses.
         - Strategic milestones.
         - Potential challenges and how to overcome them.
      4. A final "Vision 2030" summary.
      
      Format the output using Markdown for clear structure, using bold headings, bullet points, and numbered lists.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          thinkingConfig: { thinkingLevel: highThinking ? ThinkingLevel.HIGH : ThinkingLevel.LOW },
          systemInstruction: "You are the CareerPath AI Strategist. Your goal is to architect the perfect career roadmap for the user based on their unique academic and professional data.",
        },
      });

      return response.text;
    } catch (error) {
      return handleGeminiError(error);
    }
  });
};

export const getSkillAlignmentFeedback = async (skills: string[], targetRole: string, currentRole: string) => {
  return withRetry(async () => {
    try {
      const prompt = `Analyze the alignment of the following skills with the target role "${targetRole}", considering the current role "${currentRole}".
      Skills: ${skills.join(', ')}
      
      Provide a detailed alignment score (0-100), a brief explanation of the alignment, and suggest 3-5 complementary skills for career advancement.
      
      Provide the response in JSON format:
      {
        "alignment_score": number,
        "explanation": "string",
        "complementary_skills": ["skill 1", "skill 2", ...],
        "role_mapping": "string explaining how these skills map to the target role"
      }`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              alignment_score: { type: Type.NUMBER },
              explanation: { type: Type.STRING },
              complementary_skills: { type: Type.ARRAY, items: { type: Type.STRING } },
              role_mapping: { type: Type.STRING }
            }
          }
        },
      });

      return JSON.parse(response.text || "{}");
    } catch (error) {
      return handleGeminiError(error);
    }
  });
};

export const getSubjectSuggestions = async (level: string, department: string) => {
  return withRetry(async () => {
    try {
      const prompt = `Suggest a list of 8-10 academic subjects relevant to a student at the following level and department.
      Level: ${level}
      Department: ${department}
      
      Provide the response in JSON format:
      {
        "subjects": ["Subject 1", "Subject 2", ...]
      }`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              subjects: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          }
        },
      });

      return JSON.parse(response.text || "{}");
    } catch (error) {
      return handleGeminiError(error);
    }
  });
};

export const getSubjectInfo = async (subject: string, department: string) => {
  return withRetry(async () => {
    try {
      const prompt = `Provide a brief description of the academic subject "${subject}" in the context of the "${department}" department, and explain its relevance to future career paths.
      
      Provide the response in JSON format:
      {
        "description": "A concise 2-3 sentence description.",
        "career_relevance": "A concise 1-2 sentence explanation of its professional value."
      }`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              description: { type: Type.STRING },
              career_relevance: { type: Type.STRING }
            }
          }
        },
      });

      return JSON.parse(response.text || "{}");
    } catch (error) {
      return handleGeminiError(error);
    }
  });
};

export const performOCR = async (base64Image: string, mimeType: string = "image/png") => {
  return withRetry(async () => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: [
          {
            parts: [
              { inlineData: { data: base64Image.split(",")[1], mimeType } },
              { text: `Act as an expert Academic Registrar and Career Strategist. 
              1) Extract with high precision: Student Name, Institution Name, Student Level, Department, Subject Names, and Marks. 
              2) For marks, look for "Marks Obtained" and "Maximum Marks" to calculate exact percentages. If only grades are present (e.g., A, B, O), map them to standard percentages (O: 95, A+: 90, A: 80, B: 70, etc.).
              3) Calculate Core Metrics: Total %, GPA (on 4.0 scale), and a Consistency Score (based on variance between subjects).
              4) Assign a Strategic Profile Persona that reflects their unique talent mix.
              5) Provide a 3-point summary: Current Performance, Vocational Aptitude, and Strategic Recommendation.
              6) Provide 3-4 specific career suggestions based on the profile.
              7) Provide specific recommendations for: Relevant Courses, Internships, and Extracurriculars.
              8) Provide 3-4 recommended institutions for higher studies.
              9) Provide a set of metrics (0-100) for: stability, growth, innovation, analytical, creative, technical.
              
              Ensure all numerical calculations are mathematically accurate based on the extracted data.
              Return the data as a clean JSON object.` }
            ]
          }
        ],
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              student_name: { type: Type.STRING },
              institution: { type: Type.STRING },
              level: { 
                type: Type.STRING,
                enum: ["school_10th", "school_12th", "college"]
              },
              department: { type: Type.STRING },
              subjects: { 
                type: Type.OBJECT,
                additionalProperties: { type: Type.NUMBER }
              },
              core_metrics: {
                type: Type.OBJECT,
                properties: {
                  percentage: { type: Type.NUMBER },
                  gpa: { type: Type.NUMBER },
                  consistency_score: { type: Type.NUMBER }
                }
              },
              strategic_profile: { type: Type.STRING },
              summary: { 
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              suggestions: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              analysis_text: { type: Type.STRING },
              recommendations: {
                type: Type.OBJECT,
                properties: {
                  courses: { type: Type.ARRAY, items: { type: Type.STRING } },
                  internships: { type: Type.ARRAY, items: { type: Type.STRING } },
                  extracurriculars: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
              },
              institutions: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              metrics: {
                type: Type.OBJECT,
                properties: {
                  stability: { type: Type.NUMBER },
                  growth: { type: Type.NUMBER },
                  innovation: { type: Type.NUMBER },
                  analytical: { type: Type.NUMBER },
                  creative: { type: Type.NUMBER },
                  technical: { type: Type.NUMBER }
                }
              }
            }
          }
        },
      });

      return JSON.parse(response.text || "{}");
    } catch (error) {
      return handleGeminiError(error);
    }
  });
};

export const generateSpeech = async (text: string) => {
  return withRetry(async () => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    } catch (error) {
      return handleGeminiError(error);
    }
  });
};
