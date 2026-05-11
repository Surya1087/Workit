import { SignIn } from '@clerk/clerk-react';

const Login = () => (
  <div className="min-h-screen flex items-center justify-center bg-zinc-950">
    <SignIn routing="path" path="/login" signUpUrl="/register" />
  </div>
);

export default Login;