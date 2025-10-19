'use client';

import { useEffect, useState } from 'react';

interface Schema {
  name: string;
  version: number;
  createdAt: string;
  options: {
    fileTypes: string[];
    externalValidations: string[];
  };
  schema: Record<string, unknown>;
}

interface SchemaResponse {
  limit: number;
  offset: number;
  count: number;
  resultSet: Schema[];
}

export default function Home() {
  const [schemas, setSchemas] = useState<Schema[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [schemaNames, setSchemaNames] = useState<string[]>([]);
  const [selectedSchemaName, setSelectedSchemaName] = useState<string>('');
  const [availableVersions, setAvailableVersions] = useState<number[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);

  useEffect(() => {
    fetch('https://song-ilifu.openup.org.za/schemas')
      .then(res => res.json())
      .then((data: SchemaResponse) => {
        setSchemas(data.resultSet);

        // Extract unique schema names
        const names = Array.from(new Set(data.resultSet.map(s => s.name)));
        setSchemaNames(names);

        // Select first schema by default
        if (names.length > 0) {
          setSelectedSchemaName(names[0]);
        }

        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Update available versions when schema name changes
  useEffect(() => {
    if (selectedSchemaName && schemas.length > 0) {
      const versions = schemas
        .filter(s => s.name === selectedSchemaName)
        .map(s => s.version)
        .sort((a, b) => b - a); // Sort descending

      setAvailableVersions(versions);

      // Select max version by default
      if (versions.length > 0) {
        setSelectedVersion(versions[0]);
      }
    }
  }, [selectedSchemaName, schemas]);

  const handleSchemaNameChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSchemaName(e.target.value);
  };

  const handleVersionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedVersion(Number(e.target.value));
  };

  const generateRandomString = (length: number): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const generateFastaSequenceName = (schemaName: string, version: number): string => {
    const randomSuffix = generateRandomString(5);
    return `${schemaName}_v${version}_${randomSuffix}`;
  };

  const generateFastaFilename = (schemaName: string, version: number): string => {
    const now = new Date();
    const timestamp = now.toISOString().split('.')[0].replace(/[-:]/g, '').replace('T', '_');
    return `${schemaName}_${version}_${timestamp}.fasta`;
  };

  const generateFastaContent = (sequenceName: string): string => {
    const sequence = 'ATGC'.repeat(40); // 160 characters total, split into 2 rows of 80
    const row1 = sequence.slice(0, 80);
    const row2 = sequence.slice(80, 160);
    return `>${sequenceName}\n${row1}\n${row2}\n`;
  };

  const generateRandomDate = (): string => {
    const now = new Date();
    const hundredYearsAgo = new Date(now.getFullYear() - 100, 0, 1);
    const randomTime = hundredYearsAgo.getTime() + Math.random() * (now.getTime() - hundredYearsAgo.getTime());
    const randomDate = new Date(randomTime);
    return randomDate.toISOString().split('T')[0]; // YYYY-MM-DD format
  };

  const getSelectedSchema = (): Schema | undefined => {
    return schemas.find(s => s.name === selectedSchemaName && s.version === selectedVersion);
  };

  const generateValueForField = (fieldName: string, fieldSchema: any, fastaFilename: string, sequenceName: string): string => {
    // Special fields
    if (fieldName === 'fasta_file_name') {
      return fastaFilename;
    }
    if (fieldName === 'fasta_header_name') {
      return sequenceName;
    }

    // Skip _other fields
    if (fieldName.endsWith('_other')) {
      return '';
    }

    // Handle by type
    if (fieldSchema.enum && fieldSchema.enum.length > 0) {
      // Pick first enum value
      return fieldSchema.enum[0];
    }

    if (fieldSchema.type === 'string') {
      if (fieldSchema.format === 'date' || fieldName.toLowerCase().includes('date')) {
        return generateRandomDate();
      }
      return 'test value';
    }

    if (fieldSchema.type === 'integer' || fieldSchema.type === 'number') {
      return '1';
    }

    if (fieldSchema.type === 'boolean') {
      return 'true';
    }

    return 'test value';
  };

  const generateTsvContent = (schemaObj: Schema, fastaFilename: string, sequenceName: string): string => {
    const schemaProperties = (schemaObj.schema as any)?.properties || {};
    const fieldNames = Object.keys(schemaProperties);

    // Generate header row
    const header = fieldNames.join('\t');

    // Generate data row
    const values = fieldNames.map(fieldName => {
      const fieldSchema = schemaProperties[fieldName];
      return generateValueForField(fieldName, fieldSchema, fastaFilename, sequenceName);
    });
    const dataRow = values.join('\t');

    return `${header}\n${dataRow}\n`;
  };

  const generateTsvFilename = (schemaName: string, version: number): string => {
    const now = new Date();
    const timestamp = now.toISOString().split('.')[0].replace(/[-:]/g, '').replace('T', '_');
    return `${schemaName}_${version}_${timestamp}.tsv`;
  };

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownload = () => {
    if (!selectedSchemaName || selectedVersion === null) return;

    const schemaObj = getSelectedSchema();
    if (!schemaObj) {
      console.error('Schema not found');
      return;
    }

    // Generate FASTA file
    const sequenceName = generateFastaSequenceName(selectedSchemaName, selectedVersion);
    const fastaFilename = generateFastaFilename(selectedSchemaName, selectedVersion);
    const fastaContent = generateFastaContent(sequenceName);

    // Generate TSV file
    const tsvFilename = generateTsvFilename(selectedSchemaName, selectedVersion);
    const tsvContent = generateTsvContent(schemaObj, fastaFilename, sequenceName);

    // Download both files
    downloadFile(fastaContent, fastaFilename);
    setTimeout(() => {
      downloadFile(tsvContent, tsvFilename);
    }, 100); // Small delay to ensure both downloads trigger
  };

  return (
    <div className="min-h-screen p-8 pb-20 sm:p-20 font-sans">
      <main className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Test Data Generator</h1>

        <p className="mb-8 text-gray-600 dark:text-gray-400">
          Generate conformant test data files (.tsv and .fasta) for SONG schema validation.
        </p>

        {loading && (
          <div className="text-gray-600 dark:text-gray-400">Loading schemas...</div>
        )}

        {error && (
          <div className="text-red-600 dark:text-red-400 mb-4">
            Error loading schemas: {error}
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-6">
            <div>
              <label
                htmlFor="schema-name"
                className="block mb-2 font-medium"
              >
                Schema Name
              </label>
              <select
                id="schema-name"
                value={selectedSchemaName}
                onChange={handleSchemaNameChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
              >
                {schemaNames.map(name => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="schema-version"
                className="block mb-2 font-medium"
              >
                Schema Version
              </label>
              <select
                id="schema-version"
                value={selectedVersion ?? ''}
                onChange={handleVersionChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
              >
                {availableVersions.map(version => (
                  <option key={version} value={version}>
                    {version}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleDownload}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!selectedSchemaName || selectedVersion === null}
            >
              Download Test Data
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
