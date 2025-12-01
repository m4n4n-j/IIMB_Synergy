'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Loader2, ChevronLeft, Check, Plus } from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

const INTEREST_TAGS = ['Fintech', 'Marketing', 'Trekking', 'VegetarianFood', 'GenAI', 'Consulting', 'Startups', 'AI/ML', 'Badminton', 'Photography']
const INTENTS = [
    { id: 'cofounder', label: 'Looking for Co-founder' },
    { id: 'study', label: 'Study Partner' },
    { id: 'chat', label: 'Casual Chat/Vent' },
    { id: 'sports', label: 'Sports/Activity Buddy' },
]

export default function EditProfile() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [user, setUser] = useState<any>(null)

    const [formData, setFormData] = useState({
        full_name: '',
        program: 'PGP',
        year: new Date().getFullYear(),
        section: '',
        interests: [] as string[],
        intent: '',
        bio: '',
    })

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/')
                return
            }
            setUser(user)

            // Check if profile exists and populate data
            const { data: profile } = await supabase
                .from('users')
                .select('*')
                .eq('id', user.id)
                .single()

            if (profile) {
                setFormData({
                    full_name: profile.full_name || '',
                    program: profile.program || 'PGP',
                    year: profile.year || new Date().getFullYear(),
                    section: profile.section || '',
                    interests: profile.interests || [],
                    intent: profile.bio || '', // Mapping bio back to intent for MVP
                    bio: profile.bio || '',
                })
            }
        }
        getUser()
    }, [router])

    const handleInterestToggle = (tag: string) => {
        setFormData(prev => {
            const interests = prev.interests.includes(tag)
                ? prev.interests.filter(t => t !== tag)
                : [...prev.interests, tag]
            return { ...prev, interests }
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        if (!user) return

        const payload = {
            id: user.id,
            email: user.email,
            full_name: formData.full_name,
            program: formData.program as any,
            year: parseInt(formData.year.toString()),
            section: formData.section.toUpperCase(),
            interests: formData.interests,
            bio: formData.intent, // Mapping intent to bio
        }

        const { error } = await supabase
            .from('users')
            .upsert(payload)

        if (error) {
            alert('Error updating profile: ' + error.message)
        } else {
            router.push('/dashboard')
        }
        setLoading(false)
    }

    if (!user) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin text-[#B91C1C]" /></div>

    return (
        <div className="min-h-screen bg-white pb-20">
            {/* Header */}
            <div className="flex items-center p-4 border-b border-gray-100 sticky top-0 bg-white z-10">
                <button onClick={() => router.back()} className="p-2">
                    <ChevronLeft className="h-6 w-6 text-gray-900" />
                </button>
                <h1 className="flex-1 text-center text-lg font-bold text-gray-900 mr-8">Edit Profile</h1>
            </div>

            <form onSubmit={handleSubmit} className="px-6 space-y-8 mt-6">

                {/* Name Section */}
                <div className="space-y-4">
                    <label className="block text-sm font-bold text-gray-900">Full Name</label>
                    <input
                        type="text"
                        required
                        value={formData.full_name}
                        onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                        placeholder="Enter your full name"
                        className="w-full p-4 text-lg text-gray-900 border-2 border-gray-200 rounded-xl focus:border-[#B91C1C] focus:ring-0 outline-none transition-all"
                    />
                </div>

                {/* Interests Section */}
                <div className="space-y-4">
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                        Interests & Hobbies
                    </label>

                    <div className="flex flex-wrap gap-3">
                        {INTEREST_TAGS.map(tag => {
                            const isSelected = formData.interests.includes(tag)
                            return (
                                <button
                                    key={tag}
                                    type="button"
                                    onClick={() => handleInterestToggle(tag)}
                                    className={cn(
                                        "px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2",
                                        isSelected
                                            ? 'bg-[#B91C1C] text-white shadow-md'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    )}
                                >
                                    {isSelected && <Check className="h-3 w-3" />}
                                    {tag}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Intent Section */}
                <div className="space-y-4">
                    <label className="block text-sm font-bold text-gray-900">What's Your Intent?</label>

                    <div className="space-y-3">
                        {INTENTS.map(intent => {
                            const isSelected = formData.intent === intent.id
                            return (
                                <div
                                    key={intent.id}
                                    onClick={() => setFormData({ ...formData, intent: intent.id })}
                                    className={cn(
                                        "flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all",
                                        isSelected ? "border-[#B91C1C] bg-red-50" : "border-gray-200 hover:border-gray-300"
                                    )}
                                >
                                    <div className={cn(
                                        "h-6 w-6 rounded-full border-2 flex items-center justify-center mr-3",
                                        isSelected ? "border-[#B91C1C] bg-[#B91C1C]" : "border-gray-300"
                                    )}>
                                        {isSelected && <Check className="h-3 w-3 text-white" />}
                                    </div>
                                    <span className={cn("font-medium", isSelected ? "text-[#B91C1C]" : "text-gray-700")}>
                                        {intent.label}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </div>

                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-base font-bold text-white bg-[#B91C1C] hover:bg-[#991B1B] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#B91C1C] disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    )
}
