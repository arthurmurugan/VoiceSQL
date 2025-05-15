import { createClient } from "../../supabase/client";

const supabase = createClient();

export interface TableDefinition {
  id?: string;
  name: string;
  description?: string;
  schema: ColumnDefinition[];
  created_at?: string;
  updated_at?: string;
}

export interface ColumnDefinition {
  name: string;
  type: "string" | "integer" | "float" | "date" | "boolean";
  required?: boolean;
  default?: any;
}

export interface DynamicEntity {
  id?: string;
  table_id: string;
  data: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

// Table definition functions
export const tableService = {
  // Create a new table definition
  createTable: async (tableDefinition: TableDefinition) => {
    const { data, error } = await supabase
      .from("table_definitions")
      .insert({
        name: tableDefinition.name,
        description: tableDefinition.description || "",
        schema: tableDefinition.schema,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get all table definitions
  getTables: async () => {
    const { data, error } = await supabase
      .from("table_definitions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get a table definition by ID
  getTableById: async (id: string) => {
    const { data, error } = await supabase
      .from("table_definitions")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  // Update a table definition
  updateTable: async (id: string, updates: Partial<TableDefinition>) => {
    const { data, error } = await supabase
      .from("table_definitions")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete a table definition
  deleteTable: async (id: string) => {
    const { error } = await supabase
      .from("table_definitions")
      .delete()
      .eq("id", id);
    if (error) throw error;
    return true;
  },

  // Entity functions
  // Create a new entity
  createEntity: async (entity: DynamicEntity) => {
    // First get the table schema to validate the data
    const { data: tableDefinition, error: tableError } = await supabase
      .from("table_definitions")
      .select("schema")
      .eq("id", entity.table_id)
      .single();

    if (tableError) throw tableError;

    // Validate and clean the data according to the schema
    const schema = tableDefinition.schema as ColumnDefinition[];
    const validatedData = {};
    const missingRequiredFields = [];

    // Process each field according to its type
    for (const column of schema) {
      const value = entity.data[column.name];

      // Check required fields
      if (column.required && (value === undefined || value === null)) {
        // For id field, we'll handle it specially
        if (column.name === "id" && column.type === "integer") {
          // We'll generate an ID later
          missingRequiredFields.push(column.name);
          continue;
        } else {
          missingRequiredFields.push(column.name);
          continue;
        }
      }

      // Use default value if provided and value is missing
      if (
        (value === undefined || value === null) &&
        column.default !== undefined
      ) {
        validatedData[column.name] = column.default;
        continue;
      }

      // Skip if no value and not required
      if (value === undefined || value === null) {
        continue;
      }

      // Type conversion
      switch (column.type) {
        case "integer":
          validatedData[column.name] = parseInt(value, 10);
          break;
        case "float":
          validatedData[column.name] = parseFloat(value);
          break;
        case "date":
          validatedData[column.name] = new Date(value).toISOString();
          break;
        case "boolean":
          validatedData[column.name] = Boolean(value);
          break;
        default: // string
          validatedData[column.name] = String(value);
      }
    }

    // Handle missing required fields
    if (missingRequiredFields.length > 0) {
      // Special handling for ID field
      if (missingRequiredFields.includes("id")) {
        // Get all entities for this table to find the max ID
        const { data: entities, error: entitiesError } = await supabase
          .from("dynamic_entities")
          .select("data")
          .eq("table_id", entity.table_id);

        if (entitiesError) throw entitiesError;

        // Find the maximum ID
        let maxId = 0;
        if (entities && entities.length > 0) {
          for (const entity of entities) {
            const id = parseInt(entity.data.id || "0");
            if (!isNaN(id) && id > maxId) maxId = id;
          }
        }

        // Set the new ID
        validatedData["id"] = maxId + 1;

        // Remove id from missing fields
        const idIndex = missingRequiredFields.indexOf("id");
        if (idIndex !== -1) missingRequiredFields.splice(idIndex, 1);
      }

      // If there are still missing required fields, throw an error
      if (missingRequiredFields.length > 0) {
        throw new Error(
          `Required fields missing: ${missingRequiredFields.join(", ")}`,
        );
      }
    }

    // Insert the validated data
    const { data, error } = await supabase
      .from("dynamic_entities")
      .insert({
        table_id: entity.table_id,
        data: validatedData,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get all entities for a table
  getEntities: async (tableId: string) => {
    const { data, error } = await supabase
      .from("dynamic_entities")
      .select("*")
      .eq("table_id", tableId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get an entity by ID
  getEntityById: async (id: string) => {
    const { data, error } = await supabase
      .from("dynamic_entities")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  // Update an entity
  updateEntity: async (
    id: string,
    tableId: string,
    updates: Record<string, any>,
  ) => {
    // First get the current entity and table schema
    const [entityResult, tableResult] = await Promise.all([
      supabase.from("dynamic_entities").select("data").eq("id", id).single(),
      supabase
        .from("table_definitions")
        .select("schema")
        .eq("id", tableId)
        .single(),
    ]);

    if (entityResult.error) throw entityResult.error;
    if (tableResult.error) throw tableResult.error;

    const currentData = entityResult.data.data;
    const schema = tableResult.data.schema as ColumnDefinition[];

    // Merge current data with updates and validate
    const mergedData = { ...currentData, ...updates };
    const validatedData = {};

    // Process each field according to its type
    for (const column of schema) {
      const value = mergedData[column.name];

      // Check required fields
      if (column.required && (value === undefined || value === null)) {
        throw new Error(`Field ${column.name} is required`);
      }

      // Skip if no value and not required
      if (value === undefined || value === null) {
        continue;
      }

      // Type conversion
      switch (column.type) {
        case "integer":
          validatedData[column.name] = parseInt(value, 10);
          break;
        case "float":
          validatedData[column.name] = parseFloat(value);
          break;
        case "date":
          validatedData[column.name] = new Date(value).toISOString();
          break;
        case "boolean":
          validatedData[column.name] = Boolean(value);
          break;
        default: // string
          validatedData[column.name] = String(value);
      }
    }

    // Update the entity
    const { data, error } = await supabase
      .from("dynamic_entities")
      .update({
        data: validatedData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete an entity
  deleteEntity: async (id: string) => {
    const { error } = await supabase
      .from("dynamic_entities")
      .delete()
      .eq("id", id);
    if (error) throw error;
    return true;
  },

  // Advanced query functions
  // Query entities with filters
  queryEntities: async (tableId: string, filters: Record<string, any>) => {
    let query = supabase
      .from("dynamic_entities")
      .select("*")
      .eq("table_id", tableId);

    // Apply JSONB filters
    for (const [field, value] of Object.entries(filters)) {
      query = query.filter(`data->>'${field}'`, "eq", value);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },
};
