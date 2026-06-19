import type { Contact, MedicalItem, MoodEntry, Post, SymptomLog, Profile } from "./store";

export const DEFAULT_PROFILE: Profile = {
  name: "Ananya",
  streak: 12,
  wellnessScore: 82,
};

// Use a stable reference timestamp so SSR and client render identical seed data.
// Snapped to top-of-current-hour to avoid hydration mismatches.
const REF = (() => { const d = new Date(); d.setMinutes(0, 0, 0); return d.getTime(); })();
const day = 24 * 60 * 60 * 1000;
const iso = (offset: number) => new Date(REF - offset).toISOString();

export const SEED_MOODS: MoodEntry[] = [
  { id: "m1", mood: "Happy", at: iso(0) },
  { id: "m2", mood: "Calm", at: iso(day) },
  { id: "m3", mood: "Anxious", at: iso(2 * day) },
  { id: "m4", mood: "Sad", at: iso(3 * day) },
  { id: "m5", mood: "Irritated", at: iso(4 * day) },
  { id: "m6", mood: "Calm", at: iso(5 * day) },
  { id: "m7", mood: "Happy", at: iso(6 * day) },
];

export const SEED_SYMPTOMS: SymptomLog[] = [
  { id: "s1", name: "Headache", category: "Physical", severity: 4, mood: "Irritated", at: iso(2 * 60 * 60 * 1000), status: "Recovered" },
  { id: "s2", name: "Fever", category: "Physical", severity: 3, mood: "Low energy", at: iso(4 * 60 * 60 * 1000), status: "Ongoing" },
  { id: "s3", name: "Runny Nose", category: "Physical", severity: 2, mood: "Calm", at: iso(6 * 60 * 60 * 1000), status: "Recovered" },
  { id: "s4", name: "Sore Throat", category: "Physical", severity: 3, mood: "Sad", at: iso(day + 60 * 60 * 1000), status: "Recovered" },
];

export const SEED_POSTS: Post[] = [
  {
    id: "p1",
    body: "My anxiety gets triggered by really small things. How do I stay calm? Any tips that actually help?",
    tags: ["Anxiety", "Seeking Advice"],
    emoji: "🌸",
    at: iso(2 * 60 * 60 * 1000),
    likes: 24, comments: 18, saved: false, liked: false,
  },
  {
    id: "p2",
    body: "Some days I feel so overwhelmed that I just want to disappear. Anyone else feel this way? 💜",
    tags: ["Mental Health"],
    emoji: "🌙",
    at: iso(5 * 60 * 60 * 1000),
    likes: 31, comments: 12, saved: false, liked: false,
  },
  {
    id: "p3",
    body: "You're stronger than you think. One day at a time. 🌈",
    tags: ["Motivation"],
    emoji: "✨",
    at: iso(day),
    likes: 45, comments: 9, saved: true, liked: true,
  },
];

export const SEED_CONTACTS: Contact[] = [
  { id: "c1", name: "Mom", relationship: "Mother", phone: "+91 98765 43210", avatarHue: 340 },
  { id: "c2", name: "Brother", relationship: "Brother", phone: "+91 91234 56789", avatarHue: 270 },
  { id: "c3", name: "Best Friend", relationship: "Close Friend", phone: "+91 99887 66554", avatarHue: 30 },
  { id: "c4", name: "Dad", relationship: "Father", phone: "+91 90000 11122", avatarHue: 150 },
];

export const SEED_MEDICAL: Record<string, MedicalItem[]> = {
  chronic: [
    { id: "ch1", title: "Migraine", detail: "Diagnosed on 12 Jan 2022" },
    { id: "ch2", title: "Anxiety", detail: "Diagnosed on 05 Mar 2023" },
    { id: "ch3", title: "Vitamin D Deficiency", detail: "Diagnosed on 20 Aug 2023" },
  ],
  allergies: [
    { id: "a1", title: "Dust Allergy", detail: "Triggered by household dust", tag: "Mild" },
    { id: "a2", title: "Pollen Allergy", detail: "Seasonal", tag: "Moderate" },
    { id: "a3", title: "Peanuts", detail: "Strict avoidance", tag: "Severe" },
  ],
  illnesses: [
    { id: "i1", title: "Typhoid Fever", detail: "June 2021" },
    { id: "i2", title: "Viral Fever", detail: "Dec 2022" },
  ],
  medications: [
    { id: "med1", title: "Vitamin D3", detail: "1000 IU · Daily" },
    { id: "med2", title: "Magnesium", detail: "Once a day" },
  ],
  notes: [],
};
