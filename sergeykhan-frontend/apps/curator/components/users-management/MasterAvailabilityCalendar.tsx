"use client";

import React, { useState, useEffect, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import axios from "axios";
import { format, parseISO } from "date-fns";

import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@workspace/ui/components/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@workspace/ui/components/select";
import { Label } from "@workspace/ui/components/label";
import { Badge } from "@workspace/ui/components/badge";
import { toast } from "sonner";
import { Master } from "@shared/constants/types";

interface MasterAvailability {
    id: number;
    master: number;
    date: string;
    start_time: string;
    end_time: string;
    created_at: string;
    updated_at: string;
}

interface CalendarEvent {
    id?: string;
    title: string;
    start: string;
    end: string;
    backgroundColor?: string;
    borderColor?: string;
    extendedProps?: {
        availabilityId?: number;
        masterId?: number;
        masterEmail?: string;
    };
}

interface MasterAvailabilityCalendarProps {
    masterId?: string;
    showMasterSelector?: boolean;
    onAvailabilityChange?: () => void;
}

const MasterAvailabilityCalendar: React.FC<MasterAvailabilityCalendarProps> = ({
    masterId: propMasterId,
    showMasterSelector = true,
    onAvailabilityChange,
}) => {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [masters, setMasters] = useState<Master[]>([]);
    const [selectedMasterId, setSelectedMasterId] = useState<string>(propMasterId || "");
    const [selectedMaster, setSelectedMaster] = useState<Master | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Dialog states
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [dialogMode, setDialogMode] = useState<"create" | "edit" | "delete">("create");
    const [selectedDate, setSelectedDate] = useState<string>("");
    const [startTime, setStartTime] = useState<string>("09:00");
    const [endTime, setEndTime] = useState<string>("17:00");
    const [selectedAvailability, setSelectedAvailability] = useState<MasterAvailability | null>(null);

    // Fetch masters
    const fetchMasters = useCallback(async () => {
        try {
            const token = localStorage.getItem("authToken");
            if (!token) throw new Error("No authentication token found");

            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_API_URL}/users/masters/`,
                {
                    headers: { Authorization: `Token ${token}` },
                }
            );

            setMasters(response.data);
            if (response.data.length > 0 && !selectedMasterId) {
                setSelectedMasterId(response.data[0].id);
                setSelectedMaster(response.data[0]);
            }
        } catch (err) {
            console.error("Error fetching masters:", err);
            setError("Failed to load masters");
        }
    }, [selectedMasterId]);

    // Fetch availability for selected master
    const fetchAvailability = useCallback(async () => {
        if (!selectedMasterId) return;

        try {
            setIsLoading(true);
            setError(null);
            
            const token = localStorage.getItem("authToken");
            if (!token) throw new Error("No authentication token found");

            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_API_URL}/api/masters/${selectedMasterId}/availability/`,
                {
                    headers: { Authorization: `Token ${token}` },
                }
            );

            const availability: MasterAvailability[] = response.data;
            const calendarEvents: CalendarEvent[] = availability.map((slot) => ({
                id: `availability-${slot.id}`,
                title: `Available ${slot.start_time} - ${slot.end_time}`,
                start: `${slot.date}T${slot.start_time}`,
                end: `${slot.date}T${slot.end_time}`,
                backgroundColor: "#10b981",
                borderColor: "#059669",
                extendedProps: {
                    availabilityId: slot.id,
                    masterId: slot.master,
                    masterEmail: selectedMaster?.email || "",
                },
            }));

            setEvents(calendarEvents);
        } catch (err) {
            console.error("Error fetching availability:", err);
            setError("Failed to load availability data");
        } finally {
            setIsLoading(false);
        }
    }, [selectedMasterId, selectedMaster]);

    useEffect(() => {
        fetchMasters();
    }, [fetchMasters]);

    useEffect(() => {
        if (selectedMasterId) {
            const master = masters.find(m => m.id === selectedMasterId);
            setSelectedMaster(master || null);
            fetchAvailability();
        }
    }, [selectedMasterId, masters, fetchAvailability]);

    // Handle date selection for new availability
    const handleDateSelect = (selectInfo: { start: Date; end: Date }) => {
        if (!selectedMasterId) {
            toast.error("Please select a master first");
            return;
        }

        setSelectedDate(format(selectInfo.start, "yyyy-MM-dd"));
        setStartTime(format(selectInfo.start, "HH:mm"));
        setEndTime(format(selectInfo.end, "HH:mm"));
        setDialogMode("create");
        setSelectedAvailability(null);
        setIsDialogOpen(true);
    };

    // Handle event click for editing/deleting
    const handleEventClick = (clickInfo: any) => {
        const availabilityId = clickInfo.event.extendedProps.availabilityId;
        if (!availabilityId) return;

        // Find the availability data
        const availability = events.find(e => 
            e.extendedProps?.availabilityId === availabilityId
        );
        
        if (availability) {
            const startDateTime = parseISO(availability.start);
            const endDateTime = parseISO(availability.end);
            
            setSelectedDate(format(startDateTime, "yyyy-MM-dd"));
            setStartTime(format(startDateTime, "HH:mm"));
            setEndTime(format(endDateTime, "HH:mm"));
            setSelectedAvailability({
                id: availabilityId,
                master: availability.extendedProps?.masterId || 0,
                date: format(startDateTime, "yyyy-MM-dd"),
                start_time: format(startDateTime, "HH:mm:ss"),
                end_time: format(endDateTime, "HH:mm:ss"),
                created_at: "",
                updated_at: "",
            });
            setDialogMode("edit");
            setIsDialogOpen(true);
        }
    };

    // Create availability slot
    const createAvailability = async () => {
        try {
            const token = localStorage.getItem("authToken");
            if (!token) throw new Error("No authentication token found");

            const data = {
                master: selectedMasterId,
                date: selectedDate,
                start_time: `${startTime}:00`,
                end_time: `${endTime}:00`,
            };

            await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/api/masters/${selectedMasterId}/availability/`,
                data,
                {
                    headers: { Authorization: `Token ${token}` },
                }
            );

            toast.success("Availability slot created successfully");
            fetchAvailability();
            onAvailabilityChange?.();
            setIsDialogOpen(false);
        } catch (err: any) {
            console.error("Error creating availability:", err);
            toast.error(err.response?.data?.error || "Failed to create availability slot");
        }
    };

    // Update availability slot
    const updateAvailability = async () => {
        if (!selectedAvailability) return;

        try {
            const token = localStorage.getItem("authToken");
            if (!token) throw new Error("No authentication token found");

            const data = {
                master: selectedMasterId,
                date: selectedDate,
                start_time: `${startTime}:00`,
                end_time: `${endTime}:00`,
            };

            await axios.put(
                `${process.env.NEXT_PUBLIC_API_URL}/api/masters/${selectedMasterId}/availability/${selectedAvailability.id}/`,
                data,
                {
                    headers: { Authorization: `Token ${token}` },
                }
            );

            toast.success("Availability slot updated successfully");
            fetchAvailability();
            onAvailabilityChange?.();
            setIsDialogOpen(false);
        } catch (err: any) {
            console.error("Error updating availability:", err);
            toast.error(err.response?.data?.error || "Failed to update availability slot");
        }
    };

    // Delete availability slot
    const deleteAvailability = async () => {
        if (!selectedAvailability) return;

        try {
            const token = localStorage.getItem("authToken");
            if (!token) throw new Error("No authentication token found");

            await axios.delete(
                `${process.env.NEXT_PUBLIC_API_URL}/api/masters/${selectedMasterId}/availability/${selectedAvailability.id}/`,
                {
                    headers: { Authorization: `Token ${token}` },
                }
            );

            toast.success("Availability slot deleted successfully");
            fetchAvailability();
            onAvailabilityChange?.();
            setIsDialogOpen(false);
        } catch (err: any) {
            console.error("Error deleting availability:", err);
            toast.error(err.response?.data?.error || "Failed to delete availability slot");
        }
    };

    const handleSubmit = () => {
        if (dialogMode === "create") {
            createAvailability();
        } else if (dialogMode === "edit") {
            updateAvailability();
        } else if (dialogMode === "delete") {
            deleteAvailability();
        }
    };

    const handleDeleteClick = () => {
        setDialogMode("delete");
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Master Availability Calendar</CardTitle>
                        <CardDescription>
                            Manage master availability schedules and time slots
                        </CardDescription>
                    </div>
                    {selectedMaster && (
                        <Badge variant="outline">
                            {selectedMaster.email}
                        </Badge>
                    )}
                </div>
                
                {showMasterSelector && (
                    <div className="flex items-center space-x-4">
                        <Label htmlFor="master-select">Select Master:</Label>
                        <Select
                            value={selectedMasterId}
                            onValueChange={setSelectedMasterId}
                        >
                            <SelectTrigger className="w-64">
                                <SelectValue placeholder="Choose a master" />
                            </SelectTrigger>
                            <SelectContent>
                                {masters.map((master) => (
                                    <SelectItem key={master.id} value={master.id}>
                                        {master.email} ({master.first_name} {master.last_name})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
            </CardHeader>
            <CardContent>
                {error && (
                    <div className="text-red-500 text-center py-4 mb-4">
                        <p>{error}</p>
                        <Button onClick={fetchAvailability} className="mt-2">
                            Retry
                        </Button>
                    </div>
                )}

                {!selectedMasterId ? (
                    <div className="text-center py-8 text-gray-500">
                        Please select a master to view their availability
                    </div>
                ) : (
                    <div className="calendar-container">
                        <FullCalendar
                            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                            initialView="timeGridWeek"
                            events={events}
                            selectable
                            selectMirror
                            dayMaxEvents
                            weekends
                            select={handleDateSelect}
                            eventClick={handleEventClick}
                            headerToolbar={{
                                left: "prev,next today",
                                center: "title",
                                right: "dayGridMonth,timeGridWeek,timeGridDay",
                            }}
                            height="auto"
                            slotMinTime="06:00:00"
                            slotMaxTime="22:00:00"
                            allDaySlot={false}
                            loading={setIsLoading}
                        />
                    </div>
                )}

                {/* Dialog for creating/editing availability */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {dialogMode === "create" && "Create Availability Slot"}
                                {dialogMode === "edit" && "Edit Availability Slot"}
                                {dialogMode === "delete" && "Delete Availability Slot"}
                            </DialogTitle>
                            <DialogDescription>
                                {dialogMode === "create" && "Add a new availability time slot for the selected master."}
                                {dialogMode === "edit" && "Modify the existing availability time slot."}
                                {dialogMode === "delete" && "Are you sure you want to delete this availability slot?"}
                            </DialogDescription>
                        </DialogHeader>

                        {dialogMode !== "delete" && (
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="date" className="text-right">
                                        Date
                                    </Label>
                                    <Input
                                        id="date"
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        className="col-span-3"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="start-time" className="text-right">
                                        Start Time
                                    </Label>
                                    <Input
                                        id="start-time"
                                        type="time"
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                        className="col-span-3"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="end-time" className="text-right">
                                        End Time
                                    </Label>
                                    <Input
                                        id="end-time"
                                        type="time"
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                        className="col-span-3"
                                    />
                                </div>
                            </div>
                        )}

                        <DialogFooter>
                            {dialogMode === "edit" && (
                                <Button onClick={handleDeleteClick} variant="destructive">
                                    Delete
                                </Button>
                            )}
                            <Button onClick={() => setIsDialogOpen(false)} variant="outline">
                                Cancel
                            </Button>
                            <Button onClick={handleSubmit}>
                                {dialogMode === "create" && "Create"}
                                {dialogMode === "edit" && "Save Changes"}
                                {dialogMode === "delete" && "Delete"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
};

export default MasterAvailabilityCalendar;
