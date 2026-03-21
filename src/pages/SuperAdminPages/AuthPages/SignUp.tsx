import PageMeta from "../../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignUpForm from "../../../components/auth/SignUpForm";

export default function SignUp() {
  return (
    <>
     <PageMeta
        title="Sudhoshan Skill Solutions"
        description="Admin and Sub-Admin Panel for Sudhoshan Skill Solutions"
      />
      <AuthLayout>
        <SignUpForm />
      </AuthLayout>
    </>
  );
}
