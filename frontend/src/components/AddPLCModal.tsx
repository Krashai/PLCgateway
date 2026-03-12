import React, { useState } from 'react';
import { X, Plus, Trash2, Upload, AlertCircle } from 'lucide-react';
import { createPLC, Tag } from '../api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddPLCModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [ip, setIp] = useState('');
  const [type, setType] = useState('S7-1200');
  const [rack, setRack] = useState(0);
  const [slot, setSlot] = useState(1);
  const [tags, setTags] = useState<Tag[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const addTag = () => {
    setTags([...tags, { name: '', db: 1, offset: 0, type: 'REAL' }]);
  };

  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const updateTag = (index: number, field: keyof Tag, value: any) => {
    const newTags = [...tags];
    newTags[index] = { ...newTags[index], [field]: value };
    setTags(newTags);
  };

  const handleCsvImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const rows = text.split('\n').filter(row => row.trim() !== '');
      // skip header
      const dataRows = rows.slice(1);
      
      const newTags: Tag[] = [];
      const currentTagNames = new Set(tags.map(t => t.name));

      for (const row of dataRows) {
        const [tagName, db, offset, type] = row.split(',').map(s => s.trim());
        if (!tagName || isNaN(parseInt(db)) || isNaN(parseInt(offset)) || !type) continue;
        
        if (currentTagNames.has(tagName)) {
           setError(`Duplikat tagu: ${tagName}`);
           return;
        }
        currentTagNames.add(tagName);
        newTags.push({
          name: tagName,
          db: parseInt(db),
          offset: parseInt(offset),
          type: type as any
        });
      }
      setTags([...tags, ...newTags]);
      setError('');
    };
    reader.readAsText(file);
    // Reset file input value to allow importing the same file again if needed
    e.target.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!id || !name || !ip) {
      setError('Wypełnij pola ID, Nazwa i IP.');
      setLoading(false);
      return;
    }

    try {
      await createPLC({ id, name, ip, type, rack, slot, tags });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Błąd zapisu sterownika');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Plus className="text-blue-600" />
            Dodaj Nowy Sterownik PLC
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition text-gray-500">
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 flex items-start gap-3 rounded">
              <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Basic Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">ID Sterownika</label>
              <input
                type="text"
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="np. PLC_01"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Nazwa</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="np. Pakowarka"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Adres IP</label>
              <input
                type="text"
                value={ip}
                onChange={(e) => setIp(e.target.value)}
                placeholder="192.168.0.1"
                className="w-full px-4 py-2 border rounded-lg font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Typ Sterownika</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              >
                <option value="S7-1200">S7-1200</option>
                <option value="S7-1500">S7-1500</option>
                <option value="S7-300">S7-300</option>
                <option value="S7-400">S7-400</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Rack</label>
              <input
                type="number"
                value={rack}
                onChange={(e) => setRack(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Slot</label>
              <input
                type="number"
                value={slot}
                onChange={(e) => setSlot(parseInt(e.target.value) || 1)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>
          </div>

          {/* Tags Section */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-700">Tagi i Zmienne</h3>
              <div className="flex gap-2">
                <label className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-lg flex items-center gap-2 transition cursor-pointer text-sm shadow-sm font-semibold">
                  <Upload size={16} />
                  Importuj CSV
                  <input type="file" accept=".csv" onChange={handleCsvImport} className="hidden" />
                </label>
                <button
                  type="button"
                  onClick={addTag}
                  className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg flex items-center gap-2 transition text-sm shadow-sm font-semibold"
                >
                  <Plus size={16} />
                  Dodaj Tag
                </button>
              </div>
            </div>

            {tags.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-8 text-center border border-dashed text-gray-400">
                Brak zdefiniowanych tagów. Dodaj nowy lub zaimportuj z pliku CSV.
              </div>
            ) : (
              <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2">
                <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-gray-400 uppercase px-2">
                  <div className="col-span-4">Nazwa Tagu</div>
                  <div className="col-span-2">DB</div>
                  <div className="col-span-2">Offset</div>
                  <div className="col-span-3">Typ Danych</div>
                  <div className="col-span-1 text-right">Akcja</div>
                </div>
                {tags.map((tag, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 p-2 bg-gray-50 rounded-lg border border-gray-100 items-center">
                    <div className="col-span-4">
                      <input
                        type="text"
                        value={tag.name}
                        onChange={(e) => updateTag(index, 'name', e.target.value)}
                        placeholder="np. Temperatura"
                        className="w-full px-3 py-1.5 text-sm border rounded outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        value={tag.db}
                        onChange={(e) => updateTag(index, 'db', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-1.5 text-sm border rounded outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        value={tag.offset}
                        onChange={(e) => updateTag(index, 'offset', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-1.5 text-sm border rounded outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="col-span-3">
                      <select
                        value={tag.type}
                        onChange={(e) => updateTag(index, 'type', e.target.value)}
                        className="w-full px-3 py-1.5 text-sm border rounded outline-none focus:border-blue-500"
                      >
                        <option value="REAL">REAL</option>
                        <option value="INT">INT</option>
                        <option value="BOOL">BOOL</option>
                        <option value="DINT">DINT</option>
                      </select>
                    </div>
                    <div className="col-span-1 text-right">
                      <button
                        type="button"
                        onClick={() => removeTag(index)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-full transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3 rounded-b-xl">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition font-semibold"
          >
            Anuluj
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition font-semibold shadow-md"
          >
            {loading ? 'Zapisywanie...' : 'Zapisz Sterownik'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddPLCModal;
