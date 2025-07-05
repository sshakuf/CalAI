import React, { useState, useEffect } from 'react';
import { format, parseISO, addMinutes } from 'date-fns';
import { X } from 'lucide-react';
import { Appointment } from '../types/appointment';

interface MeetingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (appointment: any) => void;
  selectedDate?: Date | null;
  selectedTime?: string | null;
  editingAppointment?: Appointment | null;
}

const MeetingDialog: React.FC<MeetingDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  selectedDate,
  selectedTime,
  editingAppointment,
}) => {
  const [formData, setFormData] = useState({
    customer_first_name: '',
    customer_last_name: '',
    customer_phone: '',
    staff_name: '',
    service_names: '',
    scheduled_start: '',
    scheduled_end: '',
    total_amount: 0,
    customer_notes: '',
    staff_notes: '',
    status: 'scheduled' as const,
  });

  useEffect(() => {
    if (editingAppointment) {
      // Populate form with existing appointment data
      setFormData({
        customer_first_name: editingAppointment.customer_first_name,
        customer_last_name: editingAppointment.customer_last_name,
        customer_phone: editingAppointment.customer_phone,
        staff_name: editingAppointment.staff_display_name,
        service_names: editingAppointment.services,
        scheduled_start: editingAppointment.scheduled_start,
        scheduled_end: editingAppointment.scheduled_end,
        total_amount: editingAppointment.total_amount,
        customer_notes: editingAppointment.customer_notes || '',
        staff_notes: editingAppointment.staff_notes || '',
        status: editingAppointment.status,
      });
    } else if (selectedDate && selectedTime) {
      // Initialize form for new appointment
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const startDateTime = new Date(selectedDate);
      startDateTime.setHours(hours, minutes, 0, 0);
      const endDateTime = addMinutes(startDateTime, 60);

      setFormData({
        customer_first_name: '',
        customer_last_name: '',
        customer_phone: '',
        staff_name: '',
        service_names: '',
        scheduled_start: startDateTime.toISOString(),
        scheduled_end: endDateTime.toISOString(),
        total_amount: 0,
        customer_notes: '',
        staff_notes: '',
        status: 'scheduled',
      });
    }
  }, [editingAppointment, selectedDate, selectedTime, isOpen]);

  const handleSave = () => {
    onSave(formData);
  };

  const isFormValid = () => {
    return (
      formData.customer_first_name.trim() &&
      formData.customer_last_name.trim() &&
      formData.customer_phone.trim() &&
      formData.staff_name.trim() &&
      formData.service_names.trim()
    );
  };

  if (!isOpen) return null;

  const dialogStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '1rem',
  };

  const contentStyle: React.CSSProperties = {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
    maxWidth: '600px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1.5rem',
    borderBottom: '1px solid #e5e7eb',
  };

  const formStyle: React.CSSProperties = {
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
  };

  const labelStyle: React.CSSProperties = {
    fontWeight: '500',
    marginBottom: '0.25rem',
    display: 'block',
  };

  const buttonStyle: React.CSSProperties = {
    padding: '0.75rem 1.5rem',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  };

  const primaryButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: '#2563eb',
    color: 'white',
  };

  const secondaryButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: '#f3f4f6',
    color: '#374151',
  };

  const footerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.75rem',
    padding: '1.5rem',
    borderTop: '1px solid #e5e7eb',
  };

  return (
    <div style={dialogStyle}>
      <div style={contentStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>
            {editingAppointment ? 'Edit Appointment' : 'New Appointment'}
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <div style={formStyle}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>First Name *</label>
              <input
                type="text"
                value={formData.customer_first_name}
                onChange={(e) => setFormData(prev => ({ ...prev, customer_first_name: e.target.value }))}
                style={inputStyle}
                required
              />
            </div>
            <div>
              <label style={labelStyle}>Last Name *</label>
              <input
                type="text"
                value={formData.customer_last_name}
                onChange={(e) => setFormData(prev => ({ ...prev, customer_last_name: e.target.value }))}
                style={inputStyle}
                required
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Phone Number *</label>
            <input
              type="tel"
              value={formData.customer_phone}
              onChange={(e) => setFormData(prev => ({ ...prev, customer_phone: e.target.value }))}
              style={inputStyle}
              required
            />
          </div>

          <div>
            <label style={labelStyle}>Staff Member *</label>
            <input
              type="text"
              value={formData.staff_name}
              onChange={(e) => setFormData(prev => ({ ...prev, staff_name: e.target.value }))}
              style={inputStyle}
              placeholder="e.g., Maria G."
              required
            />
          </div>

          <div>
            <label style={labelStyle}>Services *</label>
            <input
              type="text"
              value={formData.service_names}
              onChange={(e) => setFormData(prev => ({ ...prev, service_names: e.target.value }))}
              style={inputStyle}
              placeholder="e.g., Gel Manicure, Nail Art"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Start Time</label>
              <input
                type="datetime-local"
                value={formData.scheduled_start ? format(parseISO(formData.scheduled_start), "yyyy-MM-dd'T'HH:mm") : ''}
                onChange={(e) => {
                  const newStart = new Date(e.target.value).toISOString();
                  const newEnd = addMinutes(new Date(e.target.value), 60).toISOString();
                  setFormData(prev => ({ ...prev, scheduled_start: newStart, scheduled_end: newEnd }));
                }}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>End Time</label>
              <input
                type="datetime-local"
                value={formData.scheduled_end ? format(parseISO(formData.scheduled_end), "yyyy-MM-dd'T'HH:mm") : ''}
                onChange={(e) => setFormData(prev => ({ ...prev, scheduled_end: new Date(e.target.value).toISOString() }))}
                style={inputStyle}
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Total Amount ($)</label>
            <input
              type="number"
              value={formData.total_amount}
              onChange={(e) => setFormData(prev => ({ ...prev, total_amount: parseFloat(e.target.value) || 0 }))}
              style={inputStyle}
              min="0"
              step="0.01"
            />
          </div>

          <div>
            <label style={labelStyle}>Customer Notes</label>
            <textarea
              value={formData.customer_notes}
              onChange={(e) => setFormData(prev => ({ ...prev, customer_notes: e.target.value }))}
              style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
              placeholder="Special requests, allergies, preferences..."
            />
          </div>

          <div>
            <label style={labelStyle}>Staff Notes</label>
            <textarea
              value={formData.staff_notes}
              onChange={(e) => setFormData(prev => ({ ...prev, staff_notes: e.target.value }))}
              style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
              placeholder="Internal notes..."
            />
          </div>

          {editingAppointment && (
            <div>
              <label style={labelStyle}>Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                style={inputStyle}
              >
                <option value="scheduled">Scheduled</option>
                <option value="confirmed">Confirmed</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="no_show">No Show</option>
              </select>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={footerStyle}>
          <button onClick={onClose} style={secondaryButtonStyle}>
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!isFormValid()}
            style={{
              ...primaryButtonStyle,
              opacity: isFormValid() ? 1 : 0.5,
              cursor: isFormValid() ? 'pointer' : 'not-allowed',
            }}
          >
            {editingAppointment ? 'Update Appointment' : 'Create Appointment'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MeetingDialog;