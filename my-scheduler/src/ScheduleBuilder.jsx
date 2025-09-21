import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, Edit3, Trash2, Save, X, ChevronLeft, ChevronRight } from 'lucide-react';

const ScheduleBuilder = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState('week'); // month, week, day
    const [events, setEvents] = useState([]);
    const [showEventModal, setShowEventModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [editingEvent, setEditingEvent] = useState(null);
    const [eventForm, setEventForm] = useState({
        title: '',
        description: '',
        date: '',
        startTime: '',
        endTime: '',
        description: '',
        color: '#3b82f6'
    });

    //event colors
    const colors = [
        '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
        '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
    ];

    //get event from storage
    useEffect(() => {
        const savedEvents = localStorage.getItem('scheduleEvents');
        if (savedEvents) {setEvents(JSON.parse(savedEvents));}
    }, []);

    //save event to storage
    useEffect(() => {
        localStorage.setItem('scheduleEvents', JSON.stringify(events));
    }, [events]);

    //get formatted date
    const formatDate = (date) => {
        return date.toISOString().split('T')[0];
    };

    //get formatted time
    const formatTime = (timeStr) => {
        const [hours, minutes] = timeStr.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    //get events for a date
    const getEventsForDate = (date) => {
        if (!date) return [];
        const dateStr = formatDate(date);
        return events.filter(event => event.date === dateStr)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));
    };

    //get how many days in one month
    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const days = [];
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }
        for (let day = 1; day <= daysInMonth; day++) {
          days.push(new Date(year, month, day));
        }
    
        return days;
    };

    //get days in a week
    const getWeekDays = (date) => {
        const startOfWeek = new Date(date);
        const day = startOfWeek.getDay();
        startOfWeek.setDate(date.getDate() - day);
    
        const days = [];
        for (let i = 0; i < 7; i++) {
            const weekDay = new Date(startOfWeek);
            weekDay.setDate(startOfWeek.getDate() + i);
            days.push(weekDay);
        }
        return days;
    };

    //makes time slots for each day
    const getTimeSlots = () => {
        const slots = [];
        for (let hour = 0; hour < 24; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                slots.push(timeStr);
            }
        }
        return slots;
    };

    //get current time rounded down to the nearest half hour
    const getNearestHalfHour = () => {
        const now = new Date();
        const minutes = now.getMinutes();

        const roundedMinutes = Math.round(minutes / 30) * 30;

        if (roundedMinutes === 60) {
            now.setHours(now.getHours() + 1);
            now.setMinutes(0, 0, 0);
        } else {
            now.setMinutes(roundedMinutes, 0, 0);
        }

        const hours = now.getHours().toString().padStart(2, "0");
        const mins = now.getMinutes().toString().padStart(2, "0");

        return `${hours}:${mins}`;
    };  
    
    //making new events or editing existing ones
    const openEventModal = (date = null, event = null) => {
        //getting start and end time based on current time
        const start = getNearestHalfHour();
        const [h,m] = start.split(':').map(Number);
        const endDate = new Date();
        endDate.setHours(h);
        endDate.setMinutes(m + 60);
        const end = `${endDate.getHours().toString().padStart(2, "0")}:${endDate.getMinutes().toString().padStart(2, "0")}`;

        //editing new or old event
        if (event) {
            setEditingEvent(event.id);
            setEventForm({
                title: event.title,
                date: event.date,
                startTime: event.startTime,
                endTime: event.endTime,
                description: event.description,
                color: event.color
            });
        } else {
            setEditingEvent(null);
            setEventForm({
                title: '',
                date: date ? formatDate(date) : formatDate(currentDate),
                startTime: start,
                endTime: end,
                description: '',
                color: '#3B82F6'
            });
        }
        setSelectedDate(date);
        setShowEventModal(true);
    };

    //clear event modual when closed
    const closeEventModal = () => {
        setShowEventModal(false);
        setEditingEvent(null);
        setEventForm({
            title: '',
            date: '',
            startTime: '',
            endTime: '',
            description: '',
            color: '#3B82F6'
        });
    };

    //saving event in calendar
    const saveEvent = () => {
        //checking required fields
        if (!eventForm.title || !eventForm.date || !eventForm.startTime || !eventForm.endTime) {
            alert('Please fill in all required fields');
            return;
        }
        if (eventForm.startTime >= eventForm.endTime) {
            alert('End time must be after start time');
            return;
        }

        //creating event data
        const eventData = {
            ...eventForm,
            id: editingEvent || Date.now().toString()
        };

        if (editingEvent) {
            setEvents(events.map(event => 
            event.id === editingEvent ? eventData : event
            ));
        } else {
            setEvents([...events, eventData]);
        }

        closeEventModal();
    };

    const deleteEvent = (eventId) => {
        setEvents(events.filter(event => event.id !== eventId));
    };

