
import SupervisorSignInForm from "../../../../components/auth/Supervisor/SignInForm";
import PageMeta from "../../../../components/common/PageMeta";
import SupervisorAuthLayout from "./AuthPageLayout";

export default function SupervisorSignIn() {
  return (
    <>
      <PageMeta
        title="Sudhoshan Skill Solutions"
        description="Admin and Sub-Admin Panel for Sudhoshan Skill Solutions"
      />
      <SupervisorAuthLayout>
        <SupervisorSignInForm />
      </SupervisorAuthLayout>
    </>
  );
}
