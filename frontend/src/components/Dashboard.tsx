import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';
import type { PLC } from '../api';
import PLCCard from './PLCCard';
import AddPLCModal from './AddPLCModal';
import { usePLCWebsocket } from '../hooks/useWebsocket';
import { Plus } from 'lucide-react';

const Dashboard: React.FC = () => {
  const [plcs, setPlcs] = useState<PLC[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Pobieranie początkowych danych
  const fetchPlcs = async () => {
    try {
      const response = await api.get('/plcs');
      setPlcs(response.data);
    } catch (err) {
      console.error("Błąd pobierania PLC:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlcs();
  }, []);

  // Callback do aktualizacji stanu przez WebSocket
  const handlePLCUpdate = useCallback((updatedPLC: PLC) => {
    setPlcs(prev => prev.map(p => p.id === updatedPLC.id ? updatedPLC : p));
  }, []);

  usePLCWebsocket(handlePLCUpdate);

  const handleDelete = async (id: string) => {
    if (window.confirm('Czy na pewno chcesz usunąć ten sterownik?')) {
      try {
        await api.delete(`/plcs/${id}`);
        setPlcs(prev => prev.filter(p => p.id !== id));
      } catch {
        alert('Błąd podczas usuwania');
      }
    }
  };

  if (loading) return <div className="text-center mt-10">Ładowanie konfiguracji...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800">Twoje Sterowniki PLC</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition shadow-sm font-semibold"
        >
          <Plus size={20} />
          Dodaj PLC
        </button>
      </div>

      <AddPLCModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchPlcs} 
      />

      {plcs.length === 0 ? (
        <div className="bg-white p-12 rounded-xl shadow-inner text-center border-2 border-dashed border-gray-200">
          <p className="text-gray-400">Brak skonfigurowanych sterowników.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plcs.map(plc => (
            <PLCCard key={plc.id} plc={plc} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
