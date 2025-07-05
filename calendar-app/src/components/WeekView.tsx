import React, { useRef, useEffect } from 'react';
import { format, startOfWeek, addDays, isSameDay, parseISO, isToday } from 'date-fns';
import { Appointment } from '../types/appointment';

interface WeekViewProps {
  date: Date;
  appointments: Appointment[];
  onTimeSlotClick: (date: Date, time: string) => void;
  onAppointmentClick: (appointment: Appointment) => void;
}

const WeekView: React.FC<WeekViewProps> = ({
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
      const scrollPosition = Math.max(0, (currentHour - 2) * 60);
      scrollContainerRef.current.scrollTop = scrollPosition;
    }
  }, []);

  // Generate week days
  const weekStart = startOfWeek(date);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Generate hour slots (6 AM to 10 PM)
  const hours = Array.from({ length: 17 }, (_, i) => i + 6);

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

  const handleTimeSlotDoubleClick = (dayDate: Date, hour: number, minute: number = 0) => {
    const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    onTimeSlotClick(dayDate, timeString);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Days header */}
      <div className="week-header">
        <div className="time-column"></div>
        {weekDays.map((day) => (
          <div key={day.toString()} className="day-header">
            <div className={`day-name ${isToday(day) ? 'today' : ''}`}>
              {format(day, 'EEE')}
            </div>
            <div className={`day-number ${isToday(day) ? 'today' : ''}`}>
              {format(day, 'd')}
            </div>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="week-grid">
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

        {/* Days columns */}
        <div style={{ flex: 1, display: 'flex' }}>
          {weekDays.map((day, dayIndex) => {
            const dayAppointments = appointments.filter(apt =>
              isSameDay(parseISO(apt.scheduled_start), day)
            );

            return (
              <div key={day.toString()} className="day-column">
                <div
                  ref={dayIndex === 0 ? scrollContainerRef : null}
                  className="scrollable-area"
                >
                  <div style={{ position: 'relative', height: `${hours.length * 60}px` }}>
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
                            onDoubleClick={() => handleTimeSlotDoubleClick(day, hour, 0)}
                          />
                          <div
                            className="time-slot-clickable"
                            style={{ top: '30px' }}
                            onDoubleClick={() => handleTimeSlotDoubleClick(day, hour, 30)}
                          />
                        </div>
                      </div>
                    ))}

                    {/* Current time indicator */}
                    {isToday(day) && (
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
                            height: `${Math.max(position.height, 25)}px`,
                            minHeight: '25px',
                            left: '2px',
                            right: '2px',
                            margin: '0 2px',
                            borderRadius: '4px',
                            borderLeftWidth: '3px',
                            padding: '4px',
                            fontSize: '0.75rem',
                          }}
                          onClick={() => onAppointmentClick(appointment)}
                        >
                          <div className="appointment-customer">
                            {appointment.customer_first_name} {appointment.customer_last_name}
                          </div>
                          <div className="appointment-time">
                            {format(parseISO(appointment.scheduled_start), 'h:mm a')}
                          </div>
                          {position.height >= 45 && (
                            <div className="appointment-service">
                              {appointment.services.split(',')[0]}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WeekView;