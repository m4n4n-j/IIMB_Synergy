'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Loader2, Calendar, MapPin, Clock, User, ChevronLeft, ChevronRight, Coffee, Utensils, BookOpen, MessageCircle, Gamepad2, Shirt } from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

const DAYS = [
    { label: 'M', date: '23' },
    { label: 'T', date: '24' },
    { label: 'W', date: '25' },
    { label: 'Th', date: '26' },
    { label: 'F', date: '27' },
    { label: 'S', date: '28' },
    { label: 'Su', date: '29' },
]

const ACTIVITY_ICONS = {
    'Coffee': Coffee,
    'Mess Lunch': Utensils,
    'Sports': Gamepad2,
    'Study': BookOpen,
    'Hangout': Shirt,
    'Chat': MessageCircle
}

export default function Dashboard() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [slots, setSlots] = useState<any[]>([])
    const [matches, setMatches] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedDay, setSelectedDay] = useState('W')
    const [showAvailabilitySheet, setShowAvailabilitySheet] = useState(false)
    const [selectedActivity, setSelectedActivity] = useState<string | null>(null)

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

    const handleSetAvailability = async () => {
        if (!selectedActivity || !user) return

        // Add slot logic here (simplified)
        const { data, error } = await supabase.from('availability_slots').insert({
            user_id: user.id,
            day_of_week: 'Wednesday', // Hardcoded for demo based on screenshot
            time_slot: '13:00',
            activity_type: selectedActivity === 'Mess Lunch' ? 'Lunch' : 'Coffee', // Mapping
            status: 'Open'
        }).select().single()

        if (data) setSlots([...slots, data])
        setShowAvailabilitySheet(false)
        setSelectedActivity(null)
    }

    if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin text-[#B91C1C]" /></div>

    // Match View (Overlay)
    if (matches.length > 0) {
        const match = matches[0] // Show first match
        const partner = match.user_1_id === user.id ? match.user_2 : match.user_1

        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <div className="p-4 flex items-center">
                    <ChevronLeft className="h-6 w-6" onClick={() => setMatches([])} /> {/* Back to dashboard */}
                </div>

                <div className="px-6 pt-4 pb-8">
                    <h1 className="text-3xl font-bold text-gray-900">You've Got a Match!</h1>
                </div>

                <div className="mx-4 bg-white rounded-3xl overflow-hidden shadow-xl">
                    {/* Image Placeholder */}
                    <div className="h-64 bg-gray-300 relative">
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 pt-20">
                            <p className="text-white/80 text-sm mb-1">You are meeting</p>
                            <h2 className="text-white text-2xl font-bold">{partner?.full_name || 'Unknown'} ({partner?.program || 'N/A'})</h2>
                        </div>
                    </div>

                    <div className="p-6 space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center text-[#B91C1C]">
                                <User className="h-6 w-6" /> {/* Activity Icon */}
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
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-white shadow-sm">
                <ChevronLeft className="h-6 w-6 text-gray-500" />
                <h1 className="text-lg font-bold text-gray-900">Weekly Pulse</h1>
                <ChevronRight className="h-6 w-6 text-gray-500" />
            </div>

            <div className="text-center py-6">
                <h2 className="text-2xl font-bold text-gray-900">Oct 23 - Oct 29</h2>
                <p className="text-gray-500 text-sm mt-1">Mark your free slots. Matches are released every Sunday.</p>
            </div>

            {/* Day Selector */}
            <div className="flex justify-between px-4 mb-8">
                {DAYS.map(day => (
                    <button
                        key={day.label}
                        onClick={() => setSelectedDay(day.label)}
                        className={cn(
                            "flex flex-col items-center justify-center h-12 w-12 rounded-full transition-all",
                            selectedDay === day.label ? "bg-[#B91C1C] text-white shadow-md" : "bg-gray-200 text-gray-600"
                        )}
                    >
                        <span className="text-xs font-medium">{day.label}</span>
                    </button>
                ))}
            </div>

            {/* Timeline View - Now Dynamic! */}
            <div className="px-6 relative space-y-8">
                {/* Vertical Line */}
                <div className="absolute left-[27px] top-0 bottom-0 w-0.5 bg-gray-200"></div>

                {/* Dynamically render slots */}
                {slots.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        <p>No availability set yet.</p>
                        <p className="text-sm">Click below to set your availability!</p>
                    </div>
                )}
                {slots.map((slot) => {
                    const ActivityIcon = ACTIVITY_ICONS[slot.activity_type === 'Lunch' ? 'Mess Lunch' : 'Coffee'] || Coffee
                    return (
                        <div key={slot.id} className="relative flex gap-6">
                            <div className="z-10 mt-1">
                                <ActivityIcon className="h-5 w-5 text-gray-500" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">
                                    {slot.activity_type === 'Lunch' ? 'Mess Lunch' : 'Coffee'}
                                </h3>
                                <p className="text-gray-500 text-sm">{slot.day_of_week} - {slot.time_slot}</p>
                                <span className={cn(
                                    "text-xs px-2 py-1 rounded-full",
                                    slot.status === 'Matched' ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                                )}>
                                    {slot.status}
                                </span>
                            </div>
                        </div>
                    )
                })}

                {/* Add Availability Button */}
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

                        <h3 className="text-xl font-bold text-center mb-1">Set Availability</h3>
                        <p className="text-gray-500 text-center text-sm mb-8">Wednesday, 1:00 PM - 2:00 PM</p>

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
