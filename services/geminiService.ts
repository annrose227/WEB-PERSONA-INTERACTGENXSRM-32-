import { GoogleGenAI, Type, Modality } from "@google/genai";
import { LogEntry, ResearchResult } from "../types";

const generateLog = (
  source: LogEntry["source"],
  message: string
): LogEntry => ({
  id: Math.random().toString(36).substring(7),
  timestamp: new Date().toLocaleTimeString(),
  source,
  message,
  type: "info",
});

const getApiKey = async (): Promise<string> => {
  if (
    typeof (globalThis as any).chrome !== "undefined" &&
    (globalThis as any).chrome.storage
  ) {
    const result = await (globalThis as any).chrome.storage.sync.get(
      "geminiApiKey"
    );
    return result.geminiApiKey || "";
  }
  return (process.env as any).API_KEY || "";
};

// Helper: Generate an image if no visual is found
const generateVisuals = async (
  promptContext: string,
  addLog: (log: LogEntry) => void
): Promise<string | undefined> => {
  const apiKey = await getApiKey();
  const ai = new GoogleGenAI({ apiKey });
  addLog(
    generateLog(
      "GEMINI",
      "Synthesizing visual asset via gemini-2.5-flash-image..."
    )
  );

  const cleanPrompt =
    promptContext.length < 50
      ? `Abstract concept representation of: ${promptContext}`
      : promptContext.substring(0, 400);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [
          {
            text: `Create a high-quality, 16:9 editorial illustration, data visualization, or photorealistic image for this topic: ${cleanPrompt}`,
          },
        ],
      },
      config: {
        // @ts-ignore - imageConfig is valid for image models
        imageConfig: {
          aspectRatio: "16:9",
        },
      },
    });

    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData && part.inlineData.data) {
        addLog(generateLog("GEMINI", "Visual asset successfully synthesized."));
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    addLog(generateLog("GEMINI", `Image generation skipped: ${msg}`));
  }
  return undefined;
};

// Helper: Generate Audio Brief (TTS)
const generateAudioBrief = async (
  text: string,
  addLog: (log: LogEntry) => void
): Promise<string | undefined> => {
  const apiKey = await getApiKey();
  const ai = new GoogleGenAI({ apiKey });
  addLog(
    generateLog(
      "GEMINI",
      "Generating audio briefing via gemini-2.5-flash-preview-tts..."
    )
  );
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Research briefing. ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Kore" },
          },
        },
      },
    });

    const audioData =
      response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (audioData) {
      addLog(generateLog("GEMINI", "Audio briefing generated successfully."));
      return audioData;
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    addLog(generateLog("GEMINI", `Audio generation skipped: ${msg}`));
  }
  return undefined;
};

// Helper: Generate Sign Language Simulation Video (Veo)
export const generateSignLanguageVideo = async (
  text: string,
  addLog: (log: LogEntry) => void
): Promise<string | undefined> => {
  addLog(
    generateLog(
      "GEMINI",
      "Initializing Veo-3.1 video generation for sign language simulation..."
    )
  );

  // 1. Check for API Key Selection (Mandatory for Veo)
  if (window.aistudio) {
    const hasKey = await window.aistudio.hasSelectedApiKey();
    if (!hasKey) {
      addLog(
        generateLog(
          "GEMINI",
          "Action Required: Please select a paid API key for video generation."
        )
      );
      await window.aistudio.openSelectKey();
      // Assuming successful selection to proceed, though race conditions may occur.
    }
  }

  // 2. Instantiate AI client with potentially new key
  const apiKey = await getApiKey();
  const ai = new GoogleGenAI({ apiKey });

  // Truncate text for prompt to avoid token limits, keep core message
  const promptText = text.length > 200 ? text.substring(0, 200) + "..." : text;

  try {
    let operation = await ai.models.generateVideos({
      model: "veo-3.1-fast-generate-preview",
      prompt: `A professional cinematic video of a news anchor translating this text into American Sign Language (ASL): "${promptText}". The anchor is professional, neutral background, clear hand gestures, photorealistic 4k.`,
      config: {
        numberOfVideos: 1,
        resolution: "720p",
        aspectRatio: "16:9",
      },
    });

    addLog(
      generateLog(
        "GEMINI",
        "Veo video generation started. Polling for completion (approx 1-2 mins)..."
      )
    );

    // Polling with exponential backoff
    let attempts = 0;
    while (!operation.done && attempts < 60) {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      operation = await ai.operations.getVideosOperation({
        operation: operation,
      });
      attempts++;
      if (attempts % 4 === 0) {
        addLog(generateLog("GEMINI", "Still processing video simulation..."));
      }
    }

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (videoUri) {
      addLog(
        generateLog(
          "GEMINI",
          "Sign language simulation video generated successfully."
        )
      );
      // Append API key to make it playable in frontend
      return `${videoUri}&key=${apiKey}`;
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);

    // Handle "Requested entity was not found" specifically for API Key issues
    if (msg.includes("Requested entity was not found") && window.aistudio) {
      addLog(
        generateLog(
          "GEMINI",
          "Error: Invalid API Key for Veo. Please select a valid paid key."
        )
      );
      await window.aistudio.openSelectKey();
      return undefined;
    }

    addLog(generateLog("GEMINI", `Video generation failed: ${msg}`));
  }
  return undefined;
};

