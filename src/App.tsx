import { BrowserRouter as Router, Routes, Route } from "react-router";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// import SignIn from "./pages/SuperAdminPages/AuthPages/SignIn";

import NotFound from "./pages/SuperAdminPages/OtherPage/NotFound";
import Videos from "./pages/SuperAdminPages/UiElements/Videos";
import Images from "./pages/SuperAdminPages/UiElements/Images";
import Alerts from "./pages/SuperAdminPages/UiElements/Alerts";
import Badges from "./pages/SuperAdminPages/UiElements/Badges";
import Avatars from "./pages/SuperAdminPages/UiElements/Avatars";
import Buttons from "./pages/SuperAdminPages/UiElements/Buttons";
import LineChart from "./pages/SuperAdminPages/Charts/LineChart";
import BarChart from "./pages/SuperAdminPages/Charts/BarChart";
import Calendar from "./pages/SuperAdminPages/Calendar";
import BasicTables from "./pages/SuperAdminPages/Tables/BasicTables";
import FormElements from "./pages/SuperAdminPages/Forms/FormElements";
import Blank from "./pages/SuperAdminPages/Blank";
import { ScrollToTop } from "./components/common/ScrollToTop";
// import Home from "./pages/SuperAdminPages/Dashboard/Home";
// import SubAdminSignIn from "./pages/SuperAdminPages/AuthPages/SubAdmin/SignIn";

import SubAdminAppLayout from "./layout/Admin/AppLayout";

// import UploadedExcelSheets from "./pages/SubAdminPages/UploadedExcelSheets/UploadedExcelSheets";

import HomePage from "./pages/HomePage";

import SubAdminHome from "./pages/AdminPages/Dashboard/Home";



import AdminProfile from "./pages/AdminPages/ProfilePage/AdminProfile";
import LogOutAdmin from "./pages/AdminPages/LogOutAdmin";
import AdminSignInPage from "./pages/AuthPages/AdminSignInPage";


import Services from "./pages/AdminPages/Services/Services";
import AutoShopOwnerOnboarding from "./pages/AutoShopOwnerOnboarding";
import Jobs from "./pages/AdminPages/Jobs/Jobs";
import Cources from "./pages/AdminPages/Cources/Cources";
import Blogs from "./pages/AdminPages/Blogs/Blogs";
import SubscribedUsersPage from "./pages/AdminPages/SubscribedUsers";
import Testimonials from "./pages/AdminPages/Testimonials/Testimonials";
import TeamMembers from "./pages/AdminPages/TeamMembers/TeamMembers";
import StatsAndClientAdmin from "./pages/AdminPages/StatsAndClients/StatsAndClient";


