import { AuthContext } from "../../context/AuthContext";
import assets from "../assets/assets";
import { useContext, useState } from "react";
import { BiHide } from "react-icons/bi";
import { FaEye } from "react-icons/fa";

const LoginPage = () => {
  const [currentState, setcurrentState] = useState("signup");
  const [fullname, setfullname] = useState("");
  const [email, setemail] = useState("");
  const [password, setpassword] = useState("");
  const [isDataSubmitted, setisDataSubmitted] = useState(false);
  const [agree, setAgree] = useState(false);
  const [showCheckboxError, setShowCheckboxError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useContext(AuthContext);

  const submithandler = (event) => {
    event.preventDefault();

    if (!agree) {
      setShowCheckboxError(true);
      return;
    }

    setShowCheckboxError(false);
    login(currentState, {
      fullName: fullname,
      email,
      password,
    });
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-black text-white">
      {/* Left section */}
      <div className="md:w-1/2 flex flex-col justify-center items-center p-8 text-center bg-black">
        <img src={assets.logo_icon} alt="logo" className="md:w-[230px]  w-[120px] mb-2" />
        <h1 className="text-3xl font-bold font-serif mb-1">Welcome to FluxChat</h1>
        
      </div>

      {/* Right section */}
      <div className="md:w-96 flex justify-center items-center mx-2 md:mt-3 md:mb-3 bg-black border text-white py-12 px-6 sm:px-10 rounded-3xl md:rounded-l-3xl shadow-lg relative overflow-hidden">
        <form onSubmit={submithandler} className="w-full max-w-md z-10">
          <h2 className="text-2xl font-semibold text-center mb-6">
            {currentState === "signup" ? "Sign Up" : "Login"}
          </h2>

          {currentState === "signup" && !isDataSubmitted && (
            <input
              onChange={(e) => setfullname(e.target.value)}
              value={fullname}
              type="text"
              placeholder="Full Name"
              required
              className="w-full p-3 mb-4 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400 bg-transparent text-white"
            />
          )}

          {!isDataSubmitted && (
            <>
              <input
                onChange={(e) => setemail(e.target.value)}
                value={email}
                type="email"
                placeholder="Email Address"
                required
                className="w-full p-3 mb-4 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400 bg-transparent text-white"
              />

              <div className="relative mb-4">
                <input
                  onChange={(e) => setpassword(e.target.value)}
                  value={password}
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  required
                  className="w-full p-3 border rounded pr-12 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-transparent text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-400"
                >
                  {showPassword ? <FaEye /> : <BiHide />}
                </button>
              </div>
            </>
          )}

          <div className="flex items-center text-sm mb-4">
            <input
              type="checkbox"
              checked={agree}
              onChange={() => {
                setAgree(!agree);
                if (showCheckboxError) setShowCheckboxError(false);
              }}
              className="mr-2"
            />
            <p>Agree to the terms of use & privacy policy</p>
          </div>

          {showCheckboxError && (
            <p className="text-red-500 text-sm mb-4">
              Please agree to the terms before continuing.
            </p>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r  from-purple-500 to-blue-500 text-white rounded hover:brightness-90 transition"
          >
            {currentState === "signup" ? "Create Account" : "Login"}
          </button>

          <div className="mt-6 text-center text-sm">
            {currentState === "signup" ? (
              <p>
                Already have an account?{" "}
                <span
                  onClick={() => {
                    setcurrentState("login");
                    setisDataSubmitted(false);
                  }}
                  className="text-blue-500 font-semibold cursor-pointer hover:underline"
                >
                  Login here
                </span>
              </p>
            ) : (
              <p>
                Don't have an account?{" "}
                <span
                  onClick={() => setcurrentState("signup")}
                  className="text-blue-500 font-semibold cursor-pointer hover:underline"
                >
                  Sign up
                </span>
              </p>
            )}
          </div>
        </form>

        {/* Light circle background */}
        <div className="absolute -top-20 -left-20 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
      </div>
    </div>
  );
};

export default LoginPage;