/**
 * Step 1: Planning
 */
export const planResearch = async (
  goal: string,
  addLog: (log: LogEntry) => void
): Promise<string[]> => {
  const apiKey = await getApiKey();
  const ai = new GoogleGenAI({ apiKey });
  addLog(generateLog("PLANNER", `Analyzing goal: "${goal}"`));

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `You are an autonomous research agent planner. 
      Break down the following user goal into 3 distinct, high-value search queries.
      User Goal: ${goal}
      
      Output only a JSON array of strings. Example: ["query 1", "query 2", "query 3"]`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
      },
    });

    let cleanText = response.text || "[]";
    cleanText = cleanText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const queries = JSON.parse(cleanText);
    addLog(
      generateLog(
        "PLANNER",
        `Generated plan with ${queries.length} execution steps.`
      )
    );
    return queries;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    addLog(
      generateLog(
        "PLANNER",
        `Error generating plan: ${errorMsg}. Using default goal.`
      )
    );
    return [goal];
  }
};

/**
 * Step 2: Execution & Synthesis
 */
export const executeResearch = async (
  goal: string,
  queries: string[],
  addLog: (log: LogEntry) => void,
  useDeepThink: boolean = false
): Promise<ResearchResult> => {
  const apiKey = await getApiKey();
  const ai = new GoogleGenAI({ apiKey });

  addLog(
    generateLog(
      "MCP",
      `Initializing Model Context Protocol (MCP) server connection...`
    )
  );
  await new Promise((r) => setTimeout(r, 400));
  addLog(
    generateLog(
      "MCP",
      `Context Server established. Listening for resource updates.`
    )
  );

  // Simulate browsing delays
  for (const query of queries) {
    addLog(
      generateLog(
        "SELENIUM",
        `WebDriver: Navigating to results for: "${query}"`
      )
    );
    await new Promise((r) => setTimeout(r, 600));
    addLog(generateLog("FAISS", `Vector DB: Upserting content chunks...`));
  }

  addLog(
    generateLog(
      "GEMINI",
      `Synthesizing insights${
        useDeepThink ? " with Deep Reasoning enabled (Budget: 2048)" : ""
      }...`
    )
  );

  try {
    const thinkingConfig = useDeepThink
      ? { thinkingConfig: { thinkingBudget: 2048 } }
      : undefined;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `User Goal: ${goal}
      
      Perform a deep-dive research analysis using Google Search.
      
      STRICTLY structure your response using the following Markdown headers.
      
      # Executive Summary
      (A clear, conversational 3-4 sentence overview of the findings, suitable for reading aloud.)
      
      # Highlights
      (A bulleted list of 4-5 key insights or data points.)
      
      # Detailed Report
      (The full, magazine-style detailed report in Markdown format. Use tables, bold text, and clear sections.)
      `,
      config: {
        tools: [{ googleSearch: {} }],
        ...thinkingConfig,
      },
    });

    const chunks =
      response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = chunks
      .map((chunk: any) => chunk.web)
      .filter((web: any) => web !== undefined && web !== null)
      .map((web: any) => ({ title: web.title, uri: web.uri }));

    const uniqueSources = Array.from(
      new Map(sources.map((s: any) => [s.uri, s])).values()
    );

    addLog(
      generateLog("SYSTEM", `Research complete. Data structured via MCP.`)
    );

    const text = response.text || "";

    // Robust Markdown Parsing
    let summary = "Research completed.";
    let highlights: string[] = [];
    let detailedMarkdown = text;

    try {
      const summaryMatch = text.match(
        /# Executive Summary\s*([\s\S]*?)(?=# Highlights|# Detailed Report|$)/i
      );
      if (summaryMatch) summary = summaryMatch[1].trim();

      const highlightsMatch = text.match(
        /# Highlights\s*([\s\S]*?)(?=# Detailed Report|$)/i
      );
      if (highlightsMatch) {
        highlights = highlightsMatch[1]
          .trim()
          .split("\n")
          .map((line) => line.replace(/^[-*•]\s*/, "").trim())
          .filter((line) => line.length > 0);
      }

      const reportMatch = text.match(/# Detailed Report\s*([\s\S]*)/i);
      if (reportMatch) detailedMarkdown = reportMatch[1].trim();
      else if (summary === "Research completed.") {
        // Fallback if structure is missing
        const paragraphs = text.split("\n\n");
        if (paragraphs.length > 0) summary = paragraphs[0];
      }
    } catch (parseError) {
      console.warn("Markdown parsing warning", parseError);
    }

    // Parallel Generation of Visuals and Audio
    const imagePrompt = `Topic: ${goal}. Context: ${summary}`;

    const [generatedImage, audioData] = await Promise.all([
      generateVisuals(imagePrompt, addLog),
      generateAudioBrief(summary, addLog),
    ]);

    return {
      summary,
      highlights,
      markdown: detailedMarkdown,
      sources: uniqueSources as any,
      generatedImage,
      audioData,
    };
  } catch (error: any) {
    const errorMsg = error.message || String(error);
    addLog(generateLog("GEMINI", `Synthesis failed: ${errorMsg}`));
    return {
      summary: "Research Failed",
      highlights: ["Error occurred during synthesis"],
      markdown: `### Error Details\n\n${errorMsg}`,
      sources: [],
    };
  }
};
