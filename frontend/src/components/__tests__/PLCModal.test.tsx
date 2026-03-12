import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import PLCModal from '../PLCModal';
import { PLC } from '../../api';

// Mockowanie API
vi.mock('../../api', () => ({
  default: {
    post: vi.fn(() => Promise.resolve({ data: { message: 'OK' } })),
    put: vi.fn(() => Promise.resolve({ data: { message: 'OK' } })),
  },
  createPLC: vi.fn(() => Promise.resolve({ data: { message: 'OK' } })),
  updatePLC: vi.fn(() => Promise.resolve({ data: { message: 'OK' } })),
}));

describe('PLCModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
  };

  const mockPLC: PLC = {
    id: 'PLC_01',
    name: 'Test PLC',
    ip: '192.168.0.10',
    type: 'S7-1200',
    rack: 0,
    slot: 1,
    tags: [],
    online: true
  };

  it('renders correctly in Create mode', () => {
    render(<PLCModal {...defaultProps} />);
    expect(screen.getByText('Dodaj Nowy Sterownik PLC')).toBeInTheDocument();
    expect(screen.getByLabelText(/ID Sterownika/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/ID Sterownika/i)).not.toBeDisabled();
  });

  it('renders correctly in Edit mode', () => {
    render(<PLCModal {...defaultProps} initialData={mockPLC} />);
    expect(screen.getByText('Edytuj Sterownik PLC')).toBeInTheDocument();
    expect(screen.getByDisplayValue('PLC_01')).toBeInTheDocument();
    expect(screen.getByLabelText(/ID Sterownika/i)).toBeDisabled();
  });

  it('validates required fields before submission', async () => {
    render(<PLCModal {...defaultProps} />);
    const submitBtn = screen.getByText('Zapisz Sterownik');
    
    fireEvent.click(submitBtn);
    
    expect(await screen.findByText('Wypełnij pola ID, Nazwa i IP.')).toBeInTheDocument();
  });

  it('allows adding tags manually', () => {
    render(<PLCModal {...defaultProps} />);
    const addTagBtn = screen.getByText('Dodaj Tag');
    
    fireEvent.click(addTagBtn);
    
    // Sprawdzamy czy pojawił się input dla nazwy tagu
    expect(screen.getByPlaceholderText('np. Temperatura')).toBeInTheDocument();
  });

  it('handles CSV import correctly', async () => {
    render(<PLCModal {...defaultProps} />);
    const fileInput = screen.getByLabelText(/Importuj CSV/i);
    
    const csvContent = 'name,db,offset,type\nTag1,1,0,REAL\nTag2,1,4,INT';
    const file = new File([csvContent], 'tags.csv', { type: 'text/csv' });
    
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    // Czekamy na przetworzenie FileReader
    await waitFor(() => {
      expect(screen.getByDisplayValue('Tag1')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Tag2')).toBeInTheDocument();
    });
    
    expect(screen.getByText(/Pomyślnie zaimportowano 2 tagów/i)).toBeInTheDocument();
  });
});
