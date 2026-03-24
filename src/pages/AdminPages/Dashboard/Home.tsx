import { useEffect, useState } from "react";
import PageMeta from "../../../components/common/PageMeta";

// DashboardCounts type for stat cards and detail data
type DashboardCounts = {
  services: number;
  jobs: number;
  courses: number;
  blogs: number;
  subscribedUsers: number;
  testimonials: any[];
  teamMembers: any[];
  stats: any[];
  clients: any[];
};

const API_URL = import.meta.env.VITE_API_URL;

const statCards: {
  key: keyof DashboardCounts;
  label: string;
  color: string;
  count?: (data: DashboardCounts) => number;
}[] = [
  { key: "services", label: "Services", color: "border-blue-600" },
  { key: "jobs", label: "Jobs", color: "border-green-600" },
  { key: "courses", label: "Courses", color: "border-purple-600" },
  { key: "blogs", label: "Blogs", color: "border-yellow-400" },
  { key: "subscribedUsers", label: "Newsletter Subscribers", color: "border-indigo-400" },
  {
    key: "testimonials",
    label: "Testimonials",
    color: "border-pink-500",
    count: (data) => data.testimonials?.length || 0,
  },
  {
    key: "teamMembers",
    label: "Team Members",
    color: "border-teal-400",
    count: (data) => data.teamMembers?.length || 0,
  },
  {
    key: "stats",
    label: "Stats Cards",
    color: "border-orange-400",
    count: (data) => data.stats?.length || 0,
  },
  {
    key: "clients",
    label: "Clients/Partners",
    color: "border-lime-600",
    count: (data) => data.clients?.length || 0,
  },
];

