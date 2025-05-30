"use client";

import DashboardNavbar from "@/components/dashboard-navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Mic,
  MicOff,
  Plus,
  Trash2,
  AlertCircle,
  Edit,
  Save,
  X,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "../../../../../supabase/client";
import {
  tableService,
  ColumnDefinition,
  DynamicEntity,
} from "@/lib/table-service";
import { API_CONFIG, assemblyAI, groqAI } from "@/lib/api-config";

export default function TableDataView() {
  const supabase = createClient();
  const params = useParams();
  const router = useRouter();
  const tableId = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [table, setTable] = useState(null);
  const [columns, setColumns] = useState<ColumnDefinition[]>([]);
  const [rows, setRows] = useState<DynamicEntity[]>([]);
  const [newRow, setNewRow] = useState<Record<string, any>>({});
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [editData, setEditData] = useState<Record<string, any>>({});
  const [processingVoice, setProcessingVoice] = useState(false);
  const [voiceResponse, setVoiceResponse] = useState("");
  const [textCommand, setTextCommand] = useState("");
  const [useTextInput, setUseTextInput] = useState(false);
  const [isRecordingComplete, setIsRecordingComplete] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(
    null,
  );
  const [audioVisualization, setAudioVisualization] = useState<number[]>([]);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUser(data.user);
        fetchTableData();
      } else {
        window.location.href = "/sign-in";
      }
    };
    getUser();
  }, [supabase.auth]);

  const fetchTableData = async () => {
    setLoading(true);
    setError("");
    try {
      // Get table definition
      const tableData = await tableService.getTableById(tableId);
      setTable(tableData);
      setColumns(tableData.schema);

      // Get table entities
      const entities = await tableService.getEntities(tableId);
      setRows(entities);

      // Initialize newRow with empty values for each column
      const emptyRow: Record<string, any> = {};
      tableData.schema.forEach((col: ColumnDefinition) => {
        emptyRow[col.name] = col.default || "";
      });
      setNewRow(emptyRow);
    } catch (err) {
      console.error("Error fetching table data:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError("Failed to load table data: " + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (column: string, value: any) => {
    setNewRow((prev) => ({
      ...prev,
      [column]: value,
    }));
  };

  const handleEditChange = (column: string, value: any) => {
    setEditData((prev) => ({
      ...prev,
      [column]: value,
    }));
  };

  const startEditing = (row: any) => {
    setEditingRow(row.id);
    setEditData({ ...row.data });
  };

  const cancelEditing = () => {
    setEditingRow(null);
    setEditData({});
  };

  const saveEdit = async (id: string) => {
    try {
      await tableService.updateEntity(id, tableId, editData);
      setEditingRow(null);
      fetchTableData(); // Refresh data
    } catch (err) {
      console.error("Error updating row:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setVoiceResponse(`Error: ${errorMessage}`);
    }
  };

  const addRow = async () => {
    try {
      await tableService.createEntity({
        table_id: tableId,
        data: newRow,
      });

      // Reset the form
      const emptyRow: Record<string, any> = {};
      columns.forEach((col) => {
        emptyRow[col.name] = col.default || "";
      });
      setNewRow(emptyRow);

      // Refresh data
      fetchTableData();
    } catch (err) {
      console.error("Error adding row:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setVoiceResponse(`Error: ${errorMessage}`);
    }
  };

  const deleteRow = async (id: string) => {
    try {
      await tableService.deleteEntity(id);
      fetchTableData(); // Refresh data
    } catch (err) {
      console.error("Error deleting row:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setVoiceResponse(`Error: ${errorMessage}`);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null,
  );

  const startRecording = async () => {
    setIsRecording(true);
    setTranscript("");
    setVoiceResponse("");

    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Create a MediaRecorder instance
      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);

      const audioChunks: BlobPart[] = [];

      // Store audio data as it becomes available
      recorder.addEventListener("dataavailable", (event) => {
        audioChunks.push(event.data);
      });

      // When recording stops, process the audio
      recorder.addEventListener("stop", async () => {
        // Create a blob from the audio chunks
        const audioBlob = new Blob(audioChunks, { type: "audio/webm" });

        // Create URL for playback
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        setIsRecordingComplete(true);

        try {
          setTranscript("Processing audio...");

          // Use the assemblyAI service to transcribe the audio
          const transcription = await assemblyAI.transcribe(audioBlob);
          setTranscript(transcription);

          // Process the transcription
          processVoiceCommand(transcription);
        } catch (error) {
          console.error("Error processing audio:", error);
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          setVoiceResponse(`Error: Failed to process audio: ${errorMessage}`);
        } finally {
          // Stop all tracks to release the microphone
          stream.getTracks().forEach((track) => track.stop());
        }
      });

      // Start recording
      recorder.start();

      // Record for 5 seconds
      setTimeout(() => {
        if (recorder.state === "recording") {
          recorder.stop();
          setIsRecording(false);
        }
      }, 5000);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setIsRecording(false);
      setVoiceResponse(
        `Error: Microphone access denied. Please allow microphone access in your browser settings.`,
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop();
    }
    setIsRecording(false);
  };

  const processVoiceCommand = async (transcript: string) => {
    setProcessingVoice(true);
    try {
      // In a real implementation, you would use Groq AI here
      // For now, we'll simulate AI processing

      // Create a table schema for the AI to understand
      const tableSchema = {
        name: table.name,
        columns: columns.map((col) => ({
          name: col.name,
          type: col.type,
          required: col.required || false,
        })),
      };

      console.log("Processing voice command with table schema:", tableSchema);
      console.log("Transcript:", transcript);

      // Simulate AI processing
      let operation,
        data = {};

      if (
        transcript.toLowerCase().includes("add") ||
        transcript.toLowerCase().includes("create") ||
        transcript.toLowerCase().includes("insert")
      ) {
        operation = "insert";

        // Extract values for each column from the transcript
        for (const column of columns) {
          // Skip processing if column is undefined
          if (!column || !column.name) continue;

          console.log(`Looking for ${column.name} in transcript`);

          // Create a regex pattern that's more flexible
          const patterns = [
            new RegExp(
              `${column.name}\\s+(?:is|of|:)?\\s*([\\w@\\.\\s]+)(?:,|and|$)`,
              "i",
            ),
            new RegExp(`${column.name}\\s+([\\w@\\.\\s]+)(?:,|and|$)`, "i"),
            new RegExp(
              `with\\s+${column.name}\\s+([\\w@\\.\\s]+)(?:,|and|$)`,
              "i",
            ),
          ];

          // Try each pattern
          let match = null;
          for (const pattern of patterns) {
            match = transcript.match(pattern);
            if (match) break;
          }

          if (match) {
            let value = match[1].trim();
            console.log(`Found ${column.name}: ${value}`);

            // Convert value based on type
            if (column.type === "integer") {
              value = parseInt(value);
            } else if (column.type === "float") {
              value = parseFloat(value);
            } else if (column.type === "boolean") {
              value = value.toLowerCase() === "true";
            }

            data[column.name] = value;
          }
        }

        // If no specific matches, try to extract common patterns
        if (Object.keys(data).length === 0) {
          console.log("No direct matches found, trying common patterns");

          // Try to extract name
          const nameMatch =
            transcript.match(/name\s+(?:is|:)?\s*([\w\s]+)(?:,|and|$)/i) ||
            transcript.match(/with\s+([\w\s]+)(?:,|who|$)/i);
          if (nameMatch && columns.some((col) => col.name === "name")) {
            data.name = nameMatch[1].trim();
            console.log(`Found name: ${data.name}`);
          }

          // Try to extract age
          const ageMatch =
            transcript.match(/age\s+(?:is|:)?\s*(\d+)/i) ||
            transcript.match(/(\d+)\s+years\s+old/i);
          if (ageMatch && columns.some((col) => col.name === "age")) {
            data.age = parseInt(ageMatch[1]);
            console.log(`Found age: ${data.age}`);
          }

          // Try to extract email
          const emailMatch = transcript.match(
            /email\s+(?:is|:)?\s*([\w@\.]+)/i,
          );
          if (emailMatch && columns.some((col) => col.name === "email")) {
            data.email = emailMatch[1];
            console.log(`Found email: ${data.email}`);
          }

          // Try to extract salary
          const salaryMatch =
            transcript.match(/salary\s+(?:is|:)?\s*\$?(\d+)/i) ||
            transcript.match(/salary\s+(?:is|:)?\s*(\d+)/i) ||
            transcript.match(/makes\s+\$?(\d+)/i);
          if (salaryMatch && columns.some((col) => col.name === "salary")) {
            data.salary = parseInt(salaryMatch[1]);
            console.log(`Found salary: ${data.salary}`);
          }

          // Try to extract birthdate
          const birthdateMatch =
            transcript.match(
              /birthdate\s+(?:is|:)?\s*([\w\s,]+)(?:,|and|$)/i,
            ) ||
            transcript.match(
              /birth\s+date\s+(?:is|:)?\s*([\w\s,]+)(?:,|and|$)/i,
            ) ||
            transcript.match(/born\s+(?:on)?\s*([\w\s,]+)(?:,|and|$)/i);
          if (
            birthdateMatch &&
            columns.some((col) => col.name === "birthdate")
          ) {
            data.birthdate = birthdateMatch[1].trim();
            console.log(`Found birthdate: ${data.birthdate}`);
          }
        }

        console.log("Extracted data:", data);

        // Check for required fields
        const missingRequiredFields = [];
        for (const column of columns) {
          if (
            column.required &&
            (data[column.name] === undefined || data[column.name] === null)
          ) {
            missingRequiredFields.push(column.name);
          }
        }

        console.log("Missing required fields:", missingRequiredFields);

        // Handle required fields
        if (missingRequiredFields.length > 0) {
          // For id field specifically, generate a value if it's required
          if (
            missingRequiredFields.includes("id") &&
            columns.some((col) => col.name === "id" && col.type === "integer")
          ) {
            // Generate a sequential ID
            const maxId =
              rows.length > 0
                ? Math.max(...rows.map((row) => parseInt(row.data.id) || 0))
                : 0;
            data.id = maxId + 1;
            console.log(`Generated ID: ${data.id}`);
            missingRequiredFields.splice(
              missingRequiredFields.indexOf("id"),
              1,
            );
          }

          // For all other missing required fields, set them to null
          for (const fieldName of missingRequiredFields) {
            data[fieldName] = null;
            console.log(
              `Setting ${fieldName} to null as it's required but missing`,
            );
          }

          // Log that we're automatically filling required fields
          console.log(
            "Automatically filled missing required fields with null values",
          );
        }

        // Create the entity if we have data
        if (Object.keys(data).length > 0) {
          await tableService.createEntity({
            table_id: tableId,
            data,
          });

          setVoiceResponse(
            `Added new record with ${Object.keys(data).join(", ")}`,
          );
          fetchTableData(); // Refresh data
        } else {
          setVoiceResponse(
            "I couldn't extract any data from your command. Please try again.",
          );
        }
      } else if (
        transcript.toLowerCase().includes("delete") ||
        transcript.toLowerCase().includes("remove")
      ) {
        operation = "delete";

        // Try to find which record to delete
        let targetField = "name"; // Default to name field
        let targetValue = "";

        // Check if transcript mentions a specific field
        for (const column of columns) {
          const regex = new RegExp(
            `${column.name}\\s+([\\w@\\.\\s]+)(?:,|and|$)`,
            "i",
          );
          const match = transcript.match(regex);

          if (match) {
            targetField = column.name;
            targetValue = match[1].trim();
            console.log(`Found delete target: ${targetField} = ${targetValue}`);
            break;
          }
        }

        // If no specific field mentioned, try to extract a name
        if (!targetValue) {
          const nameMatch =
            transcript.match(/delete\s+([\w\s]+)(?:,|and|$)/i) ||
            transcript.match(/remove\s+([\w\s]+)(?:,|and|$)/i);
          if (nameMatch) {
            targetValue = nameMatch[1].trim();
            console.log(`Found delete target by name: ${targetValue}`);
          }
        }

        if (targetValue) {
          // Find matching rows
          const matchingRows = rows.filter((row) => {
            const fieldValue = String(
              row.data[targetField] || "",
            ).toLowerCase();
            return fieldValue.includes(targetValue.toLowerCase());
          });

          console.log(`Found ${matchingRows.length} matching rows`);

          if (matchingRows.length > 0) {
            // Delete the first matching row
            await tableService.deleteEntity(matchingRows[0].id);
            setVoiceResponse(
              `Deleted record with ${targetField} containing "${targetValue}"`,
            );
            fetchTableData(); // Refresh data
          } else {
            setVoiceResponse(
              `No records found with ${targetField} containing "${targetValue}"`,
            );
          }
        } else {
          setVoiceResponse(
            "I couldn't determine which record to delete. Please try again.",
          );
        }
      } else {
        setVoiceResponse(
          "I couldn't understand your command. Try saying something like 'Add a new person with name John, age 30, and email john@example.com' or 'Delete the record for John'.",
        );
      }
    } catch (err) {
      console.error("Error processing voice command:", err);
      // Don't set the error state, just show in the voice response area
      setVoiceResponse(`Error: ${err.message}`);
    } finally {
      setProcessingVoice(false);
    }
  };

  const formatValue = (value: any, type: string) => {
    if (value === null || value === undefined) return "";

    switch (type) {
      case "date":
        return new Date(value).toLocaleDateString();
      case "boolean":
        return value ? "Yes" : "No";
      default:
        return String(value);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#080808] min-h-screen text-white">
        <DashboardNavbar />
        <main className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-[#ababab]">Loading table data...</div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#080808] min-h-screen text-white">
        <DashboardNavbar />
        <main className="container mx-auto px-4 py-8">
          <div className="bg-red-900/20 border border-red-700 p-4 rounded-lg flex items-center gap-3">
            <AlertCircle className="text-red-500" size={20} />
            <p className="text-red-400">{error}</p>
            <Button
              onClick={fetchTableData}
              className="ml-auto bg-[#ff004f] hover:bg-[#e0003f] text-white"
            >
              Retry
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-[#080808] min-h-screen text-white">
      <style jsx global>{`
        @keyframes pulse {
          0% {
            transform: scaleY(0.5);
            opacity: 0.5;
          }
          50% {
            transform: scaleY(1.2);
            opacity: 1;
          }
          100% {
            transform: scaleY(0.5);
            opacity: 0.5;
          }
        }

        audio::-webkit-media-controls-panel {
          background-color: #262626;
        }
        audio::-webkit-media-controls-current-time-display,
        audio::-webkit-media-controls-time-remaining-display {
          color: #ffffff;
        }
        audio::-webkit-media-controls-play-button,
        audio::-webkit-media-controls-mute-button {
          filter: invert(1);
        }
        audio::-webkit-media-controls-volume-slider,
        audio::-webkit-media-controls-timeline {
          background-color: #333333;
        }
        audio::-webkit-media-controls-volume-slider-container,
        audio::-webkit-media-controls-timeline-container {
          background-color: #1a1a1a;
        }
      `}</style>
      <DashboardNavbar />
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">{table?.name}</h1>
            <p className="text-[#ababab]">
              {table?.description ||
                "Manage your table data and use voice commands to add or modify records"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => router.push("/dashboard/tables")}
              className="bg-[#262626] hover:bg-[#333] text-white"
            >
              Back to Tables
            </Button>
          </div>
        </div>

        {/* Voice Command Section */}
        <div className="bg-[#262626] rounded-xl p-6 border border-[#333] mb-8">
          <h2 className="text-xl font-medium mb-4">Voice Commands</h2>
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => setUseTextInput(false)}
                className={`${!useTextInput ? "bg-[#ff004f] hover:bg-[#e0003f]" : "bg-[#262626] hover:bg-[#333]"} text-white px-6`}
              >
                <Mic size={16} className="mr-2" />
                Voice Input
              </Button>
              <Button
                onClick={() => setUseTextInput(true)}
                className={`${useTextInput ? "bg-[#ff004f] hover:bg-[#e0003f]" : "bg-[#262626] hover:bg-[#333]"} text-white px-6`}
              >
                Text Input
              </Button>
            </div>

            {useTextInput ? (
              <div className="flex gap-2 w-full">
                <Input
                  value={textCommand}
                  onChange={(e) => setTextCommand(e.target.value)}
                  placeholder="Type your command here (e.g., 'Add a new person with name John, age 30')"
                  className="bg-[#1a1a1a] border-[#333] text-white flex-grow"
                />
                <Button
                  onClick={() => {
                    if (textCommand.trim()) {
                      setTranscript(textCommand);
                      processVoiceCommand(textCommand);
                      setTextCommand("");
                    }
                  }}
                  className="bg-[#ff004f] hover:bg-[#e0003f] text-white"
                  disabled={processingVoice || !textCommand.trim()}
                >
                  {processingVoice ? "Processing..." : "Submit"}
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Button
                  onClick={toggleRecording}
                  className={`${isRecording ? "bg-red-600 hover:bg-red-700" : "bg-[#ff004f] hover:bg-[#e0003f]"} text-white flex items-center gap-2 px-6`}
                  disabled={processingVoice}
                >
                  {isRecording ? (
                    <>
                      <MicOff size={16} />
                      Stop Recording
                    </>
                  ) : processingVoice ? (
                    <>Processing...</>
                  ) : (
                    <>
                      <Mic size={16} />
                      Start Recording
                    </>
                  )}
                </Button>
                <div className="text-[#ababab] text-sm">
                  {isRecording
                    ? "Listening..."
                    : processingVoice
                      ? "Processing your command..."
                      : "Click to start voice command"}
                </div>
              </div>
            )}
          </div>

          {isRecordingComplete && (
            <div className="bg-[#1a1a1a] p-4 rounded-lg border border-[#333] mb-4">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm text-[#ababab]">Recorded Audio:</p>
                <span className="text-xs text-[#ababab]">
                  {recordingDuration}s
                </span>
              </div>

              {/* Audio Waveform Visualization */}
              <div className="h-16 mb-3 flex items-center justify-center bg-[#0d0d0d] rounded overflow-hidden">
                {audioVisualization.length > 0 ? (
                  <div className="flex items-center h-full w-full px-2">
                    {audioVisualization.map((value, index) => (
                      <div
                        key={index}
                        className="w-1 mx-[1px] bg-[#ff004f]"
                        style={{
                          height: `${Math.min(Math.max(value / 2, 10), 100)}%`,
                        }}
                      ></div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[#ababab] text-xs">
                    No audio data available
                  </p>
                )}
              </div>

              {audioUrl && (
                <audio controls className="w-full mb-3">
                  <source src={audioUrl} type="audio/webm" />
                  Your browser does not support the audio element.
                </audio>
              )}

              <div className="mb-4">
                <p className="text-sm text-[#ababab] mb-2">Transcript:</p>
                <p className="text-white">"{transcript}"</p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => processVoiceCommand(transcript)}
                  className="bg-[#ff004f] hover:bg-[#e0003f] text-white"
                  disabled={
                    processingVoice || transcript === "Processing audio..."
                  }
                >
                  {processingVoice ? "Processing..." : "Process Command"}
                </Button>
                <Button
                  onClick={startRecording}
                  className="bg-[#262626] hover:bg-[#333] text-white"
                  disabled={isRecording || processingVoice}
                >
                  Record Again
                </Button>
              </div>
            </div>
          )}

          {!isRecordingComplete && transcript && (
            <div className="bg-[#1a1a1a] p-4 rounded-lg border border-[#333] mb-4">
              <p className="text-sm text-[#ababab] mb-2">Transcript:</p>
              <p className="text-white">"{transcript}"</p>
            </div>
          )}

          {voiceResponse && (
            <div
              className={`bg-[#1a1a1a] p-4 rounded-lg border ${voiceResponse.startsWith("Error:") ? "border-[#ff004f]" : "border-[#333]"} mb-4`}
            >
              <p className="text-sm text-[#ababab] mb-2">Response:</p>
              <p
                className={`${voiceResponse.startsWith("Error:") ? "text-[#ff004f]" : "text-white"}`}
              >
                {voiceResponse}
              </p>
            </div>
          )}

          <div className="mt-4 text-sm text-[#ababab]">
            <p className="font-medium mb-2">Example commands:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                "Add a new person with name John Smith, age 35, and email
                john@example.com"
              </li>
              <li>"Delete the record for Jane Smith"</li>
              <li>"Delete a user"</li>
              {columns.some((col) => col.name === "salary") && (
                <li>
                  "Add a new employee with name Alex Johnson, salary 75000, and
                  email alex@example.com"
                </li>
              )}
              {columns.some((col) => col.name === "birthdate") && (
                <li>
                  "Add a person with name Sarah Williams, birthdate January 15
                  1990, and email sarah@example.com"
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Table Data Section */}
        <div className="bg-[#262626] rounded-xl p-6 border border-[#333] mb-8">
          <h2 className="text-xl font-medium mb-4">Table Data</h2>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#1a1a1a] border-b border-[#333]">
                  {columns.map((column) => (
                    <th
                      key={column.name}
                      className="p-3 text-left text-[#ababab]"
                    >
                      {column.name}
                      {column.required && (
                        <span className="text-[#ff004f] ml-1">*</span>
                      )}
                    </th>
                  ))}
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length + 1}
                      className="p-4 text-center text-[#ababab]"
                    >
                      No data available. Add your first record below.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-[#333] hover:bg-[#1a1a1a]/50"
                    >
                      {editingRow === row.id ? (
                        // Edit mode
                        <>
                          {columns.map((column) => (
                            <td
                              key={`edit-${row.id}-${column.name}`}
                              className="p-3"
                            >
                              <Input
                                value={editData[column.name] || ""}
                                onChange={(e) =>
                                  handleEditChange(column.name, e.target.value)
                                }
                                className="bg-[#1a1a1a] border-[#333] text-white"
                                type={
                                  column.type === "integer" ||
                                  column.type === "float"
                                    ? "number"
                                    : column.type === "date"
                                      ? "date"
                                      : column.type === "boolean"
                                        ? "checkbox"
                                        : "text"
                                }
                              />
                            </td>
                          ))}
                          <td className="p-3 text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                onClick={() => saveEdit(row.id)}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                <Save size={16} />
                              </Button>
                              <Button
                                onClick={cancelEditing}
                                size="sm"
                                className="bg-[#333] hover:bg-[#444] text-white"
                              >
                                <X size={16} />
                              </Button>
                            </div>
                          </td>
                        </>
                      ) : (
                        // View mode
                        <>
                          {columns.map((column) => (
                            <td
                              key={`${row.id}-${column.name}`}
                              className="p-3"
                            >
                              {formatValue(row.data[column.name], column.type)}
                            </td>
                          ))}
                          <td className="p-3 text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                onClick={() => startEditing(row)}
                                size="sm"
                                className="bg-[#333] hover:bg-[#444] text-white"
                              >
                                <Edit size={16} />
                              </Button>
                              <Button
                                onClick={() => deleteRow(row.id)}
                                variant="destructive"
                                size="sm"
                                className="bg-transparent hover:bg-[#ff004f]/10 border border-[#ff004f] text-[#ff004f]"
                              >
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add New Row Section */}
        <div className="bg-[#262626] rounded-xl p-6 border border-[#333]">
          <h2 className="text-xl font-medium mb-4">Add New Row</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {columns.map((column) => (
              <div key={column.name}>
                <Label
                  htmlFor={`new-${column.name}`}
                  className="text-white mb-2 block"
                >
                  {column.name}
                  {column.required && (
                    <span className="text-[#ff004f] ml-1">*</span>
                  )}
                </Label>
                {column.type === "boolean" ? (
                  <div className="flex items-center h-10">
                    <input
                      id={`new-${column.name}`}
                      type="checkbox"
                      checked={newRow[column.name] || false}
                      onChange={(e) =>
                        handleInputChange(column.name, e.target.checked)
                      }
                      className="h-4 w-4 rounded border-[#333] bg-[#1a1a1a]"
                    />
                  </div>
                ) : (
                  <Input
                    id={`new-${column.name}`}
                    value={newRow[column.name] || ""}
                    onChange={(e) =>
                      handleInputChange(column.name, e.target.value)
                    }
                    placeholder={`Enter ${column.name}`}
                    className="bg-[#1a1a1a] border-[#333] text-white"
                    type={
                      column.type === "integer" || column.type === "float"
                        ? "number"
                        : column.type === "date"
                          ? "date"
                          : "text"
                    }
                    required={column.required}
                  />
                )}
              </div>
            ))}
          </div>

          <Button
            onClick={addRow}
            className="bg-[#ff004f] hover:bg-[#e0003f] text-white flex items-center gap-2"
          >
            <Plus size={16} />
            Add Row
          </Button>
        </div>
      </main>
    </div>
  );
}
