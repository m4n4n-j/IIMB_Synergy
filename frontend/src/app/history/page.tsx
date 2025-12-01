'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Loader2, ChevronLeft, Check, Plus, Calendar, MapPin, Clock, Coffee, Utensils, Gamepad2, BookOpen, MessageCircle, Shirt } from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

const ACTIVITY_ICONS: any = {
    'Coffee': Coffee,
    'Lunch': Utensils,
    'Sport': Gamepad2,
    'Study': BookOpen,
    'Hangout': Shirt,
    'Chat': MessageCircle
}

export default function MatchHistory() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [matches, setMatches] = useState<any[]>([])
    const [user, setUser] = useState<any>(null)

    useEffect(() => {
        const getData = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/')
                return
            }
            setUser(user)

            const { data: matchesData } = await supabase
                .from('matches')
                .select(`
                    *,
                    user_1:users!matches_user_1_id_fkey(full_name, program),
                    user_2:users!matches_user_2_id_fkey(full_name, program)
                `)
                .or(`user_1_id.eq.${user.id},user_2_id.eq.${user.id}`)
                .order('scheduled_time', { ascending: false })

            if (matchesData) setMatches(matchesData)
            setLoading(false)
        }
        getData()
    }, [router])

    if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin text-[#B91C1C]" /></div>

    return (
        <div className="min-h-screen bg-white pb-20">
            {/* Header */}
            <div className="flex items-center p-4 border-b border-gray-100 sticky top-0 bg-white z-10">
                <button onClick={() => router.back()} className="p-2">
                    <ChevronLeft className="h-6 w-6 text-gray-900" />
                </button>
                <h1 className="flex-1 text-center text-lg font-bold text-gray-900 mr-8">Match History</h1>
            </div>

            <div className="p-4 space-y-4">
                {matches.length === 0 ? (
                    <div className="text-center py-12 text-gray-700">
                        <p>No matches yet.</p>
                        <p className="text-sm mt-2">Set your availability to get matched!</p>
                    </div>
                ) : (
                    matches.map((match) => {
                        const partner = match.user_1_id === user.id ? match.user_2 : match.user_1
                        const ActivityIcon = ACTIVITY_ICONS[match.activity_type] || Coffee
                        const date = new Date(match.scheduled_time)

                        return (
                            <div key={match.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-lg">{partner?.full_name || 'Unknown'}</h3>
                                        <p className="text-sm text-gray-700">{partner?.program || 'N/A'}</p>
                                    </div>
                                    <div className="bg-gray-100 p-2 rounded-full">
                                        <ActivityIcon className="h-5 w-5 text-gray-600" />
                                    </div>
                                </div>

                                <div className="space-y-2 text-sm text-gray-700">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-gray-400" />
                                        <span>{date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-gray-400" />
                                        <span>{date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-gray-400" />
                                        <span>{match.location || 'TBD'}</span>
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}
