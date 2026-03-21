import { Link } from "react-router";
import {
  FaUsers,
  FaRocket,
} from "react-icons/fa";
import { HiOutlineArrowNarrowRight } from "react-icons/hi";

const HomePage = () => {
  return (
    <div className="min-h-screen w-full bg-[#fafafa]">

      {/* Top Accent */}
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-blue-400/60 to-transparent" />

      <div className="relative min-h-screen flex items-center justify-center px-6">

        <div className="w-full max-w-5xl text-center">

          {/* Badge */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-200 bg-blue-50 text-blue-700 text-xs font-semibold">
              <FaRocket className="h-4 w-4" />
              SUDHOSAN SKILL SOLUTIONS
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-[38px] md:text-[54px] font-extrabold leading-tight font-serif text-[#FF7A00] mb-1">
            Sudhosan Skill Solutions
          </h1>
          <p className="text-base md:text-xl font-medium text-slate-600 mb-8 tracking-wide">
            DREAM <span className="text-[#2563eb] font-bold">|</span> DISCOVER <span className="text-[#2563eb] font-bold">|</span> DELIVER
          </p>

          {/* Main CTA */}
          <div className="mt-10 flex flex-col items-center gap-4">

            <Link
              to="/admin"
              className="group inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg shadow-lg transition-all"
            >
              <FaUsers className="h-5 w-5" />
              Enter Admin Dashboard
              <HiOutlineArrowNarrowRight className="h-5 w-5 group-hover:translate-x-1 transition" />
            </Link>

          </div>

          {/* Footer */}
          <div className="mt-6 text-xs text-slate-300">
            © {new Date().getFullYear()} Sudhosan Skill Solutions. All rights reserved.
          </div>

        </div>

      </div>
    </div>
  );
};

export default HomePage;
