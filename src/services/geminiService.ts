import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const geminiService = {
  /**
   * Analyzes a CV to extract skills, experience, and suggest roles.
   */
  analyzeCV: async (cvText: string) => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyse this CV. Extract: key skills, years of experience, domains of expertise, languages spoken. Return as JSON. Then suggest 3 types of volunteer roles this person would be best suited for based on their profile.
        
        CV Text:
        ${cvText}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              skills: { type: Type.ARRAY, items: { type: Type.STRING } },
              yearsOfExperience: { type: Type.NUMBER },
              domains: { type: Type.ARRAY, items: { type: Type.STRING } },
              languages: { type: Type.ARRAY, items: { type: Type.STRING } },
              suggestedRoles: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    reason: { type: Type.STRING }
                  }
                }
              }
            }
          }
        }
      });
      return JSON.parse(response.text);
    } catch (error) {
      console.error("Gemini analyzeCV error:", error);
      throw error;
    }
  },
  
  /**
   * Detects duplicate or similar needs in the same region.
   */
  detectDuplicates: async (newNeed: any, existingNeeds: any[]) => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Check if this new humanitarian need is a duplicate or very similar to existing needs in the same region.
        New Need: ${JSON.stringify(newNeed)}
        Existing Needs: ${JSON.stringify(existingNeeds)}
        
        Return JSON with 'isDuplicate' (boolean) and 'reason' (string).`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isDuplicate: { type: Type.BOOLEAN },
              reason: { type: Type.STRING }
            }
          }
        }
      });
      return JSON.parse(response.text);
    } catch (error) {
      console.error("Gemini detectDuplicates error:", error);
      return { isDuplicate: false, reason: "" };
    }
  },

  /**
   * Summarizes a need and identifies urgency factors.
   */
  getNeedInsights: async (needData: any) => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Summarise this humanitarian need and identify patterns or urgency factors.
        Need Data: ${JSON.stringify(needData)}`,
      });
      return response.text;
    } catch (error) {
      console.error("Gemini getNeedInsights error:", error);
      return "Unable to generate insights at this time.";
    }
  },

  /**
   * Chat assistant for dataset Q&A.
   */
  chatWithData: async (query: string, dataContext: any[]) => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: query,
        config: {
          systemInstruction: `You are an assistant for CivicPulse, a humanitarian data platform. Answer questions about the dataset, volunteer needs, NGO activity, and trends. Here is the current data: ${JSON.stringify(dataContext)}`
        }
      });
      return response.text;
    } catch (error) {
      console.error("Gemini chatWithData error:", error);
      return "I'm sorry, I'm having trouble processing your request.";
    }
  },

  /**
   * Generates key insight cards for the researcher dashboard.
   */
  generateDashboardInsights: async (data: any[]) => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze the following dataset and provide 3 key insights for a researcher dashboard.
        Data: ${JSON.stringify(data)}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                value: { type: Type.STRING },
                description: { type: Type.STRING }
              }
            }
          }
        }
      });
      return JSON.parse(response.text);
    } catch (error) {
      console.error("Gemini generateDashboardInsights error:", error);
      return [];
    }
  },

  /**
   * Analyzes a dataset for summary, findings, and trends.
   */
  analyzeDataset: async (dataText: string) => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are a humanitarian data analyst. Analyse this dataset. Return a JSON object with:
        { summary: string, keyFindings: string[], trends: string[], dataQuality: string, suggestedVisualisation: string, tags: string[] }
        
        Dataset Content:
        ${dataText}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              keyFindings: { type: Type.ARRAY, items: { type: Type.STRING } },
              trends: { type: Type.ARRAY, items: { type: Type.STRING } },
              dataQuality: { type: Type.STRING },
              suggestedVisualisation: { type: Type.STRING },
              tags: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          }
        }
      });
      return JSON.parse(response.text);
    } catch (error) {
      console.error("Gemini analyzeDataset error:", error);
      throw error;
    }
  },

  /**
   * Advanced CV analysis for Researcher portal.
   */
  analyzeCVAdvanced: async (cvBase64: string, mimeType: string) => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            inlineData: {
              data: cvBase64,
              mimeType: mimeType
            }
          },
          {
            text: `You are an expert career analyst and volunteer coordinator. Analyse this CV/resume thoroughly. Return ONLY a valid JSON object with NO markdown, NO backticks, NO extra text. Structure:
            {
              name: string,
              currentRole: string,
              totalExperience: string,
              topSkills: string[],
              domains: string[],
              languages: string[],
              education: { degree: string, institution: string, year: string }[],
              strengths: string[],
              areasToGrow: string[],
              volunteerRoleSuggestions: { role: string, reason: string, urgencyMatch: string }[],
              overallFitScore: number (0–100),
              summary: string
            }`
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              currentRole: { type: Type.STRING },
              totalExperience: { type: Type.STRING },
              topSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
              domains: { type: Type.ARRAY, items: { type: Type.STRING } },
              languages: { type: Type.ARRAY, items: { type: Type.STRING } },
              education: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    degree: { type: Type.STRING },
                    institution: { type: Type.STRING },
                    year: { type: Type.STRING }
                  }
                }
              },
              strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
              areasToGrow: { type: Type.ARRAY, items: { type: Type.STRING } },
              volunteerRoleSuggestions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    role: { type: Type.STRING },
                    reason: { type: Type.STRING },
                    urgencyMatch: { type: Type.STRING }
                  }
                }
              },
              overallFitScore: { type: Type.NUMBER },
              summary: { type: Type.STRING }
            }
          }
        }
      });
      return JSON.parse(response.text);
    } catch (error) {
      console.error("Gemini analyzeCVAdvanced error:", error);
      throw error;
    }
  },

  /**
   * Analyzes field reports or surveys.
   */
  analyzeDocument: async (docText: string) => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze this document (field report/survey). Extract: summary, key entities (people, locations, organisations), extracted data points (numbers, dates, statistics), and suggested follow-up questions.
        
        Document Text:
        ${docText}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              entities: { type: Type.ARRAY, items: { type: Type.STRING } },
              dataPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
              followUpQuestions: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          }
        }
      });
      return JSON.parse(response.text);
    } catch (error) {
      console.error("Gemini analyzeDocument error:", error);
      throw error;
    }
  },
  /**
   * Advanced analysis for general research documents.
   */
  analyzeGeneralData: async (base64: string, mimeType: string, filename: string) => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            inlineData: {
              data: base64,
              mimeType: mimeType
            }
          },
          {
            text: `Analyze this document titled "${filename}" for a researcher at an NGO. Provide a comprehensive analysis.
            Return ONLY a valid JSON object with:
            {
              summary: string,
              findings: string[],
              recommendations: string[],
              dataType: string (Report/Dataset/Survey/etc),
              reliability: number (0-100),
              suggestedVisualisation: string (Chart Type),
              tags: string[]
            }`
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              findings: { type: Type.ARRAY, items: { type: Type.STRING } },
              recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
              dataType: { type: Type.STRING },
              reliability: { type: Type.NUMBER },
              suggestedVisualisation: { type: Type.STRING },
              tags: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          }
        }
      });
      return JSON.parse(response.text);
    } catch (error) {
      console.error("Gemini analyzeGeneralData error:", error);
      throw error;
    }
  },

  analyzeResearcherData: async (data: any) => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are a professional data scientist. Analyze this dataset and provide insights. 
        Dataset: ${JSON.stringify(data)}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              rowCount: { type: Type.NUMBER },
              columnCount: { type: Type.NUMBER },
              columns: { type: Type.ARRAY, items: { type: Type.STRING } },
              summary: { type: Type.STRING },
              keyFindings: { type: Type.ARRAY, items: { type: Type.STRING } },
              trends: { type: Type.ARRAY, items: { type: Type.STRING } },
              anomalies: { type: Type.ARRAY, items: { type: Type.STRING } },
              dataQuality: { type: Type.STRING, enum: ["Good", "Fair", "Poor"] },
              suggestedChartType: { type: Type.STRING, enum: ["bar", "line", "pie", "scatter"] },
              chartData: {
                type: Type.OBJECT,
                properties: {
                  labels: { type: Type.ARRAY, items: { type: Type.STRING } },
                  values: { type: Type.ARRAY, items: { type: Type.NUMBER } }
                }
              },
              tags: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          }
        }
      });
      return JSON.parse(response.text);
    } catch (error) {
      console.error("Gemini analyzeResearcherData error:", error);
      throw error;
    }
  },

  analyzeDeeply: async (dataContext: any) => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Perform a DEEP humanitarian analysis on this dataset.
        Dataset Info: ${JSON.stringify(dataContext)}
        
        You must provide deep insights, vulnerability assessments, and actionable recommendations.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              executiveSummary: { type: Type.STRING },
              criticalInsights: { type: Type.ARRAY, items: { type: Type.STRING } },
              vulnerabilityAnalysis: { type: Type.STRING },
              resourceGaps: { type: Type.ARRAY, items: { type: Type.STRING } },
              volunteerImpactEstimate: { type: Type.STRING },
              recommendedActions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    action: { type: Type.STRING },
                    priority: { type: Type.STRING },
                    timeframe: { type: Type.STRING }
                  }
                }
              },
              predictedTrend: { type: Type.STRING },
              confidenceScore: { type: Type.NUMBER },
              deepChartData: {
                type: Type.OBJECT,
                properties: {
                  chartType: { type: Type.STRING },
                  labels: { type: Type.ARRAY, items: { type: Type.STRING } },
                  values: { type: Type.ARRAY, items: { type: Type.NUMBER } }
                }
              }
            }
          }
        }
      });
      return JSON.parse(response.text);
    } catch (error) {
      console.error("Gemini analyzeDeeply error:", error);
      throw error;
    }
  }
};
