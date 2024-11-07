import Link from "next/link";
import SignIn from "./components/sign-in";
import UserAvatar from "./components/user-avatar";
import SignOut from "./components/sign-out";
import Artist from "./components/artist";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#f9fafc] text-slate-900">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <UserAvatar />
        <SignIn />
        <SignOut />
        <Artist />
      </div>
    </main>
  );
}
