'use client';

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@workspace/ui/components/ui";
import { Input } from "@workspace/ui/components/ui";
import { Button } from "@workspace/ui/components/ui";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import axios from "axios";

interface CalendarEvent {
  id?: string;
  title: string;
  start: string | Date;
  end?: string | Date;
  allDay?: boolean;
  color?: string;
}

interface MasterCalendarProps {
  masterId?: number;
  userRole?: string;
  readOnly?: boolean;
  showCreateButton?: boolean;
  apiBaseUrl?: string;
}

export function MasterCalendar({ 
  masterId, 
  userRole = 'user', 
  readOnly = false,
  showCreateButton = true,
  apiBaseUrl = "http://127.0.0.1:8000"
}: MasterCalendarProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [newEventTitle, setNewEventTitle] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDateEnd, setSelectedDateEnd] = useState<Date | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const isMaster = userRole === 'master';
  const canEdit = !readOnly && isMaster;

  // Мемоизируем API instance
  const api = useMemo(() => {
    console.log("API_DOMAIN:", apiBaseUrl);
    return axios.create({
      baseURL: apiBaseUrl,
      withCredentials: true,
    });
  }, [apiBaseUrl]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        // Если передан masterId, получаем события конкретного мастера, иначе свои события
        const endpoint = masterId ? `/master/${masterId}/events/` : '/mine/';
        console.log('Fetching events from endpoint:', endpoint);
        console.log('API base URL:', apiBaseUrl);
        console.log('Master ID:', masterId);
        
        const response = await api.get(endpoint, {
          headers: token ? { Authorization: `Token ${token}` } : {},
        });
        
        console.log('Response status:', response.status);
        console.log('Response data:', response.data);
        if (response.status === 200) {
          setEvents(response.data);
        }
      } catch (error: any) {
        console.error('Ошибка при загрузке событий:', error);
        console.error('Error response:', error.response);
        setError('Не удалось загрузить события календаря');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [api, masterId]);

  // Обработчик клика по дате - только для редактируемого календаря
  const handleDateClick = useCallback((arg: { date: Date }) => {
    if (!canEdit) return;
    setSelectedDate(arg.date);
    setSelectedDateEnd(null);
    setNewEventTitle("");
    setError(null);
    setIsDialogOpen(true);
  }, [canEdit]);

  // Обработчик выбора диапазона дат
  const handleDateSelect = useCallback((arg: { start: Date; end: Date; allDay: boolean }) => {
    if (!canEdit) return;
    setSelectedDate(arg.start);
    setSelectedDateEnd(arg.end);
    setNewEventTitle("");
    setError(null);
    setIsDialogOpen(true);
  }, [canEdit]);

  // Создание события
  const createEvent = useCallback(async (eventData: CalendarEvent) => {
    if (!canEdit) return;
    
    try {
      setError(null);
      console.log("Отправка события на сервер:", eventData);
      
      const tempId = `temp-${Date.now()}`;
      const tempEvent = { ...eventData, id: tempId };
      setEvents(prev => [...prev, tempEvent]);
      
      const token = localStorage.getItem('token');
      const response = await api.post('/create/', eventData, {
        headers: token ? { Authorization: `Token ${token}` } : {},
      });

      if (response.status === 200 || response.status === 201) {
        const newEvent = response.data;
        console.log("Событие успешно создано:", newEvent);
        
        setEvents(prev => prev.map(event => 
          event.id === tempId ? newEvent : event
        ));
      } else {
        console.error("Ошибка при создании события:", response.status);
        setError("Не удалось сохранить событие на сервере");
      }
    } catch (error: any) {
      console.error('Ошибка при создании события:', error);
      setError("Проблема соединения с сервером");
    }
  }, [canEdit, api]);

  // Функция для форматирования даты в локальном времени
  const formatDateForServer = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  };

  // Обновление события при перемещении - только для редактируемого календаря
  const handleEventDrop = useCallback(async (info: any) => {
    if (!canEdit) {
      info.revert();
      return;
    }
    
    const { event } = info;
    
    try {
      const token = localStorage.getItem('token');
      const response = await api.put(`/update/${event.id}/`, {
        start: formatDateForServer(event.start),
        end: event.end ? formatDateForServer(event.end) : formatDateForServer(event.start),
      }, {
        headers: token ? { Authorization: `Token ${token}` } : {},
      });

      if (!response || response.status < 200 || response.status >= 300) {
        info.revert();
      } else {
        setEvents(prevEvents => 
          prevEvents.map(evt => 
            evt.id === event.id 
              ? { ...evt, start: event.start, end: event.end } 
              : evt
          )
        );
      }
    } catch (error) {
      console.error('Ошибка при обновлении события:', error);
      info.revert();
    }
  }, [canEdit, api]);

  // Обработчик изменения размера события
  const handleEventResize = handleEventDrop;

  // Обработчик клика по событию - только для редактируемого календаря
  const handleEventClick = useCallback(async (info: any) => {
    if (!canEdit) return;
    
    if (window.confirm('Удалить это событие?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await api.delete(`/delete/${info.event.id}/`, {
          headers: token ? { Authorization: `Token ${token}` } : {},
        });

        if (response.status >= 200 && response.status < 300) {
          setEvents(prevEvents => 
            prevEvents.filter(event => event.id !== info.event.id)
          );
        }
      } catch (error) {
        console.error('Ошибка при удалении события:', error);
      }
    }
  }, [canEdit, api]);

  // Добавление события из диалога
  const addEvent = useCallback(() => {
    if (!canEdit) return;
    
    if (!newEventTitle) {
      setError("Введите название события");
      return;
    }
    
    if (!selectedDate) {
      setError("Выберите дату события");
      return;
    }

    if (startTime && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(startTime)) {
      setError("Введите корректное время начала в формате ЧЧ:ММ");
      return;
    }
    if (selectedDateEnd && endTime && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(endTime)) {
      setError("Введите корректное время окончания в формате ЧЧ:ММ");
      return;
    }

    const start = new Date(selectedDate);
    if (startTime) {
      const [sh, sm] = startTime.split(":");
      start.setHours(Number(sh), Number(sm), 0, 0);
    } else {
      start.setSeconds(0, 0);
    }
    
    let end = selectedDateEnd ? new Date(selectedDateEnd) : new Date(selectedDate);
    if (selectedDateEnd && endTime) {
      const [eh, em] = endTime.split(":");
      end.setHours(Number(eh), Number(em), 0, 0);
    } else if (!selectedDateEnd && endTime) {
      const [eh, em] = endTime.split(":");
      end.setHours(Number(eh), Number(em), 0, 0);
    } else if (!endTime) {
      end = new Date(start);
      end.setHours(start.getHours() + 1);
    }

    if (end < start) {
      setError("Дата и время окончания не могут быть раньше начала");
      return;
    }
    
    const startISO = formatDateForServer(start);
    const endISO = formatDateForServer(end);
    
    console.log("Добавление события:", {
      title: newEventTitle,
      start: startISO,
      end: endISO,
      localStart: start.toLocaleString('ru-RU', { hour12: false }),
      localEnd: end.toLocaleString('ru-RU', { hour12: false })
    });
    
    createEvent({ 
      title: newEventTitle, 
      start: startISO,
      end: endISO,
      allDay: false
    });
    
    setNewEventTitle("");
    setSelectedDate(null);
    setSelectedDateEnd(null);
    setStartTime("");
    setEndTime("");
    setIsDialogOpen(false);
  }, [canEdit, newEventTitle, selectedDate, selectedDateEnd, startTime, endTime, createEvent]);

  const handleDialogClose = useCallback((open: boolean) => {
    if (!open) {
      setError(null);
      setNewEventTitle(""); 
      setSelectedDate(null); 
      setSelectedDateEnd(null); 
      setStartTime("");
      setEndTime("");
    }
    setIsDialogOpen(open);
  }, []);

  const handleNewEventClick = useCallback(() => {
    if (!canEdit) return;
    setIsDialogOpen(true);
    setSelectedDate(null);
    setSelectedDateEnd(null);
    setNewEventTitle("");
    setStartTime("");
    setEndTime("");
    setError(null);
  }, [canEdit]);

  if (loading) {
    return <div className="flex items-center justify-center p-8">Загрузка календаря...</div>;
  }

  if (error) {
    return <div className="flex items-center justify-center p-8 text-red-500">{error}</div>;
  }

  return (
    <div className="master-calendar-container">
      {canEdit && showCreateButton && (
        <div className="flex justify-end mb-4">
          <Button onClick={handleNewEventClick}>
            Новое событие
          </Button>
        </div>
      )}
      
      {readOnly && (
        <div className="mb-4 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md text-sm text-blue-700 dark:text-blue-300">
          📅 Календарь мастера (только просмотр)
        </div>
      )}

      {/* Стили календаря */}
      <style  >{`
        .fc {
          background-color: hsl(var(--background));
          color: hsl(var(--foreground));
        }
        .fc .fc-view-harness {
          background-color: hsl(var(--background));
        }
        .fc .fc-scrollgrid {
          border-color: hsl(var(--border));
        }
        .fc .fc-daygrid-day, 
        .fc .fc-timegrid-slot, 
        .fc .fc-timegrid-slot-lane,
        .fc .fc-timegrid-col,
        .fc .fc-day {
          background-color: hsl(var(--background));
        }
        .fc .fc-toolbar, 
        .fc .fc-header-toolbar {
          background-color: hsl(var(--background));
          color: hsl(var(--foreground));
        }
        .fc-theme-standard td, 
        .fc-theme-standard th {
          border-color: hsl(var(--border));
        }
        .fc-day-today {
          background-color: hsl(var(--muted)) !important;
        }
        .fc-col-header-cell {
          background-color: hsl(var(--muted));
          color: hsl(var(--foreground));
        }
        .fc-timegrid-axis {
          color: hsl(var(--foreground));
        }
        .fc-timegrid-slot-label {
          color: hsl(var(--foreground));
        }
        .fc button {
          color: hsl(var(--foreground));
          background-color: hsl(var(--background));
          border-color: hsl(var(--border));
        }
        .fc button:hover {
          background-color: hsl(var(--accent));
          color: hsl(var(--accent-foreground));
        }
        .fc a {
          color: hsl(var(--foreground));
        }
        
        .fc .fc-event {
          border-radius: 4px;
          border: 1px solid;
          font-size: 12px;
          padding: 2px 4px;
          margin: 1px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .fc-daygrid-event {
          width: calc(100% - 4px) !important;
          margin: 1px 2px !important;
          min-height: 20px;
        }
        
        .fc-timegrid-event {
          width: calc(100% - 4px) !important;
          margin: 0 2px !important;
          min-height: 18px;
        }
        
        .fc-timegrid-event .fc-event-main {
          padding: 2px 4px;
        }
        
        .fc-timegrid-event .fc-event-title {
          font-weight: 500;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .fc-timegrid-event .fc-event-time {
          font-size: 11px;
          font-weight: normal;
          opacity: 0.8;
        }
        
        .fc-timegrid-event-harness {
          margin: 0 !important;
        }
        
        .fc-daygrid-event-harness {
          margin: 1px 0 !important;
        }
        
        .fc-timegrid-col-events {
          margin: 0 2px;
        }
        
        .fc-event-time {
          font-family: monospace;
          font-size: 11px;
        }
        
        @media (max-width: 768px) {
          .fc-event {
            font-size: 11px;
            padding: 1px 2px;
          }
          
          .fc-timegrid-event {
            min-height: 16px;
          }
          
          .fc-daygrid-event {
            min-height: 18px;
          }
        }
      `}</style>
      
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        events={events}
        selectable={canEdit}
        dateClick={canEdit ? handleDateClick : undefined}
        editable={canEdit}
        droppable={canEdit}
        select={canEdit ? handleDateSelect : undefined}
        eventDrop={canEdit ? handleEventDrop : undefined}
        eventResize={canEdit ? handleEventResize : undefined}
        eventClick={canEdit ? handleEventClick : undefined}
        height="auto"
        timeZone="local"
        nowIndicator={true}
        eventDisplay="block"
        dayMaxEvents={false}
        eventMaxStack={3}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        buttonText={{
          today: 'Сегодня',
          month: 'Месяц',
          week: 'Неделя',
          day: 'День'
        }}
        slotLabelFormat={{
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }}
        eventTimeFormat={{
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }}
        slotMinTime="06:00:00"
        slotMaxTime="23:00:00"
        allDaySlot={false}
        slotDuration="00:30:00"
        slotLabelInterval="01:00:00"
      />

      {/* Диалог создания события - только для редактируемого календаря */}
      {canEdit && (
        <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Новое событие</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-2">
              <Input
                type="text"
                placeholder="Название события"
                value={newEventTitle}
                onChange={(e) => setNewEventTitle(e.target.value)}
                className="w-full"
              />
              <div className="flex gap-2">
                <Input
                  type="date"
                  placeholder="Дата начала"
                  value={selectedDate ? new Date(selectedDate).toISOString().slice(0,10) : ""}
                  onChange={(e) => {
                    const prev = selectedDate || new Date();
                    const [year, month, day] = e.target.value.split('-');
                    const newDate = new Date(prev);
                    newDate.setFullYear(Number(year));
                    newDate.setMonth(Number(month) - 1);
                    newDate.setDate(Number(day));
                    setSelectedDate(newDate);
                  }}
                  className="w-1/2"
                />
                <TimeInput
                  value={startTime}
                  onChange={setStartTime}
                  className="w-1/2 border px-2 py-1 rounded"
                />
              </div>
              <div className="flex gap-2">
                <Input
                  type="date"
                  placeholder="Дата окончания"
                  value={selectedDateEnd ? new Date(selectedDateEnd).toISOString().slice(0,10) : ""}
                  onChange={(e) => {
                    const prev = selectedDateEnd || new Date();
                    const [year, month, day] = e.target.value.split('-');
                    const newDate = new Date(prev);
                    newDate.setFullYear(Number(year));
                    newDate.setMonth(Number(month) - 1);
                    newDate.setDate(Number(day));
                    setSelectedDateEnd(newDate);
                  }}
                  className="w-1/2"
                />
                <TimeInput
                  value={endTime}
                  onChange={setEndTime}
                  className="w-1/2 border px-2 py-1 rounded"
                />
              </div>
            </div>
            
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
            
            <DialogFooter>
              <Button onClick={addEvent} className="mt-2 w-full">
                Добавить событие
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Кастомный компонент для 24-часового ввода времени
function TimeInput({ value, onChange, ...props }: { value: string; onChange: (v: string) => void; [key: string]: any }) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    if (/^[0-9:]*$/.test(inputValue) || inputValue === "") {
      if (inputValue.length <= 5) {
        onChange(inputValue);
      }
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    if (inputValue && !inputValue.includes(':')) {
      if (inputValue.length === 1 || inputValue.length === 2) {
        const hours = inputValue.padStart(2, '0');
        if (parseInt(hours) <= 23) {
          onChange(hours + ':00');
        }
      } else if (inputValue.length === 3 || inputValue.length === 4) {
        const hours = inputValue.slice(0, -2).padStart(2, '0');
        const minutes = inputValue.slice(-2);
        if (parseInt(hours) <= 23 && parseInt(minutes) <= 59) {
          onChange(hours + ':' + minutes);
        }
      }
    } else if (inputValue && inputValue.includes(':')) {
      const parts = inputValue.split(':');
      if (parts.length === 2 && parts[0] && parts[1]) {
        const hours = parts[0].padStart(2, '0');
        const minutes = parts[1].padStart(2, '0');
        if (parseInt(hours) <= 23 && parseInt(minutes) <= 59) {
          onChange(hours + ':' + minutes);
        }
      }
    }
  };

  return (
    <input
      type="text"
      placeholder="ЧЧ:ММ (24ч)"
      value={value}
      onChange={handleChange}
      onBlur={handleBlur}
      maxLength={5}
      {...props}
    />
  );
}
