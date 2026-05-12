import { SignIn } from '@clerk/clerk-react';

const Login = () => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-zinc-950">
      <div className="w-full max-w-md px-4">
        <SignIn 
          routing="path" 
          path="/login" 
          signUpUrl="/register"
          redirectUrl="/"
        />
      </div>
    </div>
  );
};

export default Login;