// Example dashboardData as fallback/mock data if API fails
const EXAMPLE_DASHBOARD_DATA: DashboardCounts = {
  services: 5,
  jobs: 8,
  courses: 10,
  blogs: 4,
  subscribedUsers: 4,
  testimonials: [
    {
      _id: "69c18d266def155c42e07429",
      name: "Ajeet Patel",
      rating: 5,
      feedback:
        "I had a very positive experience with Sudhosan Skill Solutions. The training programs and HR-related support services were highly practical, well-structured, and aligned with current industry requirements.",
      image: "https://example.com/avatar1.jpg",
      companyName: "Sudhosan Skill Solutions",
      createdAt: "2026-03-23T18:57:42.509Z",
      __v: 0,
    },
    {
      _id: "69c18d266def155c42e07430",
      name: "Anjali Kumari",
      rating: 5,
      feedback:
        "The counselling session helped me identify my strengths and gave me a clear direction for my career. I now feel confident about the decisions I need to make for my future.",
      image: "https://example.com/avatar2.jpg",
      companyName: "Sudhosan Skill Solutions",
      createdAt: "2026-03-23T18:57:42.509Z",
      __v: 0,
    },
    {
      _id: "69c18d266def155c42e07431",
      name: "Ranjan Yadav",
      rating: 4,
      feedback:
        "I engaged with Sudhosan Skill Solutions for remote work opportunities and was impressed by their professionalism and clear communication.",
      image: "https://example.com/avatar3.jpg",
      companyName: "Sudhosan Skill Solutions",
      createdAt: "2026-03-23T18:57:42.509Z",
      __v: 0,
    },
    {
      _id: "69c18d266def155c42e07432",
      name: "Muskan Gupta",
      rating: 4,
      feedback:
        "Their guidance and understanding of my career goals made all the difference. I highly recommend Sudhosan Skill Solutions to anyone searching for job opportunities.",
      image: "https://example.com/avatar4.jpg",
      companyName: "Sudhosan Skill Solutions",
      createdAt: "2026-03-23T18:57:42.509Z",
      __v: 0,
    },
    {
      _id: "69c18d266def155c42e07433",
      name: "Varsha Kumari",
      rating: 5,
      feedback:
        "Extremely satisfied with the career guidance at Sudhosan Skill Solutions. They provided a clear roadmap to kickstart my career after graduation.",
      image: "https://example.com/avatar5.jpg",
      companyName: "Sudhosan Skill Solutions",
      createdAt: "2026-03-23T18:57:42.509Z",
      __v: 0,
    },
    {
      _id: "69c18d266def155c42e07434",
      name: "Vinit",
      rating: 5,
      feedback:
        "Fantastic experience! Very supportive team, clear communication, and great opportunities for career advancement.",
      image: "https://example.com/avatar6.jpg",
      companyName: "Sudhosan Skill Solutions",
      createdAt: "2026-03-23T18:57:42.509Z",
      __v: 0,
    },
    {
      _id: "69c18d266def155c42e07435",
      name: "Sanjay Prasad",
      rating: 5,
      feedback: "Excellent experience. The skills I learned here directly helped me secure a job.",
      image: "https://example.com/avatar7.jpg",
      companyName: "Sudhosan Skill Solutions",
      createdAt: "2026-03-23T18:57:42.509Z",
      __v: 0,
    },
  ],
  teamMembers: [
    {
      _id: "69c192ebdf8bea984115311e",
      name: "Subodh Kumar",
      role: "Founder & Director",
      image: "/team/SubodhKumar.png",
      description:
        "An Assistant Professor and Research Scholar with over 4+ years of experience in the education sector. His expertise lies in academic leadership, research, and skill development initiatives.",
      border: "orange",
      createdAt: "2026-03-23T19:22:19.298Z",
      updatedAt: "2026-03-24T12:33:18.093Z",
      __v: 0,
    },
    {
      _id: "69c192ebdf8bea984115311f",
      name: "Sudhir Kumar",
      role: "Co-Founder & Director",
      image: "/team/SudhirKumar.png",
      description:
        "Holds a Master’s degree in Finance with specialization in Strategy and Operations, bringing strong expertise in financial planning, strategic management, and business operations.",
      border: "orange",
      createdAt: "2026-03-23T19:22:19.298Z",
      updatedAt: "2026-03-23T19:22:19.298Z",
      __v: 0,
    },
    {
      _id: "69c192ebdf8bea9841153120",
      name: "Ajeet Prasad Kurmi",
      role: "Head – Human Resources",
      image: "/team/AjeetPrasadKurmi.png",
      description:
        "Manages recruitment, employee relations, and workforce management. Plays a key role in building a strong organizational culture and ensuring smooth HR operations.",
      border: "blue",
      createdAt: "2026-03-23T19:22:19.298Z",
      updatedAt: "2026-03-23T19:22:19.298Z",
      __v: 0,
    },
    {
      _id: "69c192ebdf8bea9841153121",
      name: "Gaurav Kumar Sinha",
      role: "Head – Project Management",
      image: "/team/GauravKumarSinha.png",
      description:
        "Holding a Master’s degree in Finance with over 2+ years of experience, he oversees project planning, execution, and coordination to ensure successful and efficient project delivery.",
      border: "blue",
      createdAt: "2026-03-23T19:22:19.298Z",
      updatedAt: "2026-03-23T19:22:19.298Z",
      __v: 0,
    },
    {
      _id: "69c192ebdf8bea9841153122",
      name: "Anubhav Singh",
      role: "Head – Outreach & Partnerships",
      image: "/team/AnubhavSingh.png",
      description:
        "With a Master’s degree in Finance and Marketing and over 2+ years of experience, he focuses on building strategic collaborations, expanding networks, developing partnerships, and strengthening organizational visibility.",
      border: "blue",
      createdAt: "2026-03-23T19:22:19.298Z",
      updatedAt: "2026-03-23T19:22:19.298Z",
      __v: 0,
    },
  ],
  stats: [
    {
      label: "Candidates Placed",
      valueNum: 100,
      valueSuffix: "+",
      icon: "briefcase",
      color: "#f97316",
      _id: "69c1981d490fd7b606c2dd1e",
      createdAt: "2026-03-23T19:44:29.218Z",
      updatedAt: "2026-03-23T19:44:29.218Z",
    },
    {
      label: "Partner Companies",
      valueNum: 10,
      valueSuffix: "+",
      icon: "building",
      color: "#3b82f6",
      _id: "69c1981d490fd7b606c2dd1f",
      createdAt: "2026-03-23T19:44:29.218Z",
      updatedAt: "2026-03-23T19:44:29.218Z",
    },
    {
      label: "Colleges Connected",
      valueNum: 5,
      valueSuffix: "+",
      icon: "university",
      color: "#16a34a",
      _id: "69c1981d490fd7b606c2dd20",
      createdAt: "2026-03-23T19:44:29.218Z",
      updatedAt: "2026-03-23T19:44:29.218Z",
    },
    {
      label: "Students Trained",
      valueNum: 100,
      valueSuffix: "+",
      icon: "user-graduate",
      color: "#a855f7",
      _id: "69c1981d490fd7b606c2dd21",
      createdAt: "2026-03-23T19:44:29.218Z",
      updatedAt: "2026-03-23T19:44:29.218Z",
    },
    {
      label: "Cities Served",
      valueNum: 5,
      valueSuffix: "+",
      icon: "map-marker-alt",
      color: "#eab308",
      _id: "69c1981d490fd7b606c2dd22",
      createdAt: "2026-03-23T19:44:29.218Z",
      updatedAt: "2026-03-23T19:44:29.218Z",
    },
    {
      label: "Placement Support",
      valueNum: 100,
      valueSuffix: "%",
      icon: "verified",
      color: "#10b981",
      _id: "69c1981d490fd7b606c2dd23",
      createdAt: "2026-03-23T19:44:29.218Z",
      updatedAt: "2026-03-23T19:44:29.218Z",
    },
    {
      label: "Job-Ready Courses",
      valueNum: 10,
      valueSuffix: "+",
      icon: "bookmarks",
      color: "#ec4899",
      _id: "69c1981d490fd7b606c2dd24",
      createdAt: "2026-03-23T19:44:29.218Z",
      updatedAt: "2026-03-23T19:44:29.218Z",
    },
  ],
  clients: [
    {
      name: "Future Sparks",
      logo: "/client/fs.png",
      alt: "Future Sparks Logo",
      website: "https://futuresparks.com",
      _id: "69c19834490fd7b606c2dd25",
      createdAt: "2026-03-23T19:44:52.937Z",
      updatedAt: "2026-03-23T19:44:52.937Z",
    },
    {
      name: "Kiza Textiles",
      logo: "/client/kiza.avif",
      alt: "Kiza Textiles Logo",
      website: "https://kizatextiles.com",
      _id: "69c19834490fd7b606c2dd26",
      createdAt: "2026-03-23T19:44:52.937Z",
      updatedAt: "2026-03-23T19:44:52.937Z",
    },
    {
      name: "Takniki Shiksha Vidhaan Council",
      logo: "/client/takniki-shiksha.jpeg",
      alt: "Takniki Shiksha Vidhaan Council Logo",
      website: "https://tsvc.org",
      _id: "69c19834490fd7b606c2dd27",
      createdAt: "2026-03-23T19:44:52.937Z",
      updatedAt: "2026-03-23T19:44:52.937Z",
    },
    {
      name: "Awign",
      logo: "/client/awign.svg",
      alt: "Awign Logo",
      website: "https://awign.com",
      _id: "69c19834490fd7b606c2dd28",
      createdAt: "2026-03-23T19:44:52.937Z",
      updatedAt: "2026-03-23T19:44:52.937Z",
    },
    {
      name: "NIT Research Centre",
      logo: "/client/NIT.png",
      alt: "NIT Research Centre Logo",
      website: "https://nitrc.org",
      _id: "69c19834490fd7b606c2dd29",
      createdAt: "2026-03-23T19:44:52.937Z",
      updatedAt: "2026-03-23T19:44:52.937Z",
    },
    {
      name: "Zomato",
      logo: "/client/zomato.avif",
      alt: "Zomato Logo",
      website: "https://zomato.com",
      _id: "69c19834490fd7b606c2dd2a",
      createdAt: "2026-03-23T19:44:52.937Z",
      updatedAt: "2026-03-23T19:44:52.937Z",
    },
  ],
};

