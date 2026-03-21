import SignInForm from "../../../../components/auth/SubAdmin/SignInForm";
import PageMeta from "../../../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";

export default function SubAdminSignIn() {
  return (
    <>
      <PageMeta
        title="Sudhoshan Skill Solutions"
        description="Admin and Sub-Admin Panel for Sudhoshan Skill Solutions"
      />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}
