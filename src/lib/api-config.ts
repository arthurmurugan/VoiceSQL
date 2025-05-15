// API configuration for external services

export const API_CONFIG = {
  assemblyAI: {
    baseUrl: "https://api.assemblyai.com/v2",
    headers: {
      authorization: process.env.NEXT_PUBLIC_ASSEMBLY_AI_API_KEY || "",
      "content-type": "application/json",
    },
  },
  groqAI: {
    baseUrl: "https://api.groq.com/openai/v1",
    headers: {
      authorization: `Bearer ${process.env.NEXT_PUBLIC_GROQ_API_KEY || ""}`,
      "content-type": "application/json",
    },
  },
};

// AssemblyAI API client
export const assemblyAI = {
  transcribe: async (audioBlob: Blob) => {
    try {
      // Check if we have an API key for AssemblyAI
      const apiKey = process.env.NEXT_PUBLIC_ASSEMBLY_AI_API_KEY;

      if (!apiKey || apiKey.length < 10) {
        console.error("No valid AssemblyAI API key found");
        return "Please configure a valid AssemblyAI API key in your environment variables.";
      }

      // First, upload the audio file to AssemblyAI
      const uploadResponse = await fetch(
        `${API_CONFIG.assemblyAI.baseUrl}/upload`,
        {
          method: "POST",
          headers: API_CONFIG.assemblyAI.headers,
          body: audioBlob,
        },
      );

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed with status: ${uploadResponse.status}`);
      }

      const uploadResult = await uploadResponse.json();
      const audioUrl = uploadResult.upload_url;

      if (!audioUrl) {
        throw new Error("Failed to get upload URL from AssemblyAI");
      }

      // Now, submit the transcription request
      const transcriptResponse = await fetch(
        `${API_CONFIG.assemblyAI.baseUrl}/transcript`,
        {
          method: "POST",
          headers: API_CONFIG.assemblyAI.headers,
          body: JSON.stringify({
            audio_url: audioUrl,
            language_code: "en_us",
          }),
        },
      );

      if (!transcriptResponse.ok) {
        throw new Error(
          `Transcription request failed with status: ${transcriptResponse.status}`,
        );
      }

      const transcriptResult = await transcriptResponse.json();
      const transcriptId = transcriptResult.id;

      if (!transcriptId) {
        throw new Error("Failed to get transcript ID from AssemblyAI");
      }

      // Poll for the transcription result
      let result = { status: "processing" };
      while (result.status !== "completed" && result.status !== "error") {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const pollingResponse = await fetch(
          `${API_CONFIG.assemblyAI.baseUrl}/transcript/${transcriptId}`,
          { headers: API_CONFIG.assemblyAI.headers },
        );

        if (!pollingResponse.ok) {
          throw new Error(
            `Polling failed with status: ${pollingResponse.status}`,
          );
        }

        result = await pollingResponse.json();

        if (result.status === "error") {
          throw new Error(`Transcription error: ${result.error}`);
        }
      }

      return result.text || "No transcription available.";
    } catch (error) {
      console.error("AssemblyAI transcription error:", error);

      // Fallback to browser's speech recognition if AssemblyAI fails
      try {
        return new Promise((resolve) => {
          // Check if browser supports speech recognition
          if (
            !("webkitSpeechRecognition" in window) &&
            !("SpeechRecognition" in window)
          ) {
            resolve(
              "Speech recognition failed. Please try again or use text input.",
            );
            return;
          }

          // Return a helpful error message
          resolve(
            "AssemblyAI transcription failed. Please try again or use text input.",
          );
        });
      } catch (fallbackError) {
        console.error("Fallback speech recognition error:", fallbackError);
        throw error; // Throw the original error
      }
    }
  },
};

// Groq AI API client
export const groqAI = {
  processCommand: async (transcript: string, tableSchema: any) => {
    try {
      // In a real app, you would send this to Groq AI
      // For now, we'll simulate processing
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Simple parsing logic based on the transcript
      if (
        transcript.toLowerCase().includes("add") ||
        transcript.toLowerCase().includes("create")
      ) {
        return "insert";
      } else if (
        transcript.toLowerCase().includes("delete") ||
        transcript.toLowerCase().includes("remove")
      ) {
        return "delete";
      } else {
        return "unknown";
      }
    } catch (error) {
      console.error("Groq AI processing error:", error);
      throw error;
    }
  },
};
