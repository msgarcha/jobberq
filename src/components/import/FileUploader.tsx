import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileText, X } from "lucide-react";
import type { ImportDataType } from "@/lib/columnMappings";

interface Props {
  dataType: ImportDataType;
  onDataTypeChange: (t: ImportDataType) => void;
  onFileLoaded: (file: File, text: string) => void;
}

const dataTypes: { value: ImportDataType; label: string }[] = [
  { value: 'clients', label: 'Clients' },
  { value: 'services', label: 'Services' },
  { value: 'jobs', label: 'Jobs' },
  { value: 'invoices', label: 'Invoices' },
];

export function FileUploader({ dataType, onDataTypeChange, onFileLoaded }: Props) {
  const [dragging, setDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please upload a .csv file');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError('File must be under 20MB');
      return;
    }
    setSelectedFile(file);
    const text = await file.text();
    onFileLoaded(file, text);
  }, [onFileLoaded]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-display font-semibold">Upload your CSV</h2>
        <p className="text-sm text-muted-foreground mt-1">Select what you're importing, then upload the file.</p>
      </div>

      <div className="flex gap-2">
        {dataTypes.map(dt => (
          <Button
            key={dt.value}
            variant={dataType === dt.value ? 'default' : 'outline'}
            size="sm"
            className="rounded-full"
            onClick={() => onDataTypeChange(dt.value)}
          >
            {dt.label}
          </Button>
        ))}
      </div>

      <div
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          dragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/20 hover:border-primary/40'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        {selectedFile ? (
          <div className="flex items-center justify-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            <div className="text-left">
              <p className="font-medium text-sm">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024).toFixed(1)} KB</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <Upload className="h-10 w-10 mx-auto text-muted-foreground/40" />
            <div>
              <p className="font-medium text-sm">Drop your CSV file here</p>
              <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
              Choose File
            </Button>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="absolute inset-0 opacity-0 cursor-pointer"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