export default function AdminDashboardHome() {
  const [dashboardData, setDashboardData] = useState<DashboardCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const url =
      (API_URL ? API_URL.replace(/\/+$/, "") : "") +
      "/api/admin/dashboard-details";
    fetch(url)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.message || "Failed to fetch dashboard data");
        }
        return res.json();
      })
      .then((json) => {
        // Structure as in provided sample, just map direct keys
        if (json && json.services !== undefined) {
          setDashboardData({
            services: json.services ?? 0,
            jobs: json.jobs ?? 0,
            courses: json.courses ?? 0,
            blogs: json.blogs ?? 0,
            subscribedUsers: json.subscribedUsers ?? 0,
            testimonials: Array.isArray(json.testimonials)
              ? json.testimonials
              : [],
            teamMembers: Array.isArray(json.teamMembers)
              ? json.teamMembers
              : [],
            stats: Array.isArray(json.stats) ? json.stats : [],
            clients: Array.isArray(json.clients) ? json.clients : [],
          });
        } else {
          throw new Error(json?.message || "Invalid dashboard response");
        }
      })
      .catch(() => {
        // Use static example data as fallback
        setDashboardData(EXAMPLE_DASHBOARD_DATA);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="h-[85vh] flex flex-col ">
      <PageMeta
        title="Sudhoshan Skill Solutions"
        description="Admin and Sub-Admin Panel for Sudhoshan Skill Solutions"
      />
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center min-h-[200px]">
            <div className="w-10 h-10 border-4 border-t-brand-500 border-gray-200 rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="p-4 text-red-600 bg-red-100 border border-red-300 rounded-md mb-6">
            {error}
          </div>
        ) : (
          <>
            {/* Stat cards showing total counts */}
            <div className="grid grid-cols-1 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-9 gap-4 mb-8">
              {statCards.map((card) => (
                <div
                  key={card.key}
                  className={`bg-white rounded-xl border-l-4 ${card.color} p-5 shadow-sm flex flex-col items-center`}
                >
                  <h3 className="text-xs font-bold text-gray-600 mb-1 text-center">
                    {card.label}
                  </h3>
                  <div className="text-3xl font-bold text-gray-800 text-center">
                    {dashboardData
                      ? typeof (dashboardData as any)[card.key] === "number"
                        ? (dashboardData as any)[card.key]
                        : card.count
                        ? card.count(dashboardData)
                        : "--"
                      : "--"}
                  </div>
                </div>
              ))}
            </div>

            {/* Stat Cards Details Section */}
            <div className="bg-white rounded-xl border shadow p-5 mb-8">
              <h2 className="font-semibold text-lg mb-4">Stats Card Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {dashboardData?.stats?.map((stat: any) => (
                  <div
                    key={stat._id || stat.label}
                    className="flex items-center space-x-4 rounded-lg p-4 border bg-gray-50"
                  >
                    {/* Optionally add a colored icon or badge here */}
                    <div
                      style={{
                        width: 50,
                        height: 50,
                        backgroundColor: stat.color ?? '#eee',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 12,
                        fontSize: 24,
                        color: "#fff",
                        fontWeight: "bold",
                      }}
                    >
                      {/* Simple icon fallback, could use a library if desired */}
                      <span>{stat.icon?.[0]?.toUpperCase() || "★"}</span>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800 flex items-baseline">
                        <span className="text-2xl">
                          {stat.valueNum}
                        </span>
                        <span className="ml-1 text-lg text-gray-500">
                          {stat.valueSuffix}
                        </span>
                      </div>
                      <div className="text-gray-600 text-sm">{stat.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

        
          </>
        )}
      </div>
    </div>
  );
}