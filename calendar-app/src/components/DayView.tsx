import React, { useRef, useEffect } from 'react';
import { format, isSameDay, parseISO } from 'date-fns';
import { Appointment } from '../types/appointment';

interface DayViewProps {
  date: Date;
  appointments: Appointment[];
  onTimeSlotClick: (date: Date, time: string) => void;
  onAppointmentClick: (appointment: Appointment) => void;
}

const DayView: React.FC<DayViewProps> = ({
  date,
  appointments,
  onTimeSlotClick,
  onAppointmentClick,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to current time on mount
  useEffect(() => {
    if (scrollContainerRef.current) {
      const currentHour = new Date().getHours();
      const scrollPosition = Math.max(0, (currentHour - 2) * 60); // 60px per hour, start 2 hours before
      scrollContainerRef.current.scrollTop = scrollPosition;
    }
  }, []);

  // Generate hour slots (6 AM to 10 PM)
  const hours = Array.from({ length: 17 }, (_, i) => i + 6);

  // Filter appointments for the current day
  const dayAppointments = appointments.filter(apt =>
    isSameDay(parseISO(apt.scheduled_start), date)
  );

  const getAppointmentPosition = (appointment: Appointment) => {
    const startTime = parseISO(appointment.scheduled_start);
    const endTime = parseISO(appointment.scheduled_end);
    const startHour = startTime.getHours();
    const startMinute = startTime.getMinutes();
    const endHour = endTime.getHours();
    const endMinute = endTime.getMinutes();

    const startPosition = (startHour - 6) * 60 + startMinute;
    const duration = (endHour - startHour) * 60 + (endMinute - startMinute);

    return {
      top: startPosition,
      height: duration,
    };
  };

  const handleTimeSlotDoubleClick = (hour: number, minute: number = 0) => {
    const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    onTimeSlotClick(date, timeString);
  };

  return (
    <div className="day-view">
      {/* Time column */}
      <div className="time-column">
        {hours.map((hour) => (
          <div key={hour} className="time-slot">
            <span className="time-label">
              {format(new Date().setHours(hour, 0), 'h a')}
            </span>
          </div>
        ))}
      </div>

      {/* Main calendar area */}
      <div className="calendar-grid">
        <div
          ref={scrollContainerRef}
          className="scrollable-area"
        >
          <div className="hour-grid" style={{ height: `${hours.length * 60}px` }}>
            {/* Hour grid lines */}
            {hours.map((hour) => (
              <div key={hour} className="hour-line" style={{ top: `${(hour - 6) * 60}px` }}>
                <div style={{ height: '60px', position: 'relative' }}>
                  {/* 30-minute line */}
                  <div className="half-hour-line"></div>
                  
                  {/* Clickable areas for 30-minute slots */}
                  <div
                    className="time-slot-clickable"
                    style={{ top: 0 }}
                    onDoubleClick={() => handleTimeSlotDoubleClick(hour, 0)}
                  />
                  <div
                    className="time-slot-clickable"
                    style={{ top: '30px' }}
                    onDoubleClick={() => handleTimeSlotDoubleClick(hour, 30)}
                  />
                </div>
              </div>
            ))}

            {/* Current time indicator */}
            {isSameDay(date, new Date()) && (
              <div
                className="current-time-indicator"
                style={{
                  top: `${(new Date().getHours() - 6) * 60 + new Date().getMinutes()}px`,
                }}
              >
                <div className="current-time-dot"></div>
              </div>
            )}

            {/* Appointments */}
            {dayAppointments.map((appointment) => {
              const position = getAppointmentPosition(appointment);

              return (
                <div
                  key={appointment.id}
                  className={`appointment-block ${appointment.status}`}
                  style={{
                    top: `${position.top}px`,
                    height: `${Math.max(position.height, 30)}px`,
                    minHeight: '30px',
                  }}
                  onClick={() => onAppointmentClick(appointment)}
                >
                  <div className="appointment-customer">
                    {appointment.customer_first_name} {appointment.customer_last_name}
                  </div>
                  <div className="appointment-time">
                    {format(parseISO(appointment.scheduled_start), 'h:mm a')} - {format(parseISO(appointment.scheduled_end), 'h:mm a')}
                  </div>
                  <div className="appointment-service">
                    {appointment.services}
                  </div>
                  <div className="appointment-staff">
                    with {appointment.staff_display_name}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DayView;