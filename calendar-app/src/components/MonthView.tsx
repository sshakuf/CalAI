import React from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  addDays, 
  isSameMonth, 
  isSameDay,
  isToday,
  parseISO
} from 'date-fns';
import { Appointment } from '../types/appointment';

interface MonthViewProps {
  date: Date;
  appointments: Appointment[];
  onDateClick: (date: Date) => void;
  onAppointmentClick: (appointment: Appointment) => void;
}

const MonthView: React.FC<MonthViewProps> = ({
  date,
  appointments,
  onDateClick,
  onAppointmentClick,
}) => {
  // Get the calendar grid
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  // Generate all days for the calendar grid
  const calendarDays: Date[] = [];
  let currentDate = startDate;
  
  while (currentDate <= endDate) {
    calendarDays.push(new Date(currentDate));
    currentDate = addDays(currentDate, 1);
  }

  // Group days into weeks
  const weeks: Date[][] = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }

  // Get appointments for a specific day
  const getAppointmentsForDay = (day: Date) => {
    return appointments.filter(apt => isSameDay(parseISO(apt.scheduled_start), day));
  };

  // Calculate the maximum appointments in any day of a week
  const getMaxAppointmentsInWeek = (week: Date[]) => {
    return Math.max(...week.map(day => getAppointmentsForDay(day).length));
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="month-view">
      {/* Days of week header */}
      <div className="month-header">
        {dayNames.map((dayName) => (
          <div key={dayName} className="month-day-name">
            {dayName}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="month-grid">
        {weeks.map((week, weekIndex) => {
          const maxAppointments = getMaxAppointmentsInWeek(week);
          // Calculate height based on appointments, minimum 120px, add 24px per appointment
          const weekHeight = Math.max(120, 80 + maxAppointments * 24);

          return (
            <div key={weekIndex} className="month-week" style={{ minHeight: `${weekHeight}px` }}>
              {week.map((day) => {
                const dayAppointments = getAppointmentsForDay(day);
                const isCurrentMonth = isSameMonth(day, date);
                const isCurrentDay = isToday(day);

                return (
                  <div
                    key={day.toString()}
                    className={`month-day ${!isCurrentMonth ? 'other-month' : ''}`}
                    onClick={() => onDateClick(day)}
                  >
                    {/* Day number */}
                    <div className="month-day-header">
                      <span
                        className={`month-day-number ${
                          isCurrentDay
                            ? 'today'
                            : isCurrentMonth
                            ? ''
                            : 'other-month'
                        }`}
                      >
                        {format(day, 'd')}
                      </span>
                      {dayAppointments.length > 0 && (
                        <span className="appointment-count">
                          {dayAppointments.length}
                        </span>
                      )}
                    </div>

                    {/* Appointments list */}
                    <div className="month-appointments">
                      {dayAppointments.slice(0, 4).map((appointment) => {
                        return (
                          <div
                            key={appointment.id}
                            className={`month-appointment ${appointment.status}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              onAppointmentClick(appointment);
                            }}
                          >
                            <div className="appointment-time-customer">
                              {format(parseISO(appointment.scheduled_start), 'h:mm a')} {appointment.customer_first_name}
                            </div>
                            <div className="appointment-service-name">
                              {appointment.services.split(',')[0]}
                            </div>
                          </div>
                        );
                      })}
                      
                      {/* Show "more" indicator if there are more than 4 appointments */}
                      {dayAppointments.length > 4 && (
                        <div className="more-appointments">
                          +{dayAppointments.length - 4} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MonthView;