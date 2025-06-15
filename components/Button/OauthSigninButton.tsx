import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import Image from "next/image";

export function GithubSigninButton() {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      onClick={() => {
        signIn("github", { callbackUrl: "/dashboard" });
      }}
      className="bg-gray-200 px-3 py-2 rounded-lg h-10 flex gap-2 justify-center items-center"
    >
      <span>Signin with Github</span>
      <div className="relative w-5 h-5">
        <Image
          src={"/github_logo.png"}
          alt="github_logo"
          fill
          className="object-containe object-cover"
        />
      </div>
    </motion.button>
  );
}
