import { collection, addDoc, setDoc, doc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';

const SAMPLE_NEEDS = [
  {
    title: "Emergency Food Distribution",
    category: "Food Security",
    description: "Urgent need for food packets for 500 families affected by local lockdowns in the suburban areas. We need volunteers for packaging and last-mile delivery.",
    location: { city: "Mumbai", state: "Maharashtra", country: "India", lat: 19.0760, lng: 72.8777 },
    urgency: "Critical",
    volunteersNeeded: 50,
    skillsRequired: ["Logistics", "Communication"],
    deadline: "2026-05-01T10:00:00Z",
    remote: false,
    status: "Open",
    createdAt: new Date().toISOString(),
    volunteersAssigned: []
  },
  {
    title: "Primary School Tutoring",
    category: "Education",
    description: "Seeking volunteers to teach basic English and Mathematics to children in rural primary schools. Weekend commitment required.",
    location: { city: "Jaipur", state: "Rajasthan", country: "India", lat: 26.9124, lng: 75.7873 },
    urgency: "Moderate",
    volunteersNeeded: 15,
    skillsRequired: ["Teaching", "Languages"],
    deadline: "2026-06-15T00:00:00Z",
    remote: false,
    status: "Open",
    createdAt: new Date().toISOString(),
    volunteersAssigned: []
  },
  {
    title: "Mobile Health Camp",
    category: "Health",
    description: "Organizing a free health check-up camp for elderly citizens. We need medical students or professionals to assist doctors.",
    location: { city: "Bangalore", state: "Karnataka", country: "India", lat: 12.9716, lng: 77.5946 },
    urgency: "High",
    volunteersNeeded: 20,
    skillsRequired: ["Medical", "First Aid"],
    deadline: "2026-04-30T18:00:00Z",
    remote: false,
    status: "In Progress",
    createdAt: new Date().toISOString(),
    volunteersAssigned: []
  },
  {
    title: "Reforestation Drive",
    category: "Environment",
    description: "Join us for a massive tree plantation drive in the city outskirts to improve green cover. Open to all age groups.",
    location: { city: "Pune", state: "Maharashtra", country: "India", lat: 18.5204, lng: 73.8567 },
    urgency: "Low",
    volunteersNeeded: 100,
    skillsRequired: ["Physical Labor"],
    deadline: "2026-07-20T08:00:00Z",
    remote: false,
    status: "Open",
    createdAt: new Date().toISOString(),
    volunteersAssigned: []
  },
  {
    title: "Flood Relief Coordination",
    category: "Disaster Relief",
    description: "Coordinating rescue and relief operations for flood-hit districts. Need volunteers for data entry and call center support.",
    location: { city: "Chennai", state: "Tamil Nadu", country: "India", lat: 13.0827, lng: 80.2707 },
    urgency: "Critical",
    volunteersNeeded: 30,
    skillsRequired: ["Data Entry", "Communication"],
    deadline: "2026-04-25T12:00:00Z",
    remote: true,
    status: "Open",
    createdAt: new Date().toISOString(),
    volunteersAssigned: []
  },
  {
    title: "Mental Health Support Line",
    category: "Health",
    description: "Providing emotional support and crisis intervention via a 24/7 helpline. Training will be provided.",
    location: { city: "Delhi", state: "Delhi", country: "India", lat: 28.6139, lng: 77.2090 },
    urgency: "High",
    volunteersNeeded: 10,
    skillsRequired: ["Counseling", "Empathy"],
    deadline: "2026-05-30T00:00:00Z",
    remote: true,
    status: "Open",
    createdAt: new Date().toISOString(),
    volunteersAssigned: []
  },
  {
    title: "Clean Water Initiative",
    category: "Environment",
    description: "Installing water filtration systems in remote villages to ensure access to safe drinking water.",
    location: { city: "Kolkata", state: "West Bengal", country: "India", lat: 22.5726, lng: 88.3639 },
    urgency: "Moderate",
    volunteersNeeded: 25,
    skillsRequired: ["Plumbing", "Community Outreach"],
    deadline: "2026-08-10T00:00:00Z",
    remote: false,
    status: "Open",
    createdAt: new Date().toISOString(),
    volunteersAssigned: []
  }
];

export const seedService = {
  seedSampleData: async (ngoId: string) => {
    try {
      // Check if we already have needs to avoid over-seeding
      const q = query(collection(db, 'needs'), where('ngoId', '==', ngoId));
      const snapshot = await getDocs(q);
      
      if (snapshot.size > 0) {
        console.log("Sample data already exists for this NGO.");
        return;
      }

      const promises = SAMPLE_NEEDS.map(need => 
        addDoc(collection(db, 'needs'), {
          ...need,
          ngoId: ngoId,
          createdAt: new Date()
        })
      );

      await Promise.all(promises);
      console.log("Sample data seeded successfully!");
    } catch (error) {
      console.error("Error seeding data:", error);
      throw error;
    }
  }
};
