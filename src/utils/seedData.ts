import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { Firestore } from 'firebase/firestore';

export async function seedDatabase(db: Firestore) {
  const now = Timestamp.now();
  const sevenDaysFromNow = Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  const thirtyDaysFromNow = Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
  const threeDaysFromNow = Timestamp.fromDate(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000));
  const fourteenDaysFromNow = Timestamp.fromDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000));
  const tenDaysFromNow = Timestamp.fromDate(new Date(Date.now() + 10 * 24 * 60 * 60 * 1000));
  const fortyFiveDaysFromNow = Timestamp.fromDate(new Date(Date.now() + 45 * 24 * 60 * 60 * 1000));

  try {
    // 1. Seed NGOs
    const ngos = [
      {
        userId: "ngo_001",
        name: "HopeReach Foundation",
        email: "admin@hoperreach.org",
        ngoName: "HopeReach Foundation",
        roles: ["NGO"],
        location: { city: "Mumbai", state: "Maharashtra", country: "India", lat: 19.0760, lng: 72.8777 },
        createdAt: now
      },
      {
        userId: "ngo_002",
        name: "GlobalAid Network",
        email: "ops@globalaid.net",
        ngoName: "GlobalAid Network",
        roles: ["NGO"],
        location: { city: "Nairobi", state: "Nairobi County", country: "Kenya", lat: -1.2921, lng: 36.8219 },
        createdAt: now
      },
      {
        userId: "ngo_003",
        name: "EduBridge India",
        email: "contact@edubridge.in",
        ngoName: "EduBridge India",
        roles: ["NGO"],
        location: { city: "Chennai", state: "Tamil Nadu", country: "India", lat: 13.0827, lng: 80.2707 },
        createdAt: now
      }
    ];

    for (const ngo of ngos) {
      await setDoc(doc(db, 'users', ngo.userId), ngo);
      console.log(`Seeded NGO: ${ngo.name}`);
    }

    // 2. Seed Volunteers
    const volunteers = [
      {
        userId: "vol_001",
        name: "Arjun Mehta",
        email: "arjun@example.com",
        roles: ["Volunteer"],
        location: { city: "Pune", state: "Maharashtra", country: "India", lat: 18.5204, lng: 73.8567 },
        skills: ["Medical", "First Aid", "CPR"],
        availability: "weekends",
        reputationScore: 4.7,
        badges: [{ badgeId: "b1", label: "Health Hero", icon: "🏥", earnedAt: now }]
      },
      {
        userId: "vol_002",
        name: "Priya Nair",
        email: "priya@example.com",
        roles: ["Volunteer"],
        location: { city: "Bangalore", state: "Karnataka", country: "India", lat: 12.9716, lng: 77.5946 },
        skills: ["Teaching", "Curriculum Design", "Mentoring"],
        availability: "both",
        reputationScore: 4.9,
        badges: [{ badgeId: "b2", label: "Edu Champion", icon: "📚", earnedAt: now }]
      },
      {
        userId: "vol_003",
        name: "Samuel Oduya",
        email: "samuel@example.com",
        roles: ["Volunteer"],
        location: { city: "Nairobi", state: "Nairobi County", country: "Kenya", lat: -1.3032, lng: 36.8073 },
        skills: ["Logistics", "Supply Chain", "Disaster Relief"],
        availability: "flexible",
        reputationScore: 4.5,
        badges: []
      },
      {
        userId: "vol_004",
        name: "Fatima Al-Hassan",
        email: "fatima@example.com",
        roles: ["Volunteer"],
        location: { city: "Lagos", state: "Lagos State", country: "Nigeria", lat: 6.5244, lng: 3.3792 },
        skills: ["Counselling", "Mental Health", "Community Outreach"],
        availability: "weekdays",
        reputationScore: 4.2,
        badges: []
      },
      {
        userId: "vol_005",
        name: "Mei Lin",
        email: "mei@example.com",
        roles: ["Volunteer"],
        location: { city: "Chennai", state: "Tamil Nadu", country: "India", lat: 13.0674, lng: 80.2376 },
        skills: ["Teaching", "English", "Literacy"],
        availability: "weekends",
        reputationScore: 4.8,
        badges: [{ badgeId: "b3", label: "Literacy Star", icon: "⭐", earnedAt: now }]
      }
    ];

    for (const vol of volunteers) {
      await setDoc(doc(db, 'users', vol.userId), vol);
      console.log(`Seeded Volunteer: ${vol.name}`);
    }

    // 3. Seed Needs
    const needs = [
      {
        needId: "need_001",
        title: "Emergency Medical Volunteers — Flood Relief",
        category: "health",
        description: "Urgent need for trained medical volunteers to assist flood-affected communities in coastal Maharashtra. Tasks include triage, wound care, and health monitoring.",
        location: { city: "Ratnagiri", state: "Maharashtra", country: "India", lat: 16.9944, lng: 73.3120 },
        urgency: "critical",
        volunteersNeeded: 20,
        skillsRequired: ["Medical", "First Aid", "CPR"],
        deadline: sevenDaysFromNow,
        remote: false,
        status: "open",
        ngoId: "ngo_001",
        ngoName: "HopeReach Foundation",
        volunteersAssigned: ["vol_001"],
        volunteersCount: 1,
        createdAt: now,
        aiInsights: "Critical flood relief operation requiring immediate medical personnel. High mortality risk if unaddressed within 48 hours.",
        duplicateFlag: false
      },
      {
        needId: "need_002",
        title: "Online Tutors for Underprivileged Children",
        category: "education",
        description: "Volunteer online tutors needed for grades 5–10. Subjects: Mathematics, Science, English. Sessions 2 hours/week via Zoom.",
        location: { city: "Chennai", state: "Tamil Nadu", country: "India", lat: 13.0827, lng: 80.2707 },
        urgency: "moderate",
        volunteersNeeded: 15,
        skillsRequired: ["Teaching", "Mentoring"],
        deadline: thirtyDaysFromNow,
        remote: true,
        status: "open",
        ngoId: "ngo_003",
        ngoName: "EduBridge India",
        volunteersAssigned: ["vol_002", "vol_005"],
        volunteersCount: 2,
        createdAt: now,
        aiInsights: "Remote education initiative with strong long-term community impact. Good match for teaching-skilled volunteers.",
        duplicateFlag: false
      },
      {
        needId: "need_003",
        title: "Food Distribution Drive — Nairobi Slums",
        category: "food",
        description: "Volunteers needed to assist with packing and distributing food rations to 500 families in Kibera. Physical work, 6-hour shifts.",
        location: { city: "Nairobi", state: "Nairobi County", country: "Kenya", lat: -1.3132, lng: 36.7965 },
        urgency: "high",
        volunteersNeeded: 30,
        skillsRequired: ["Logistics", "Community Outreach"],
        deadline: threeDaysFromNow,
        remote: false,
        status: "in_progress",
        ngoId: "ngo_002",
        ngoName: "GlobalAid Network",
        volunteersAssigned: ["vol_003"],
        volunteersCount: 1,
        createdAt: now,
        aiInsights: "High-urgency food security intervention. Logistics and physical coordination are the primary requirement.",
        duplicateFlag: false
      },
      {
        needId: "need_004",
        title: "Mental Health Support — Refugee Camp",
        category: "health",
        description: "Trained counsellors needed to provide psychosocial support to refugees in Lagos. Sessions are confidential, in-person.",
        location: { city: "Lagos", state: "Lagos State", country: "Nigeria", lat: 6.5244, lng: 3.3792 },
        urgency: "high",
        volunteersNeeded: 8,
        skillsRequired: ["Counselling", "Mental Health"],
        deadline: fourteenDaysFromNow,
        remote: false,
        status: "open",
        ngoId: "ngo_002",
        ngoName: "GlobalAid Network",
        volunteersAssigned: ["vol_004"],
        volunteersCount: 1,
        createdAt: now,
        aiInsights: "Mental health needs in refugee populations are critically underserved. Counselling volunteers will have direct measurable impact.",
        duplicateFlag: false
      },
      {
        needId: "need_005",
        title: "Shelter Construction — Post-Cyclone Odisha",
        category: "shelter",
        description: "Volunteers with construction or carpentry skills needed to help rebuild homes damaged by Cyclone Dana in coastal Odisha.",
        location: { city: "Bhubaneswar", state: "Odisha", country: "India", lat: 20.2961, lng: 85.8245 },
        urgency: "critical",
        volunteersNeeded: 40,
        skillsRequired: ["Construction", "Carpentry", "Labour"],
        deadline: tenDaysFromNow,
        remote: false,
        status: "open",
        ngoId: "ngo_001",
        ngoName: "HopeReach Foundation",
        volunteersAssigned: [],
        volunteersCount: 0,
        createdAt: now,
        aiInsights: "Post-disaster shelter reconstruction is time-sensitive. Priority escalation recommended if volunteer count stays at 0.",
        duplicateFlag: false
      },
      {
        needId: "need_006",
        title: "Environmental Survey — Mangrove Restoration",
        category: "environment",
        description: "Volunteers needed to conduct field surveys and assist with mangrove sapling planting along the Tamil Nadu coastline.",
        location: { city: "Cuddalore", state: "Tamil Nadu", country: "India", lat: 11.7447, lng: 79.7689 },
        urgency: "low",
        volunteersNeeded: 10,
        skillsRequired: ["Environment", "Field Survey", "Data Collection"],
        deadline: fortyFiveDaysFromNow,
        remote: false,
        status: "open",
        ngoId: "ngo_003",
        ngoName: "EduBridge India",
        volunteersAssigned: [],
        volunteersCount: 0,
        createdAt: now,
        aiInsights: "Long-term ecological restoration project. Low urgency but high sustainability value.",
        duplicateFlag: false
      }
    ];

    for (const need of needs) {
      await setDoc(doc(db, 'needs', need.needId), need);
      console.log(`Seeded Need: ${need.title}`);
    }

    // 4. Seed Datasets
    const datasets = [
      {
        datasetId: "ds_001",
        title: "India Flood Relief Needs 2024",
        category: "health",
        description: "Aggregated field survey data from 12 NGOs covering medical, shelter and food needs across flood-affected Maharashtra and Assam districts.",
        visibility: "public",
        fileType: "csv",
        uploadedBy: "ngo_001",
        uploaderName: "HopeReach Foundation",
        uploadedAt: now,
        aiSummary: "Dataset covers 1,200 surveyed households. Critical medical need identified in 34% of cases. Shelter gap affects 58% of surveyed population.",
        tags: ["flood", "Maharashtra", "medical", "shelter", "2024"]
      },
      {
        datasetId: "ds_002",
        title: "East Africa Food Security Index Q1 2025",
        category: "food",
        description: "Monthly food security scores for 8 counties in Kenya and Tanzania, compiled from WFP field reports and NGO submissions.",
        visibility: "public",
        fileType: "json",
        uploadedBy: "ngo_002",
        uploaderName: "GlobalAid Network",
        uploadedAt: now,
        aiSummary: "Kibera and Mathare report the lowest food security scores (2.1/10). Trend shows 14% month-on-month deterioration since December 2024.",
        tags: ["Kenya", "Tanzania", "food security", "WFP", "2025"]
      },
      {
        datasetId: "ds_003",
        title: "Tamil Nadu Literacy Gap Report 2023",
        category: "education",
        description: "District-level literacy data for Tamil Nadu covering 32 districts. Cross-referenced with school dropout rates and volunteer tutor demand.",
        visibility: "public",
        fileType: "pdf",
        uploadedBy: "ngo_003",
        uploaderName: "EduBridge India",
        uploadedAt: now,
        aiSummary: "Villupuram and Ramanathapuram districts show highest dropout rates (22% and 19%). Tutor demand exceeds supply by 3x in rural clusters.",
        tags: ["Tamil Nadu", "literacy", "education", "dropout", "2023"]
      }
    ];

    for (const dataset of datasets) {
      await setDoc(doc(db, 'datasets', dataset.datasetId), dataset);
      console.log(`Seeded Dataset: ${dataset.title}`);
    }

    return true;
  } catch (error) {
    console.error("Seeding error:", error);
    throw error;
  }
}

export async function checkIfSeeded(db: Firestore) {
  try {
    const docSnap = await getDoc(doc(db, 'needs', 'need_001'));
    return docSnap.exists();
  } catch (error) {
    console.error("Check if seeded error:", error);
    return false;
  }
}
