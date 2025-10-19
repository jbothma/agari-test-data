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