//creating navigation for calandar views
    const navigate = (direction) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            if (view === 'month') {
                newDate.setMonth(prev.getMonth() + direction);
            } else if (view === 'week') {
                newDate.setDate(prev.getDate() + (7 * direction));
            } else if (view === 'day') {
                newDate.setDate(prev.getDate() + direction);
            }
            return newDate;
        });
    }; 

    const getNavigationTitle = () => {
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        
        //months, weeks, days title formats
        if (view === 'month') {
            return `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
        } else if (view === 'week') {
            const weekDays = getWeekDays(currentDate);
            const start = weekDays[0];
            const end = weekDays[6];
            if (start.getMonth() === end.getMonth()) {
                return `${monthNames[start.getMonth()]} ${start.getDate()}-${end.getDate()}, ${start.getFullYear()}`;
            } else {
                return `${monthNames[start.getMonth()]} ${start.getDate()} - ${monthNames[end.getMonth()]} ${end.getDate()}, ${start.getFullYear()}`;
            }
        } else {
            return `${monthNames[currentDate.getMonth()]} ${currentDate.getDate()}, ${currentDate.getFullYear()}`;
        }
    };

    //create month view
    const renderMonthView = () => {
        const days = getDaysInMonth(currentDate);
        const today = new Date();
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        return (
            <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="grid grid-cols-7 gap-1 mb-2">
                    {dayNames.map(day => (
                        <div key={day} className="p-3 text-center font-semibold text-gray-700 text-sm">
                            {day}
                        </div>
                ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                    {days.map((day, index) => {
                        const dayEvents = day ? getEventsForDate(day) : [];
                        const isToday = day && formatDate(day) === formatDate(today);
                        
                        return (
                            <div
                                key={index}
                                className={`min-h-[120px] p-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors ${
                                    day ? 'bg-white' : 'bg-gray-50'
                                } ${isToday ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}
                                onClick={() => day && openEventModal(day)}
                            >
                                {day && (
                                <>
                                    <div className={`text-sm font-medium mb-1 ${
                                        isToday ? 'text-blue-600' : 'text-gray-900'
                                    }`}>
                                    {day.getDate()}
                                    </div>
                                    <div className="space-y-1">
                                        {dayEvents.slice(0, 3).map(event => (
                                            <div
                                                key={event.id}
                                                className="text-xs px-2 py-1 rounded text-white cursor-pointer truncate hover:opacity-80"
                                                style={{ backgroundColor: event.color }}
                                                onClick={(e) => {
                                                e.stopPropagation();
                                                openEventModal(day, event);
                                                }}
                                            >
                                                {formatTime(event.startTime)} - {event.title}
                                            </div>
                                        ))}
                                        {dayEvents.length > 3 && (
                                            <div className="text-xs text-gray-500 px-2">
                                                +{dayEvents.length - 3} more
                                            </div>
                                        )}
                                    </div>
                                </>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    //create event item view
    const calculateEventPosition = (event, timeSlots) => {
        const startIndex = timeSlots.findIndex(slot => slot >= event.startTime);
        const endIndex = timeSlots.findIndex(slot => slot >= event.endTime);
    
        const start = startIndex !== -1 ? startIndex : 0;
        const end = endIndex !== -1 ? endIndex : timeSlots.length;
        const duration = Math.max(1, end - start);
    
        return { start: start * 2, duration: duration * 2 }; // *2 because we show every 30 min slot
    };

    //create week view
    const renderWeekView = () => {
        const weekDays = getWeekDays(currentDate);
        const timeSlots = getTimeSlots();
        const today = new Date();
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        return (
            <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="grid grid-cols-8 gap-1 mb-4">
                    <div className="p-3"></div>
                    {weekDays.map((day, index) => {
                    const isToday = formatDate(day) === formatDate(today);
                    return (
                    <div
                        key={index}
                        className={`p-3 text-center border-b-2 ${
                            isToday ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                        }`}
                    >
                        <div className="text-sm font-medium text-gray-700">{dayNames[index].slice(0, 3)}</div>
                        <div className={`text-lg font-bold ${
                            isToday ? 'text-blue-600' : 'text-gray-900'
                        }`}>
                            {day.getDate()}
                        </div>
                    </div>
                    );
                })}
                </div>

                <div className="max-h-96 overflow-y-auto relative">
                    <div className="grid grid-cols-8 gap-1">
                        {timeSlots.filter((_, index) => index % 2 === 0).map((timeSlot, slotIndex) => (
                            <React.Fragment key={timeSlot}>
                            <div className="h-[30px] p-1 text-xs text-gray-500 text-right border-r border-gray-200 flex items-center justify-end">
                                {formatTime(timeSlot)}
                            </div>
                            {weekDays.map((day, dayIndex) => (
                                <div
                                    key={`${timeSlot}-${dayIndex}`}
                                    className="h-[30px] border border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors relative"
                                    onClick={() => openEventModal(day)}
                                />
                            ))}
                            </React.Fragment>
                        ))}
                    </div>
          
                    {/* Render events as overlaid positioned elements */}
                    {weekDays.map((day, dayIndex) => {
                        const dayEvents = getEventsForDate(day);
                        return dayEvents.map(event => {
                            const position = calculateEventPosition(event, timeSlots.filter((_, index) => index % 2 === 0));
                            const leftOffset = (dayIndex + 1) * (100 / 8); // +1 to account for time column
              
                            return (
                                <div
                                    key={`${event.id}-${dayIndex}`}
                                    className="absolute text-xs px-2 py-1 rounded text-white cursor-pointer hover:opacity-80 shadow-sm z-10 overflow-hidden"
                                    style={{
                                        backgroundColor: event.color,
                                        left: `${leftOffset}%`,
                                        width: `${100 / 8 - 0.5}%`,
                                        top: `${64 + (position.start * 15)}px`, // 64px for header
                                        height: `${Math.max(position.duration * 15, 30)}px`,
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        openEventModal(day, event);
                                    }}
                                >
                                    <div className="font-medium truncate">{event.title}</div>
                                    <div className="text-xs opacity-90 truncate">
                                        {formatTime(event.startTime)} - {formatTime(event.endTime)}
                                    </div>
                                </div>
                            );
                        });
                    })}
                </div>
            </div>
        );
    }; 

    //create day view
    const renderDayView = () => {
        const timeSlots = getTimeSlots();
        const dayEvents = getEventsForDate(currentDate);
        const today = new Date();
        const isToday = formatDate(currentDate) === formatDate(today);

        return (
            <div className="bg-white rounded-xl shadow-lg p-6">
                <div className={`text-center p-4 mb-6 rounded-lg ${
                    isToday ? 'bg-blue-50 border-2 border-blue-200' : 'bg-gray-50'
                }`}>
                    <h3 className={`text-2xl font-bold ${
                        isToday ? 'text-blue-600' : 'text-gray-900'
                    }`}>
                        {currentDate.toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                        })}
                    </h3>
                </div>

                <div className="max-h-96 overflow-y-auto relative">
                    <div className="relative">
                        {timeSlots.filter((_, index) => index % 2 === 0).map((timeSlot, slotIndex) => (
                        <div key={timeSlot} className="flex border-b border-gray-100">
                            <div className="w-20 h-[30px] p-2 text-sm text-gray-500 text-right border-r border-gray-200 flex items-center justify-end">
                                {formatTime(timeSlot)}
                            </div>
                            <div 
                                className="flex-1 h-[30px] hover:bg-blue-50 cursor-pointer transition-colors"
                                onClick={() => openEventModal(currentDate)}
                                />
                            </div>
                        ))}
                    </div>
          
                    {/* Render events as overlaid positioned elements */}
                    {dayEvents.map(event => {
                        const position = calculateEventPosition(event, timeSlots.filter((_, index) => index % 2 === 0));
            
                        return (
                            <div
                                key={event.id}
                                className="absolute px-3 py-2 ml-20 rounded-lg text-white cursor-pointer hover:opacity-90 shadow-md z-10 overflow-hidden"
                                style={{
                                    backgroundColor: event.color,
                                    left: '80px', 
                                    right: '16px',
                                    top: `${position.start * 15}px`,
                                    height: `${Math.max(position.duration * 15, 30)}px`,
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    openEventModal(currentDate, event);
                                }}
                            >
                                <div className="font-medium truncate">{event.title}</div>
                                <div className="text-sm opacity-90 truncate">
                                    {formatTime(event.startTime)} - {formatTime(event.endTime)}
                                </div>
                                {event.description && position.duration * 15 > 60 && (
                                    <div className="text-sm opacity-80 mt-1 truncate">{event.description}</div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

//main page
return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Calendar className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">Schedule Builder</h1>
            </div>
            
            {/* View Toggle */}
            <div className="flex items-center space-x-4">
              <div className="flex bg-gray-100 rounded-lg p-1">
                {['month', 'week', 'day'].map((viewType) => (
                  <button
                    key={viewType}
                    onClick={() => setView(viewType)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      view === viewType 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {viewType.charAt(0).toUpperCase() + viewType.slice(1)}
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => openEventModal()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center space-x-2 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <Plus className="h-5 w-5" />
                <span>Add Event</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 px-4 py-2 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
            <span className="text-gray-700 font-medium">Previous</span>
          </button>
          
          <h2 className="text-2xl font-bold text-gray-900">
            {getNavigationTitle()}
          </h2>
          
          <button
            onClick={() => navigate(1)}
            className="flex items-center space-x-2 px-4 py-2 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <span className="text-gray-700 font-medium">Next</span>
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Calendar Views */}
        {view === 'month' && renderMonthView()}
        {view === 'week' && renderWeekView()}
        {view === 'day' && renderDayView()}
      </div>

      {/* Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingEvent ? 'Edit Event' : 'Add New Event'}
                </h3>
                <button
                  onClick={closeEventModal}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-600" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Event Title *
                  </label>
                  <input
                    type="text"
                    value={eventForm.title}
                    onChange={(e) => setEventForm({...eventForm, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter event title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={eventForm.date}
                    onChange={(e) => setEventForm({...eventForm, date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Time *
                    </label>
                    <input
                      type="time"
                      value={eventForm.startTime}
                      onChange={(e) => setEventForm({...eventForm, startTime: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Time *
                    </label>
                    <input
                      type="time"
                      value={eventForm.endTime}
                      onChange={(e) => setEventForm({...eventForm, endTime: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={eventForm.description}
                    onChange={(e) => setEventForm({...eventForm, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows="3"
                    placeholder="Add event description (optional)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color
                  </label>
                  <div className="flex space-x-2">
                    {colors.map(color => (
                      <button
                        key={color}
                        onClick={() => setEventForm({...eventForm, color})}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          eventForm.color === color ? 'border-gray-600 scale-110' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 mt-6 pt-6 border-t border-gray-200">
                {editingEvent && (
                  <button
                    onClick={() => {
                      deleteEvent(editingEvent);
                      closeEventModal();
                    }}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete</span>
                  </button>
                )}
                <button
                  onClick={closeEventModal}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEvent}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>Save</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleBuilder;