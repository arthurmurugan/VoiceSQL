-- Create a table for storing table definitions
CREATE TABLE IF NOT EXISTS table_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  schema JSONB NOT NULL
);

-- Create a table for storing dynamic data
CREATE TABLE IF NOT EXISTS dynamic_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID NOT NULL REFERENCES table_definitions(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_table_definitions_name ON table_definitions(name);
CREATE INDEX IF NOT EXISTS idx_dynamic_entities_table_id ON dynamic_entities(table_id);
CREATE INDEX IF NOT EXISTS idx_dynamic_entities_data ON dynamic_entities USING GIN(data);

-- Enable realtime
alter publication supabase_realtime add table table_definitions;
alter publication supabase_realtime add table dynamic_entities;