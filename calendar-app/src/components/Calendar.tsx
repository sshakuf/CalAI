import React, { useState, useEffect } from 'react';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Users } from 'lucide-react';
import DayView from './DayView';
import WeekView from './WeekView';
import MonthView from './MonthView';
import MeetingDialog from './MeetingDialog';
import { Appointment } from '../types/appointment';
import './Calendar.css';

type ViewType = 'day' | 'week' | 'month';

const Calendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewType>('week');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(false);

  // Mock data for now - will be replaced with API calls
  useEffect(() => {
    // Simulate loading appointments
    setLoading(true);
    const mockAppointments: Appointment[] = [
      {
        id: '1',
        customer_first_name: 'Sarah',
        customer_last_name: 'Johnson',
        customer_phone: '+1234567890',
        staff_first_name: 'Maria',
        staff_last_name: 'Garcia',
        staff_display_name: 'Maria G.',
        scheduled_start: '2025-07-04T10:00:00Z',
        scheduled_end: '2025-07-04T11:30:00Z',
        status: 'confirmed',
        services: 'Gel Manicure, Nail Art',
        total_amount: 85.00,
        customer_notes: 'Prefers red colors'
      },
      {
        id: '2',
        customer_first_name: 'Emma',
        customer_last_name: 'Wilson',
        customer_phone: '+1234567891',
        staff_first_name: 'Lisa',
        staff_last_name: 'Chen',
        staff_display_name: 'Lisa C.',
        scheduled_start: '2025-07-04T14:00:00Z',
        scheduled_end: '2025-07-04T15:00:00Z',
        status: 'scheduled',
        services: 'Classic Pedicure',
        total_amount: 45.00
      },
      {
        id: '3',
        customer_first_name: 'Jessica',
        customer_last_name: 'Brown',
        customer_phone: '+1234567892',
        staff_first_name: 'Maria',
        staff_last_name: 'Garcia',
        staff_display_name: 'Maria G.',
        scheduled_start: '2025-07-05T09:00:00Z',
        scheduled_end: '2025-07-05T10:30:00Z',
        status: 'confirmed',
        services: 'Acrylic Extensions',
        total_amount: 120.00
      }
    ];
    setTimeout(() => {
      setAppointments(mockAppointments);
      setLoading(false);
    }, 500);
  }, [currentDate, view]);

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    switch (view) {
      case 'day':
        newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
      case 'week':
        newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'month':
        newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
    }
    setCurrentDate(newDate);
  };

  const handleTimeSlotClick = (date: Date, time: string) => {
    setSelectedDate(date);
    setSelectedTime(time);
    setEditingAppointment(null);
    setIsDialogOpen(true);
  };

  const handleAppointmentClick = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setSelectedDate(null);
    setSelectedTime(null);
    setIsDialogOpen(true);
  };

  const handleSaveAppointment = (appointmentData: any) => {
    if (editingAppointment) {
      // Update existing appointment
      const updatedAppointment: Appointment = {
        ...editingAppointment,
        customer_first_name: appointmentData.customer_first_name || editingAppointment.customer_first_name,
        customer_last_name: appointmentData.customer_last_name || editingAppointment.customer_last_name,
        customer_phone: appointmentData.customer_phone || editingAppointment.customer_phone,
        staff_display_name: appointmentData.staff_name || editingAppointment.staff_display_name,
        services: appointmentData.service_names || editingAppointment.services,
        scheduled_start: appointmentData.scheduled_start || editingAppointment.scheduled_start,
        scheduled_end: appointmentData.scheduled_end || editingAppointment.scheduled_end,
        total_amount: appointmentData.total_amount || editingAppointment.total_amount,
        customer_notes: appointmentData.customer_notes,
        staff_notes: appointmentData.staff_notes,
        status: appointmentData.status || editingAppointment.status,
      };
      setAppointments(prev => 
        prev.map(apt => 
          apt.id === editingAppointment.id ? updatedAppointment : apt
        )
      );
    } else {
      // Create new appointment
      const newAppointment: Appointment = {
        id: Date.now().toString(),
        customer_first_name: appointmentData.customer_first_name || 'New',
        customer_last_name: appointmentData.customer_last_name || 'Customer',
        customer_phone: appointmentData.customer_phone || '+1234567890',
        staff_first_name: 'Staff',
        staff_last_name: 'Member',
        staff_display_name: appointmentData.staff_name || 'Staff M.',
        status: 'scheduled',
        services: appointmentData.service_names || 'New Service',
        total_amount: appointmentData.total_amount || 0,
        scheduled_start: appointmentData.scheduled_start,
        scheduled_end: appointmentData.scheduled_end,
        customer_notes: appointmentData.customer_notes,
        staff_notes: appointmentData.staff_notes
      };
      setAppointments(prev => [...prev, newAppointment]);
    }
    setIsDialogOpen(false);
  };

  const getDateRangeText = () => {
    switch (view) {
      case 'day':
        return format(currentDate, 'EEEE, MMMM d, yyyy');
      case 'week':
        const weekStart = startOfWeek(currentDate);
        const weekEnd = endOfWeek(currentDate);
        return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
      case 'month':
        return format(currentDate, 'MMMM yyyy');
      default:
        return '';
    }
  };

  return (
    <div className="calendar-container">
      {/* Header */}
      <div className="calendar-header">
        <div className="calendar-header-content">
          {/* Date Navigation */}
          <div className="calendar-navigation">
            <button
              onClick={() => navigateDate('prev')}
              className="nav-button"
            >
              <ChevronLeft size={20} />
            </button>
            
            <h1 className="calendar-title">
              {getDateRangeText()}
            </h1>
            
            <button
              onClick={() => navigateDate('next')}
              className="nav-button"
            >
              <ChevronRight size={20} />
            </button>
            
            <button
              onClick={() => setCurrentDate(new Date())}
              className="today-button"
            >
              Today
            </button>
          </div>

          {/* View Toggle */}
          <div className="view-toggle">
            {(['day', 'week', 'month'] as ViewType[]).map((viewType) => {
              const Icon = viewType === 'day' ? Clock : viewType === 'week' ? CalendarIcon : Users;
              return (
                <button
                  key={viewType}
                  onClick={() => setView(viewType)}
                  className={`view-button ${view === viewType ? 'active' : ''}`}
                >
                  <Icon size={16} />
                  <span style={{ textTransform: 'capitalize' }}>{viewType}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Calendar Content */}
      <div className="calendar-content">
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
          </div>
        ) : (
          <>
            {view === 'day' && (
              <DayView
                date={currentDate}
                appointments={appointments}
                onTimeSlotClick={handleTimeSlotClick}
                onAppointmentClick={handleAppointmentClick}
              />
            )}
            {view === 'week' && (
              <WeekView
                date={currentDate}
                appointments={appointments}
                onTimeSlotClick={handleTimeSlotClick}
                onAppointmentClick={handleAppointmentClick}
              />
            )}
            {view === 'month' && (
              <MonthView
                date={currentDate}
                appointments={appointments}
                onDateClick={(date) => {
                  setCurrentDate(date);
                  setView('day');
                }}
                onAppointmentClick={handleAppointmentClick}
              />
            )}
          </>
        )}
      </div>

      {/* Meeting Dialog */}
      {isDialogOpen && (
        <MeetingDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onSave={handleSaveAppointment}
          selectedDate={selectedDate}
          selectedTime={selectedTime}
          editingAppointment={editingAppointment}
        />
      )}
    </div>
  );
};

export default Calendar;