export default function App() {
  return (
    <>
      <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <Router >
        <ScrollToTop />
        
        <Routes>
          <Route index path="/" element={<HomePage />} />
          {/* Dashboard Layout */}
          {/* <Route element={<AppLayout />}>
         
            <Route index path="/super-admin" element={<SubAdminHome />} />
            <Route path="/super-admin/all-users" element={<AllUsers />} />
            <Route path="/super-admin/all-appointments" element={<AllAppointments />} />
            <Route path="/super-admin/onboard-sub-admin" element={<OnboardSubAdmin />} />
            <Route path="/super-admin/therapy-types" element={<TherapyTypesPage />} />
            <Route path="/super-admin/packages" element={<PackagesPage />} />
            <Route path="/super-admin/discount-coupons" element={<ManageDiscounts />} />
            <Route path="/super-admin/audit-logs" element={<AllLogs/>} />
            <Route path="/super-admin/finances" element={<FinancesSuperAdminPage/>} />
            <Route path="/super-admin/full-calendar" element={<SuperAdminFullCalendar/>} />
            <Route path="/super-admin/therapists" element={<SuperAdminTherapistsPage/>} />




            <Route path="/super-admin/profile" element={<SuperAdminProfile />} />
            <Route path="/super-admin/logout" element={<LogOutSuperAdmin />} />
       
          </Route> */}

          <Route element={<SubAdminAppLayout />}>
            <Route index path="/admin" element={<SubAdminHome />} />
         
            <Route path="/admin/services" element={<Services />} />
            <Route path="/admin/jobs" element={<Jobs />} />
            <Route path="/admin/cources" element={<Cources />} />
            <Route path="/admin/blogs" element={<Blogs />} />
            <Route path="/admin/subscribed-users" element={<SubscribedUsersPage />} />
            <Route path="/admin/testimonials" element={<Testimonials />} />
            <Route path="/admin/team-members" element={<TeamMembers />} />
            <Route path="/admin/stats-and-clients" element={<StatsAndClientAdmin />} />







            <Route path="/admin/profile" element={<AdminProfile />} />

            <Route path="/admin/logout" element={<LogOutAdmin />} />
          </Route>


          <Route path="/admin/signin" element={<AdminSignInPage />} />

          <Route path="/auto-shop-owner/onboarding" element={<AutoShopOwnerOnboarding />} />




         {/*  <Route element={<SupervisorAppLayout />}>
            <Route index path="/therapist" element={<SupervisorHome />} />
            <Route path="/therapist/appointments" element={<TherapistMyAppointments />} />
            <Route path="/therapist/calendar" element={<CalendarAndSchedule />} />
            <Route path="/therapist/earnings" element={<MyEarningsTherapist/>} />
            <Route path="/therapist/profile" element={<TherpaistProfile />} />
            <Route path="/therapist/earnings" element={<MyEarningsTherapist/>} />
          

          </Route> */}

          {/* <Route path="/therapist/signup" element={<TherapistSignUp />} />
          <Route path="/therapist/complete-profile" element={<CompleteProfilePage />} />
          <Route path="/therapist/pending-approval" element={<ApprovalPending/>} />
          <Route path="/therapist/logout" element={<LogOutTherapist/>} /> */}


          {/* <Route  element={<ParentAppLayout />}>
            <Route index path="/user" element={<ParentDashboard />} />
            <Route index path="/tasks" element={<AllTasks />} />
            <Route index path="/referral" element={<Referrals />} />
            <Route index path="/promotional-page" element={<PromotionalIncomePage />} />
            <Route index path="/rewards" element={<Rewards />} />

            <Route path="/user/profile" element={<ParentProfile />} />
            <Route path="/wallet-history" element={<WalletAndHistory />} />
          





            <Route path="/user/children" element={<MyChildrens />} />
            <Route path="/user/appointments" element={<MyChildrenAppointmentsPage  />} />
            <Route path="/user/invoices-payments" element={<InvoiveAndPaymentsPage/>} />
            <Route path="/user/request-appointment" element={<RequestAppointment />} />
            <Route path="/user/request-edit-appointment" element={<RequestEditAppointments />} />


          </Route>        */}
{/* 
          <Route path="/user/signup" element={<ParentSignUp />} />
          <Route path="/user/complete-parent-profile" element={<ParentCompleteProfile />} />
          <Route path="/user/logout" element={<LogOutParent />} /> */}



          {/* <Route path="/signin" element={<AuthPage />} />
          <Route path="/signup" element={<SignUpPage/>} />
          <Route path="/complete-kyc" element={<CompleteKYC />} />
          <Route path="/kyc-pending" element={<KycApprovalPending />} />
          <Route path="/purchase-package" element={<PurchasePackage />} /> */}
        
          {/* <Route path="/privacy-policy" element={<PrivacyPolicy />} /> */}

          {/* <Route path="/sub-admin/signup" element={<SubAdminSignUpForm />} /> */}

          <Route path="/calendar" element={<Calendar />} />
            <Route path="/blank" element={<Blank />} />


            <Route path="/form-elements" element={<FormElements />} />


            <Route path="/basic-tables" element={<BasicTables />} />


            <Route path="/alerts" element={<Alerts />} />
            <Route path="/avatars" element={<Avatars />} />
            <Route path="/badge" element={<Badges />} />
            <Route path="/buttons" element={<Buttons />} />
            <Route path="/images" element={<Images />} />
            <Route path="/videos" element={<Videos />} />


            <Route path="/line-chart" element={<LineChart />} />
            <Route path="/bar-chart" element={<BarChart />} />

          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </>
  );
}
