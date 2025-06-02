'use client';

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { Button } from "@workspace/ui/components/button";
// import { toast } from "@workspace/ui/components/use-toast";
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

interface CalendarProps {
  userRole?: string;
}

export default function Calendar({ userRole = 'user' }: CalendarProps) {
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

  // Мемоизируем API instance для предотвращения лишних ререндеров
  const api = useMemo(() => {
    const API_DOMAIN = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    console.log("API_DOMAIN:", API_DOMAIN);
    return axios.create({
      baseURL: API_DOMAIN,
      withCredentials: true,
    });
  }, []);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        // Получаем user_id и token из localStorage
        const userId = localStorage.getItem('user_id');
        const token = localStorage.getItem('token');
        // Можно не использовать userId, если не требуется для календаря
        const response = await api.get('/mine/', {
          headers: token ? { Authorization: `Token ${token}` } : {},
        });
        console.log(response.data)
        if (response.status === 200) {
          setEvents(response.data);
        }
      } catch (error: any) {
        console.error('Ошибка при загрузке событий:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [api]);

  // Обработчик клика по дате
  const handleDateClick = useCallback((arg: { date: Date }) => {
    if (!isMaster) return;
    setSelectedDate(arg.date);
    setSelectedDateEnd(null);
    setNewEventTitle("");
    setError(null);
    setIsDialogOpen(true);
  }, [isMaster]);

  // Обработчик выбора диапазона дат
  const handleDateSelect = useCallback((arg: { start: Date; end: Date; allDay: boolean }) => {
    if (!isMaster) return;
    setSelectedDate(arg.start);
    setSelectedDateEnd(arg.end);
    setNewEventTitle("");
    setError(null);
    setIsDialogOpen(true);
  }, [isMaster]);

  // Создание события - улучшенная версия
  const createEvent = useCallback(async (eventData: CalendarEvent) => {
    try {
      setError(null);
      console.log("Отправка события на сервер:", eventData);
      
      // Добавляем событие локально сразу для улучшения UX
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
        
        // Заменяем временное событие на серверное
        setEvents(prev => prev.map(event => 
          event.id === tempId ? newEvent : event
        ));
        
        // toast({
        //   title: "Событие создано",
        //   description: `${eventData.title} добавлено в календарь`,
        // });
      } else {
        // Если запрос не удался, но события всё равно показываются
        console.error("Ошибка при создании события:", response.status);
        setError("Не удалось сохранить событие на сервере");
        
        // toast({
        //   variant: "destructive",
        //   title: "Ошибка",
        //   description: "Не удалось сохранить событие на сервере",
        // });
      }
    } catch (error: any) {
      console.error('Ошибка при создании события:', error);
      setError("Проблема соединения с сервером");
      
      // toast({
      //   variant: "destructive",
      //   title: "Ошибка соединения",
      //   description: "Не удалось связаться с сервером",
      // });
    }
  }, [api]);

  // Функция для форматирования даты в локальном времени без конвертации в UTC
  const formatDateForServer = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    // Формируем строку в локальном времени
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  };

  // Обновление события при перемещении
  const handleEventDrop = useCallback(async (info: any) => {
    if (!isMaster) return;
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
        // Обновляем локальный стейт
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
  }, [isMaster, api]);

  // Обработчик изменения размера события
  const handleEventResize = handleEventDrop;

  // Обработчик клика по событию
  const handleEventClick = useCallback(async (info: any) => {
    if (!isMaster) return;
    
    if (window.confirm('Удалить это событие?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await api.delete(`/delete/${info.event.id}/`, {
          headers: token ? { Authorization: `Token ${token}` } : {},
        });

        if (response.status >= 200 && response.status < 300) {
          // Удаляем событие из локального стейта
          setEvents(prevEvents => 
            prevEvents.filter(event => event.id !== info.event.id)
          );
        }
      } catch (error) {
        console.error('Ошибка при удалении события:', error);
      }
    }
  }, [isMaster, api]);

  // Улучшенное добавление события из диалога
  const addEvent = useCallback(() => {
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

    // Создаем даты с правильной обработкой временной зоны
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
    
    // Используем локальные ISO строки для сохранения временной зоны
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
  }, [newEventTitle, selectedDate, selectedDateEnd, startTime, endTime, createEvent]);
  
  // Форматирование даты для отображения в диалоге
  const formatSelectedDate = useCallback(() => {
    if (!selectedDate) return "";
    return format(selectedDate, "d MMMM yyyy, HH:mm", { locale: ru });
  }, [selectedDate]);

  // Мемоизированные обработчики для полей ввода
  const handleStartDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const prev = selectedDate || new Date();
    const [year, month, day] = e.target.value.split('-');
    const newDate = new Date(prev);
    newDate.setFullYear(Number(year));
    newDate.setMonth(Number(month) - 1);
    newDate.setDate(Number(day));
    setSelectedDate(newDate);
  }, [selectedDate]);

  const handleEndDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const prev = selectedDateEnd || new Date();
    const [year, month, day] = e.target.value.split('-');
    const newDate = new Date(prev);
    newDate.setFullYear(Number(year));
    newDate.setMonth(Number(month) - 1);
    newDate.setDate(Number(day));
    setSelectedDateEnd(newDate);
  }, [selectedDateEnd]);

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
    setIsDialogOpen(true);
    setSelectedDate(null);
    setSelectedDateEnd(null);
    setNewEventTitle("");
    setStartTime("");
    setEndTime("");
    setError(null);
  }, []);

  return (
    <div className="calendar-container">
      <div className="flex justify-end mb-4">
        <Button onClick={handleNewEventClick}>
          Новое событие
        </Button>
      </div>
      {/* Обновляем стили для работы с системой тем shadcn */}
      <style jsx global>{`
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
        
        /* Стили для событий - расширяем на всю ширину */
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
        
        /* Для событий в месячном виде */
        .fc-daygrid-event {
          width: calc(100% - 4px) !important;
          margin: 1px 2px !important;
          min-height: 20px;
        }
        
        /* Для событий в недельном/дневном виде */
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
        
        /* Убираем отступы у контейнера событий */
        .fc-timegrid-event-harness {
          margin: 0 !important;
        }
        
        .fc-daygrid-event-harness {
          margin: 1px 0 !important;
        }
        
        /* Стили для перекрывающихся событий */
        .fc-timegrid-col-events {
          margin: 0 2px;
        }
        
        /* Улучшаем отображение времени в событиях */
        .fc-event-time {
          font-family: monospace;
          font-size: 11px;
        }
        
        /* Для лучшего отображения на мобильных устройствах */
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
        selectable={isMaster}
        dateClick={handleDateClick}
        editable={isMaster}
        droppable={isMaster}
        select={handleDateSelect}
        eventDrop={handleEventDrop}
        eventResize={handleEventResize}
        eventClick={handleEventClick}
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
                onChange={handleStartDateChange}
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
                onChange={handleEndDateChange}
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
    </div>
  );
}

// Кастомный компонент для 24-часового ввода времени
function TimeInput({ value, onChange, ...props }: { value: string; onChange: (v: string) => void; [key: string]: any }) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Разрешаем ввод цифр, двоеточий и пустой строки
    if (/^[0-9:]*$/.test(inputValue) || inputValue === "") {
      // Разрешаем промежуточные состояния ввода
      if (inputValue.length <= 5) {
        onChange(inputValue);
      }
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Автоматическое форматирование при потере фокуса
    if (inputValue && !inputValue.includes(':')) {
      // Если введены только числа без двоеточия, пытаемся форматировать
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
      // Проверяем и корректируем формат ЧЧ:ММ
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
