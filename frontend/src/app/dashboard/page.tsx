'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Loader2, Calendar, MapPin, Clock, User, ChevronLeft, ChevronRight, Coffee, Utensils, BookOpen, MessageCircle, Gamepad2, Shirt, Info, CheckCircle2 } from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

const ACTIVITY_ICONS = {
    'Coffee': Coffee,
    'Mess Lunch': Utensils,
    'Sports': Gamepad2,
    'Study': BookOpen,
    'Hangout': Shirt,
    'Chat': MessageCircle
}

const TIME_SLOTS = [
    { label: '9 AM - 10 AM', value: '09:00' },
    { label: '10 AM - 11 AM', value: '10:00' },
    { label: '11 AM - 12 PM', value: '11:00' },
    { label: '12 PM - 1 PM', value: '12:00' },
    { label: '1 PM - 2 PM', value: '13:00' },
    { label: '2 PM - 3 PM', value: '14:00' },
    { label: '3 PM - 4 PM', value: '15:00' },
    { label: '4 PM - 5 PM', value: '16:00' },
    { label: '5 PM - 6 PM', value: '17:00' },
]

export default function Dashboard() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [slots, setSlots] = useState<any[]>([])
    const [matches, setMatches] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedDay, setSelectedDay] = useState('W')
    const [selectedTime, setSelectedTime] = useState('13:00')
    const [showAvailabilitySheet, setShowAvailabilitySheet] = useState(false)
    const [selectedActivity, setSelectedActivity] = useState<string | null>(null)
    const [currentWeekStart, setCurrentWeekStart] = useState(new Date())

    useEffect(() => {
        const getData = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/')
                return
            }
            setUser(user)

            // Fetch slots
            const { data: slotsData } = await supabase
                .from('availability_slots')
                .select('*')
                .eq('user_id', user.id)

            if (slotsData) setSlots(slotsData)

            // Fetch matches
            const { data: matchesData } = await supabase
                .from('matches')
                .select(`
          *,
          user_1:users!matches_user_1_id_fkey(full_name, program),
          user_2:users!matches_user_2_id_fkey(full_name, program)
        `)
                .or(`user_1_id.eq.${user.id},user_2_id.eq.${user.id}`)

            if (matchesData) setMatches(matchesData)

            setLoading(false)
        }
        getData()
    }, [router])

    const getDaysForWeek = (startDate: Date) => {
        const days = []
        const start = new Date(startDate)
        start.setDate(start.getDate() - start.getDay() + 1) // Start on Monday

        for (let i = 0; i < 7; i++) {
            const d = new Date(start)
            d.setDate(start.getDate() + i)
            days.push({
                label: ['M', 'T', 'W', 'Th', 'F', 'S', 'Su'][i],
                date: d.getDate().toString(),
                fullDate: d
            })
        }
        return days
    }

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }

    const days = getDaysForWeek(currentWeekStart)

    const handlePrevWeek = () => {
        const newDate = new Date(currentWeekStart)
        newDate.setDate(newDate.getDate() - 7)
        setCurrentWeekStart(newDate)
    }

    const handleNextWeek = () => {
        const newDate = new Date(currentWeekStart)
        newDate.setDate(newDate.getDate() + 7)
        setCurrentWeekStart(newDate)
    }

    const handleSetAvailability = async () => {
        if (!selectedActivity || !user) return

        const dayLabel = days.find(d => d.label === selectedDay)?.label || 'Wednesday'
        const fullDayName = {
            'M': 'Monday', 'T': 'Tuesday', 'W': 'Wednesday', 'Th': 'Thursday', 'F': 'Friday', 'S': 'Saturday', 'Su': 'Sunday'
        }[dayLabel] || 'Wednesday'

        // Map display names to DB enum values
        let dbActivityType = selectedActivity
        if (selectedActivity === 'Mess Lunch') dbActivityType = 'Lunch'
        if (selectedActivity === 'Sports') dbActivityType = 'Sport'

        const { data, error } = await supabase.from('availability_slots').insert({
            user_id: user.id,
            day_of_week: fullDayName,
            time_slot: selectedTime,
            activity_type: dbActivityType,
            status: 'Open'
        }).select().single()

        if (data) setSlots([...slots, data])
        setShowAvailabilitySheet(false)
        setSelectedActivity(null)
    }

    const handleDeleteSlot = async (id: string) => {
        const { error } = await supabase
            .from('availability_slots')
            .delete()
            .eq('id', id)

        if (!error) {
            setSlots(slots.filter(slot => slot.id !== id))
        }
    }

    if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin text-[#B91C1C]" /></div>

    // Match View (Overlay)
    if (matches.length > 0) {
        const match = matches[0]
        const partner = match.user_1_id === user.id ? match.user_2 : match.user_1

        return (
            <div className="h-screen overflow-hidden bg-gray-50 flex flex-col">
                <div className="p-4 flex items-center">
                    <ChevronLeft className="h-6 w-6 cursor-pointer text-gray-900" onClick={() => setMatches([])} />
                </div>

                <div className="px-6 pt-4 pb-8">
                    <h1 className="text-3xl font-bold text-gray-900">You've Got a Match!</h1>
                </div>

                <div className="mx-4 bg-white rounded-3xl overflow-hidden shadow-xl flex-1 max-h-[600px]">
                    <div className="h-1/3 bg-gray-300 relative">
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 pt-20">
                            <p className="text-white/80 text-sm mb-1">You are meeting</p>
                            <h2 className="text-white text-2xl font-bold">{partner?.full_name || 'Unknown'} ({partner?.program || 'N/A'})</h2>
                        </div>
                    </div>

                    <div className="p-6 space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center text-[#B91C1C]">
                                <Coffee className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-gray-900 font-medium">Activity: {match.activity_type}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center text-[#B91C1C]">
                                <MapPin className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-gray-900 font-medium">Location: {match.location}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center text-[#B91C1C]">
                                <Clock className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-gray-900 font-medium">Time: {new Date(match.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 mt-auto">
                    <button className="w-full bg-[#B91C1C] text-white font-bold py-4 rounded-xl shadow-lg hover:bg-[#991B1B] transition-colors">
                        Say Hello
                    </button>
                    <p className="text-center text-gray-500 text-sm mt-4">Need to reschedule?</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-white pb-20">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-[#B91C1C] rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold">S</span>
                    </div>
                    <span className="font-bold text-gray-900">Weekly Pulse</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-sm font-medium text-gray-500">
                        {currentWeekStart ? `${formatDate(currentWeekStart)} - ${formatDate(new Date(currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000))}` : ''}
                    </div>
                    <button
                        onClick={() => router.push('/history')}
                        className="p-2 text-gray-400 hover:text-gray-600"
                    >
                        <Clock className="h-5 w-5" />
                    </button>
                    <button
                        onClick={() => router.push('/profile')}
                        className="p-2 text-gray-400 hover:text-gray-600"
                    >
                        <User className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Weekly Calendar Navigation */}
            <div className="flex items-center justify-between px-4 py-2">
                <button onClick={handlePrevWeek} className="p-2 hover:bg-gray-100 rounded-full cursor-pointer">
                    <ChevronLeft className="h-5 w-5 text-gray-600" />
                </button>
                <span className="text-sm font-medium text-gray-500">
                    {currentWeekStart ? currentWeekStart.toLocaleString('default', { month: 'long', year: 'numeric' }) : ''}
                </span>
                <button onClick={handleNextWeek} className="p-2 hover:bg-gray-100 rounded-full cursor-pointer">
                    <ChevronRight className="h-5 w-5 text-gray-600" />
                </button>
            </div>

            {/* Status Card */}
            <div className="px-4 mb-6 space-y-4">
                {slots.length > 0 ? (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                            <div>
                                <h3 className="font-bold text-green-900">You're all set!</h3>
                                <p className="text-sm text-green-700 mt-1">
                                    We'll look for other students who are also free at <strong>{slots[0].time_slot}</strong> on <strong>{slots[0].day_of_week}</strong>.
                                </p>
                                <p className="text-xs text-green-600 mt-2">
                                    Matches are released every Sunday. You'll get an email to connect!
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                        <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                        <div>
                            <h3 className="font-bold text-blue-900">How it works</h3>
                            <p className="text-sm text-blue-700 mt-1">
                                1. Mark your free time slots below.<br />
                                2. We match you with a peer who is also free.<br />
                                3. You get an intro to meet for Coffee or Lunch! ☕
                            </p>
                        </div>
                    </div>
                )}

                {/* Demo Button */}
                <button
                    onClick={() => setMatches([{
                        id: 'demo',
                        activity_type: 'Coffee',
                        location: 'Mitti Cafe, IIMB Campus',
                        scheduled_time: new Date().toISOString(),
                        user_2: { full_name: 'Tanya Agrawal', program: 'MBA 2025' },
                        user_1_id: user?.id
                    }])}
                    className="w-full py-3 bg-gray-900 text-white rounded-xl text-sm font-bold shadow-lg hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
                >
                    <User className="h-4 w-4" />
                    See Demo Match
                </button>
            </div>

            {/* Day Selector */}
            <div className="flex justify-between px-4 mb-8">
                {days.map(day => (
                    <button
                        key={day.label}
                        onClick={() => setSelectedDay(day.label)}
                        className={cn(
                            "flex flex-col items-center justify-center h-12 w-12 rounded-full transition-all",
                            selectedDay === day.label ? "bg-[#B91C1C] text-white shadow-md" : "bg-gray-200 text-gray-600"
                        )}
                    >
                        <span className="text-xs font-medium">{day.label}</span>
                        <span className="text-[10px] opacity-80">{day.date}</span>
                    </button>
                ))}
            </div>

            {/* Timeline View */}
            <div className="px-6 relative space-y-8 pb-24">
                <div className="absolute left-[27px] top-0 bottom-0 w-0.5 bg-gray-200"></div>

                {slots.length === 0 && (
                    <div className="text-center py-8 text-gray-500 pl-8">
                        <p>No availability set yet.</p>
                        <p className="text-sm">Click below to set your availability!</p>
                    </div>
                )}
                {slots.map((slot) => {
                    const ActivityIcon = ACTIVITY_ICONS[(slot.activity_type === 'Lunch' ? 'Mess Lunch' : (slot.activity_type === 'Sport' ? 'Sports' : slot.activity_type)) as keyof typeof ACTIVITY_ICONS] || Coffee
                    return (
                        <div key={slot.id} className="relative flex gap-6 group">
                            <div className="z-10 mt-1">
                                <ActivityIcon className="h-5 w-5 text-gray-500" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-gray-900">
                                    {slot.activity_type === 'Lunch' ? 'Mess Lunch' : (slot.activity_type === 'Sport' ? 'Sports' : slot.activity_type)}
                                </h3>
                                <p className="text-gray-700 text-sm">{slot.day_of_week} - {slot.time_slot}</p>
                                <div className="flex items-center gap-3 mt-2">
                                    <span className={cn(
                                        "text-xs px-2 py-1 rounded-full",
                                        slot.status === 'Matched' ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                                    )}>
                                        {slot.status}
                                    </span>
                                    <button
                                        onClick={() => handleDeleteSlot(slot.id)}
                                        className="text-red-600 text-xs font-bold hover:bg-red-50 px-2 py-1 rounded transition-colors"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                })}

                <div className="relative flex gap-6 cursor-pointer" onClick={() => setShowAvailabilitySheet(true)}>
                    <div className="z-10 h-4 w-4 rounded-full border-2 border-[#B91C1C] bg-white mt-1"></div>
                    <div>
                        <h3 className="font-bold text-[#B91C1C]">+ Add Availability</h3>
                        <p className="text-gray-500 text-sm">Set when you're free to meet</p>
                    </div>
                </div>
            </div>

            {/* Bottom Sheet for Availability */}
            {showAvailabilitySheet && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
                    <div className="bg-white w-full rounded-t-3xl p-6 animate-in slide-in-from-bottom duration-300">
                        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6"></div>

                        <h3 className="text-xl font-bold text-center mb-4 text-gray-900">Set Availability</h3>

                        <div className="flex gap-4 mb-6">
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-gray-900 mb-1">Day</label>
                                <div className="flex gap-1 overflow-x-auto pb-2">
                                    {days.map(day => (
                                        <button
                                            key={day.label}
                                            onClick={() => setSelectedDay(day.label)}
                                            className={cn(
                                                "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                                                selectedDay === day.label ? "bg-[#B91C1C] text-white" : "bg-gray-100 text-gray-700"
                                            )}
                                        >
                                            {day.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-gray-900 mb-1">Time</label>
                                <select
                                    value={selectedTime}
                                    onChange={(e) => setSelectedTime(e.target.value)}
                                    className="w-full p-2 bg-gray-100 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-[#B91C1C] text-gray-900"
                                >
                                    {TIME_SLOTS.map(slot => (
                                        <option key={slot.value} value={slot.value} className="text-gray-900">{slot.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-8">
                            {Object.entries(ACTIVITY_ICONS).map(([name, Icon]) => (
                                <button
                                    key={name}
                                    onClick={() => setSelectedActivity(name)}
                                    className={cn(
                                        "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all h-24",
                                        selectedActivity === name
                                            ? "border-[#B91C1C] bg-red-50 text-[#B91C1C]"
                                            : "border-gray-100 text-gray-700 hover:border-gray-200"
                                    )}
                                >
                                    <Icon className="h-6 w-6 mb-2" />
                                    <span className="text-xs font-bold">{name}</span>
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl mb-6">
                            <div className="flex items-center gap-3">
                                <Calendar className="h-5 w-5 text-gray-600" />
                                <span className="text-sm font-medium text-gray-700">Block on Google Calendar</span>
                            </div>
                            <div className="w-11 h-6 bg-gray-200 rounded-full relative cursor-pointer">
                                <div className="absolute left-1 top-1 h-4 w-4 bg-white rounded-full shadow-sm"></div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowAvailabilitySheet(false)
                                    setSelectedActivity(null)
                                }}
                                className="flex-1 bg-gray-200 text-gray-700 font-bold py-4 rounded-xl hover:bg-gray-300 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSetAvailability}
                                disabled={!selectedActivity}
                                className="flex-1 bg-[#B91C1C] text-white font-bold py-4 rounded-xl shadow-lg hover:bg-[#991B1B] transition-colors disabled:opacity-50"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
